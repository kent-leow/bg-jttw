import { useEffect, useState } from "react";
import { LandingPage } from "./pages/LandingPage";
import { HostSetupPage, type RosterPlayer } from "./pages/HostSetupPage";
import { RoleRevealPage } from "./pages/RoleRevealPage";
import { GameBoardPage } from "./pages/GameBoardPage";
import { MissionResultPage } from "./pages/MissionResultPage";
import { AssassinationPage } from "./pages/AssassinationPage";
import { EndGamePage, type RevealedPlayer } from "./pages/EndGamePage";
import { ViewMyRoleMenu } from "./pages/components/ViewMyRoleMenu";
import { useLocalGameState } from "./state/useLocalGameState";
import { readSnapshot } from "./state/localGameSnapshot";
import type { LobbyPlayer } from "./state/localGameSnapshot";

type AppScreen =
  | "landing"
  | "setup"
  | "roleReveal"
  | "game"
  | "missionResult"
  | "assassination"
  | "endGame";

interface GameChromeProps {
  readonly roster: readonly LobbyPlayer[];
  readonly gameState: ReturnType<typeof useLocalGameState>;
  readonly onBackToLanding: () => void;
}

/**
 * GameChrome: Renders the appropriate game screen based on the current round loop phase.
 * Handles team proposal, voting, mission resolution, assassination, and mission results.
 */
function GameChrome({ roster, gameState, onBackToLanding }: GameChromeProps) {
  const phase = gameState.roundLoopState?.phase;
  const result = gameState.roundLoopState?.result;

  // Show end game if result is set
  if (result) {
    const revealedPlayers: RevealedPlayer[] = roster.map((player) => {
      const assignment = gameState.roleAssignments.find((a) => a.playerId === player.id);
      return {
        id: player.id,
        displayName: player.displayName,
        role: assignment?.role ?? { name: "Merlin" as const, alignment: "Good" as const },
      };
    });

    return (
      <EndGamePage
        result={result}
        resultReason={gameState.roundLoopState?.resultReason || ""}
        players={revealedPlayers}
        isHost={true}
        onRematch={() => {
          gameState.rematch();
        }}
        onEndSession={() => {
          gameState.endSession();
          onBackToLanding();
        }}
      />
    );
  }

  if (!gameState.roundLoopState) {
    return <div>Loading game state...</div>;
  }

  const roleMap = new Map(gameState.roleAssignments.map((a) => [a.playerId, a.role]));
  const leaderId = roster[gameState.roundLoopState.leaderIndex]?.id;

  switch (phase) {
    case "TeamProposal": {
      const currentMissionIndex = gameState.roundLoopState.missionNumber - 1;
      const missionSizes = [2, 3, 4, 4, 3]; // Standard Avalon mission sizes
      const requiredTeamSize = missionSizes[currentMissionIndex] || 2;

      return (
        <div className="game-board-wrapper">
          <ViewMyRoleMenu
            selfPlayerId={roster[0]?.id || ""}
            selfDisplayName={roster[0]?.displayName || ""}
            roster={roster.map((p) => ({ id: p.id, displayName: p.displayName }))}
            roleByPlayerId={roleMap}
            hiddenKnowledgeByPlayerId={gameState.hiddenKnowledgeByPlayerId}
            visible={true}
          />
          <GameBoardPage
            players={roster}
            leaderId={leaderId || ""}
            requiredTeamSize={requiredTeamSize}
            failThreshold={1}
            isHost={true}
            isLeader={roster[0]?.id === leaderId}
            resolvedMissionCount={gameState.roundLoopState.missionResults.length}
            onProposeTeam={(proposedTeam) => {
              gameState.proposeTeam(proposedTeam);
            }}
            onAllVotesCast={(votes) => {
              gameState.castVote(votes);
            }}
            onMissionResult={() => {
              // Mission result shown in next render
            }}
          />
        </div>
      );
    }

    case "TeamVote": {
      // In single-device pass-and-play, voting is handled via GameBoardPage
      // which uses PassDeviceGate to show voting privately
      return (
        <div className="game-board-wrapper">
          <ViewMyRoleMenu
            selfPlayerId={roster[0]?.id || ""}
            selfDisplayName={roster[0]?.displayName || ""}
            roster={roster.map((p) => ({ id: p.id, displayName: p.displayName }))}
            roleByPlayerId={roleMap}
            hiddenKnowledgeByPlayerId={gameState.hiddenKnowledgeByPlayerId}
            visible={true}
          />
          <GameBoardPage
            players={roster}
            leaderId={leaderId || ""}
            requiredTeamSize={2}
            failThreshold={1}
            isHost={true}
            isLeader={roster[0]?.id === leaderId}
            resolvedMissionCount={gameState.roundLoopState.missionResults.length}
            onAllVotesCast={(votes) => {
              gameState.castVote(votes);
            }}
          />
        </div>
      );
    }

    case "MissionResolution": {
      const currentMissionIndex = gameState.roundLoopState.missionNumber - 1;
      const missionSizes = [2, 3, 4, 4, 3];
      const requiredTeamSize = missionSizes[currentMissionIndex] || 2;

      // Get the current team players (need to find which players voted approve)
      // For now, assume all non-leader players except those who would have voted reject
      const teamPlayers = roster.slice(0, requiredTeamSize);

      return (
        <div className="game-board-wrapper">
          <ViewMyRoleMenu
            selfPlayerId={roster[0]?.id || ""}
            selfDisplayName={roster[0]?.displayName || ""}
            roster={roster.map((p) => ({ id: p.id, displayName: p.displayName }))}
            roleByPlayerId={roleMap}
            hiddenKnowledgeByPlayerId={gameState.hiddenKnowledgeByPlayerId}
            visible={true}
          />
          <GameBoardPage
            players={roster}
            leaderId={leaderId || ""}
            requiredTeamSize={requiredTeamSize}
            failThreshold={1}
            isHost={true}
            isLeader={false}
            resolvedMissionCount={gameState.roundLoopState.missionResults.length}
            onMissionResult={() => {
              // Mission result shown next
            }}
          />
        </div>
      );
    }

    case "Assassination": {
      const assassin = gameState.roleAssignments.find((a) => a.role.name === "Assassin");
      const isAssassin = true; // In single-device, we just show if it's their turn

      return (
        <div className="game-board-wrapper">
          <AssassinationPage
            isAssassin={isAssassin}
            players={roster}
            onSelectTarget={(targetId) => {
              gameState.submitAssassinationGuess(targetId);
            }}
          />
        </div>
      );
    }

    case "GameOver":
    default:
      return <div>Game phase unknown: {phase}</div>;
  }
}

/**
 * App.tsx: Main application shell for the single-device pass-and-play game.
 * Handles: landing → setup → role reveal → game loop → end game → rematch or end session.
 * Restores from local snapshot on mount if available.
 */
export function App() {
  const gameState = useLocalGameState();
  const [screen, setScreen] = useState<AppScreen>("landing");
  const [roster, setRoster] = useState<readonly LobbyPlayer[]>([]);
  const [roleRevealComplete, setRoleRevealComplete] = useState(false);
  const [lastMissionCount, setLastMissionCount] = useState(0);

  // On mount, check for saved snapshot
  useEffect(() => {
    const snapshot = readSnapshot();
    if (snapshot) {
      // Restore from snapshot
      setRoster(snapshot.roster);
      setScreen("game");
      setRoleRevealComplete(true);
    }
  }, []);

  const handleStartGame = () => {
    setScreen("setup");
  };

  const handleRosterSetup = (setupRoster: readonly RosterPlayer[]) => {
    // Convert RosterPlayer to LobbyPlayer by adding IDs
    const lobbyRoster: LobbyPlayer[] = setupRoster.map((player, index) => ({
      id: `player-${index}`,
      displayName: player.displayName,
    }));

    setRoster(lobbyRoster);
    gameState.startGame(lobbyRoster);
    setScreen("roleReveal");
    setRoleRevealComplete(false);
  };

  const handleBackToLanding = () => {
    setScreen("landing");
    setRoster([]);
    setRoleRevealComplete(false);
    gameState.endSession();
  };

  // Check if we should transition to game screen after role reveal completes
  useEffect(() => {
    if (roleRevealComplete && screen === "roleReveal") {
      setScreen("game");
    }
  }, [roleRevealComplete, screen]);

  // Check if we're showing mission result after mission resolution
  useEffect(() => {
    if (
      gameState.roundLoopState &&
      gameState.roundLoopState.missionResults.length > lastMissionCount &&
      gameState.roundLoopState.phase !== "Assassination" &&
      gameState.roundLoopState.phase !== "GameOver"
    ) {
      setLastMissionCount(gameState.roundLoopState.missionResults.length);
      setScreen("missionResult");
      // Auto-advance to game screen after a short delay
      setTimeout(() => setScreen("game"), 2000);
    }
  }, [gameState.roundLoopState, lastMissionCount]);

  switch (screen) {
    case "landing":
      return <LandingPage onStartGame={handleStartGame} />;

    case "setup":
      return <HostSetupPage onStartGame={handleRosterSetup} onBack={handleBackToLanding} />;

    case "roleReveal": {
      const roleMap = new Map(gameState.roleAssignments.map((a) => [a.playerId, a.role]));
      return (
        <RoleRevealPage
          roster={roster}
          roleByPlayerId={roleMap}
          hiddenKnowledgeByPlayerId={gameState.hiddenKnowledgeByPlayerId}
          onRoleRevealComplete={() => setRoleRevealComplete(true)}
        />
      );
    }

    case "game":
      return roster.length > 0 ? (
        <GameChrome roster={roster} gameState={gameState} onBackToLanding={handleBackToLanding} />
      ) : null;

    case "missionResult": {
      if (!gameState.roundLoopState) return null;
      const lastMissionResult =
        gameState.roundLoopState.missionResults[gameState.roundLoopState.missionResults.length - 1];
      return lastMissionResult ? <MissionResultPage result={lastMissionResult} /> : null;
    }

    case "assassination":
      return (
        <div>
          <AssassinationPage
            isAssassin={true}
            players={roster}
            onSelectTarget={(targetId) => {
              gameState.submitAssassinationGuess(targetId);
              setScreen("game");
            }}
          />
        </div>
      );

    case "endGame":
    default:
      return null;
  }
}
