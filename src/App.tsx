import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { completeConnection, type CompleteConnectionResult } from "./connection/completeConnection";
import { createDataChannelTransport, type DataChannelTransport } from "./connection/dataChannelTransport";
import { generateHostOffer, type HostOfferResult } from "./connection/generateHostOffer";
import { generateJoinAnswer, type JoinAnswerResult } from "./connection/generateJoinAnswer";
import { HostOrchestrator, type HostOrchestratorPlayer, type PublicGameStateView } from "./connection/hostOrchestrator";
import type { HostReachabilityCheck } from "./connection/reestablishConnection";
import { RoomHub, type RoomHubMessage } from "./connection/roomHub";
import { generateKeyPair } from "./crypto/keyPair";
import type { MissionCard } from "./engine/missionResolution";
import type { Vote } from "./engine/voteResolution";
import { AppRoot } from "./pages/AppRoot";
import { AssassinationPage } from "./pages/AssassinationPage";
import { EndGamePage, type RevealedPlayer } from "./pages/EndGamePage";
import { GameBoardPage } from "./pages/GameBoardPage";
import { HostSetupPage } from "./pages/HostSetupPage";
import { JoinPage } from "./pages/JoinPage";
import { LandingPage } from "./pages/LandingPage";
import { LobbyPage, type LobbyPlayer } from "./pages/LobbyPage";
import { MissionResultPage } from "./pages/MissionResultPage";
import { SealBadge } from "./pages/components/SealBadge";
import type { QrScannerProps } from "./pages/components/QrScanner";
import { writeLocalIdentity } from "./state/localIdentity";
import { usePlayerGameState, type PlayerActionTransport, type PlayerRoleInfo } from "./state/usePlayerGameState";

// No backend/signaling server exists, so there is no real notion of a persistent "room id"; this
// constant is only used as the required (but otherwise unused) key for the local rejoin snapshot.
const JOINER_ROOM_ID = "local-room";

function dispatchToOrchestrator(orchestrator: HostOrchestrator, message: unknown): void {
  if (typeof message !== "object" || message === null || !("type" in message)) {
    return;
  }
  const m = message as { type: string; [key: string]: unknown };
  switch (m.type) {
    case "proposeTeam":
      orchestrator.proposeTeam(m.teamPlayerIds as readonly string[]);
      break;
    case "castVote":
      orchestrator.castVote(m.playerId as string, m.vote as Vote);
      break;
    case "submitMissionCard":
      orchestrator.submitMissionCard(m.playerId as string, m.card as MissionCard);
      break;
    case "submitAssassinationGuess":
      orchestrator.submitAssassinationGuess(m.targetPlayerId as string);
      break;
    default:
      break;
  }
}

/** Bridges a peer's real inbound transport messages into a local single-peer RoomHub mailbox. */
function bridgeTransportIntoLocalHub(transport: DataChannelTransport, localHub: RoomHub): void {
  transport.onMessage((incoming) => {
    const message = incoming as RoomHubMessage;
    if (message.kind === "broadcast") {
      localHub.broadcastPublicState(message.payload);
    } else if (message.kind === "direct") {
      localHub.relayToPlayer(message.targetPlayerId, message.payload);
    }
  });
}

async function exportPublicKeyJwk(publicKey: CryptoKey): Promise<JsonWebKey> {
  return crypto.subtle.exportKey("jwk", publicKey);
}

async function importPublicKeyJwk(jwk: JsonWebKey): Promise<CryptoKey> {
  return crypto.subtle.importKey("jwk", jwk, { name: "RSA-OAEP", hash: "SHA-256" }, true, ["encrypt"]);
}

interface GameChromeProps {
  readonly selfPlayerId: string;
  readonly gameState: PublicGameStateView | null;
  readonly roleInfo: PlayerRoleInfo | null;
  readonly isHost: boolean;
  readonly players: readonly LobbyPlayer[];
  readonly proposeTeam: (teamPlayerIds: readonly string[]) => void;
  readonly castVote: (vote: Vote) => void;
  readonly submitMissionCard: (card: MissionCard) => void;
  readonly submitAssassinationGuess: (targetPlayerId: string) => void;
  readonly onRematch?: () => void;
  readonly onEndSession?: () => void;
}

/**
 * Shared post-role-reveal game chrome: RoleReveal -> GameBoard -> MissionResult -> Assassination -> EndGame.
 * Known limitation: EndGamePage's "every player's true role" reveal is only complete on the host's own
 * device (which has direct access to the full role assignment); non-host devices only know their own role,
 * since the broadcast `PublicGameStateView` deliberately never carries other players' secret roles.
 */
function GameChrome({
  selfPlayerId,
  gameState,
  roleInfo,
  isHost,
  players,
  proposeTeam,
  castVote,
  submitMissionCard,
  submitAssassinationGuess,
  onRematch,
  onEndSession,
}: GameChromeProps) {
  const [roleAcknowledged, setRoleAcknowledged] = useState(false);
  const [lastSeenMissionCount, setLastSeenMissionCount] = useState(0);
  const previousRoleInfoRef = useRef<PlayerRoleInfo | null>(null);

  // A rematch delivers a brand-new (differently-referenced) roleInfo; re-show RoleReveal for it.
  useEffect(() => {
    if (roleInfo && roleInfo !== previousRoleInfoRef.current) {
      previousRoleInfoRef.current = roleInfo;
      setRoleAcknowledged(false);
      setLastSeenMissionCount(0);
    }
  }, [roleInfo]);

  if (!roleInfo) {
    return (
      <section className="page page--centered">
        <p role="status" className="status-text">Revealing your role…</p>
      </section>
    );
  }
  if (!roleAcknowledged) {
    return (
      <section className="page page--centered">
        <SealBadge variant={roleInfo.role.alignment === "Good" ? "good" : "evil"} />
        <h1 data-testid="role-reveal-name">{roleInfo.role.name}</h1>
        <p data-testid="role-reveal-alignment" className="page__hint">{roleInfo.role.alignment}</p>
        <button type="button" className="btn btn--primary" onClick={() => setRoleAcknowledged(true)}>
          Continue
        </button>
      </section>
    );
  }
  if (!gameState) {
    return (
      <section className="page page--centered">
        <p role="status" className="status-text">Waiting for the game to begin…</p>
      </section>
    );
  }

  if (gameState.missionResults.length > lastSeenMissionCount) {
    return (
      <section className="page page--centered">
        <MissionResultPage result={gameState.missionResults[gameState.missionResults.length - 1]!} />
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => setLastSeenMissionCount(gameState.missionResults.length)}
        >
          Continue
        </button>
      </section>
    );
  }

  if (gameState.result) {
    const revealedPlayers: RevealedPlayer[] = players.map((p) => ({
      id: p.id,
      displayName: p.displayName,
      role: p.id === selfPlayerId ? roleInfo.role : { name: "LoyalServant", alignment: "Good" },
    }));
    return (
      <EndGamePage
        result={gameState.result}
        resultReason={gameState.resultReason ?? ""}
        players={revealedPlayers}
        isHost={isHost}
        onRematch={onRematch}
        onEndSession={onEndSession}
      />
    );
  }

  if (gameState.phase === "Assassination") {
    return (
      <AssassinationPage
        isAssassin={roleInfo.role.name === "Assassin"}
        players={players}
        onSelectTarget={submitAssassinationGuess}
      />
    );
  }

  if (gameState.phase === "MissionResolution") {
    if (gameState.teamProposal?.includes(selfPlayerId)) {
      return (
        <section className="page page--centered">
          <h1>Submit Your Mission Card</h1>
          <div className="scroll-card">
            <button type="button" className="btn btn--approve" onClick={() => submitMissionCard("Success")}>
              Success
            </button>
            {roleInfo.role.alignment === "Evil" && (
              <button type="button" className="btn btn--reject" onClick={() => submitMissionCard("Fail")}>
                Fail
              </button>
            )}
          </div>
        </section>
      );
    }
    return (
      <section className="page page--centered">
        <p role="status" className="status-text">Waiting for the mission team to submit their cards…</p>
      </section>
    );
  }

  return (
    <GameBoardPage
      // Remounts GameBoardPage for every fresh proposal/vote cycle (mission advances, or leader
      // rotates after a rejection) so its internal hasVoted/selectedTeam state doesn't get stuck.
      key={`${gameState.missionNumber}-${gameState.leaderId}`}
      players={players}
      leaderId={gameState.leaderId}
      requiredTeamSize={gameState.requiredTeamSize}
      isHost={isHost}
      isLeader={gameState.leaderId === selfPlayerId}
      votes={gameState.votes}
      onProposeTeam={proposeTeam}
      onCastVote={castVote}
      onNext={() => {}}
    />
  );
}

export interface HostFlowDependencies {
  readonly generateOffer?: () => Promise<HostOfferResult>;
  readonly completeJoin?: (peerConnection: RTCPeerConnection, answer: unknown) => Promise<CompleteConnectionResult>;
  readonly requestCamera?: QrScannerProps["requestCamera"];
  readonly startScanLoop?: QrScannerProps["startScanLoop"];
}

interface ConnectedPeer {
  readonly playerId: string;
  readonly displayName: string;
  readonly transport: DataChannelTransport;
  readonly publicKey: CryptoKey;
}

function HostFlow({ dependencies }: { dependencies?: HostFlowDependencies }) {
  const [identity, setIdentity] = useState<{ playerId: string; publicKey: CryptoKey; privateKey: CryptoKey } | null>(
    null,
  );
  const hubRef = useRef<RoomHub | null>(null);
  const orchestratorRef = useRef<HostOrchestrator | null>(null);
  const peersRef = useRef<Map<string, ConnectedPeer>>(new Map());
  const pendingRef = useRef<{ playerId: string; peerConnection: RTCPeerConnection; dataChannel: RTCDataChannel } | null>(
    null,
  );
  const [displayPlayers, setDisplayPlayers] = useState<LobbyPlayer[]>([]);
  const [phase, setPhase] = useState<"setup" | "lobby" | "game">("setup");
  const [playerCount, setPlayerCount] = useState<number | null>(null);

  useEffect(() => {
    generateKeyPair().then(({ publicKey, privateKey }) => {
      hubRef.current = new RoomHub();
      orchestratorRef.current = new HostOrchestrator(hubRef.current);
      setIdentity({ playerId: crypto.randomUUID(), publicKey, privateKey });
    });
  }, []);

  const broadcastPlayerList = useCallback(
    (hostPlayerId: string) => {
      if (!hubRef.current) {
        return;
      }
      const list: LobbyPlayer[] = [
        { id: hostPlayerId, displayName: "Host" },
        ...Array.from(peersRef.current.values()).map((p) => ({ id: p.playerId, displayName: p.displayName })),
      ];
      setDisplayPlayers(list);
      hubRef.current.broadcastPublicState({ kind: "playerList", players: list });
    },
    [],
  );

  const generateOfferWrapper = useCallback(async (): Promise<HostOfferResult> => {
    const factory = dependencies?.generateOffer ?? generateHostOffer;
    const result = await factory();
    pendingRef.current = {
      playerId: crypto.randomUUID(),
      peerConnection: result.peerConnection,
      dataChannel: result.dataChannel,
    };
    return result;
  }, [dependencies]);

  const completeJoinWrapper = useCallback(
    async (peerConnection: RTCPeerConnection, answer: unknown): Promise<CompleteConnectionResult> => {
      const complete = dependencies?.completeJoin ?? completeConnection;
      const result = await complete(peerConnection, answer);
      if (!result.connectionEstablished || !pendingRef.current || !hubRef.current || !identity) {
        return result;
      }
      const { dataChannel, playerId: fallbackPlayerId } = pendingRef.current;
      pendingRef.current = null;
      const jwk = (answer as { publicKeyJwk?: JsonWebKey }).publicKeyJwk;
      if (!jwk) {
        return result;
      }
      // The joiner's own generated identity (embedded in the answer) is authoritative — both sides
      // must agree on the same player id for relayed/broadcast messages to reach the right peer.
      const playerId = (answer as { playerId?: string }).playerId ?? fallbackPlayerId;
      const publicKey = await importPublicKeyJwk(jwk);
      const transport = createDataChannelTransport(dataChannel);
      hubRef.current.connect({ playerId, onMessage: (message) => transport.send(message) });
      transport.onMessage((incoming) => {
        if (orchestratorRef.current) {
          dispatchToOrchestrator(orchestratorRef.current, incoming);
        }
      });
      peersRef.current.set(playerId, {
        playerId,
        displayName: `Player ${peersRef.current.size + 2}`,
        transport,
        publicKey,
      });
      broadcastPlayerList(identity.playerId);
      return result;
    },
    [dependencies, broadcastPlayerList, identity],
  );

  const handleSeatsFilled = useCallback((joinerCount: number) => {
    // HostSetupPage's own seat counter only counts joiner connections, not the host's own seat
    // (it starts room.players at 0, not 1 as gameplay.md Flow 1 step 5 documents) — compensate here
    // so the Lobby/orchestrator see the true total headcount (host + joiners).
    setPlayerCount(joinerCount + 1);
    setPhase("lobby");
  }, []);

  // Re-announce the player list once the Lobby mounts, since it only reacts to broadcasts
  // received after it subscribes (any broadcasts sent during Host Setup would otherwise be missed).
  useEffect(() => {
    if (phase === "lobby" && identity) {
      broadcastPlayerList(identity.playerId);
    }
  }, [phase, identity, broadcastPlayerList]);

  const hostTransport = useMemo<PlayerActionTransport>(
    () => ({
      send: (message) => {
        if (orchestratorRef.current) {
          dispatchToOrchestrator(orchestratorRef.current, message);
        }
      },
    }),
    [],
  );

  const hookResult = usePlayerGameState({
    roomHub: hubRef.current ?? new RoomHub(),
    playerId: identity?.playerId ?? "pending-host",
    privateKey: identity?.privateKey ?? ({} as CryptoKey),
    transport: hostTransport,
  });

  const handleLobbyStartGame = useCallback(async () => {
    if (!identity || !orchestratorRef.current) {
      return;
    }
    const players: HostOrchestratorPlayer[] = [
      { playerId: identity.playerId, publicKey: identity.publicKey },
      ...Array.from(peersRef.current.values()).map((p) => ({ playerId: p.playerId, publicKey: p.publicKey })),
    ];
    await orchestratorRef.current.startGame(players);
    setPhase("game");
  }, [identity]);

  const handleRematch = useCallback(() => {
    orchestratorRef.current?.requestRematch();
  }, []);

  if (!identity) {
    return <p role="status">Preparing host session…</p>;
  }

  if (phase === "setup") {
    return (
      <HostSetupPage
        generateOffer={generateOfferWrapper}
        completeJoin={completeJoinWrapper}
        requestCamera={dependencies?.requestCamera}
        startScanLoop={dependencies?.startScanLoop}
        onStartGame={handleSeatsFilled}
      />
    );
  }

  if (phase === "lobby") {
    return (
      <LobbyPage
        roomHub={hubRef.current!}
        selfPlayerId={`${identity.playerId}:lobby-observer`}
        playerCount={playerCount ?? 0}
        isHost
        onStartGame={handleLobbyStartGame}
      />
    );
  }

  return (
    <GameChrome
      selfPlayerId={identity.playerId}
      gameState={hookResult.gameState}
      roleInfo={hookResult.roleInfo}
      isHost
      players={displayPlayers}
      proposeTeam={hookResult.proposeTeam}
      castVote={hookResult.castVote}
      submitMissionCard={hookResult.submitMissionCard}
      submitAssassinationGuess={hookResult.submitAssassinationGuess}
      onRematch={handleRematch}
      onEndSession={() => hubRef.current?.disconnect(identity.playerId)}
    />
  );
}

export interface JoinFlowDependencies {
  readonly generateAnswer?: typeof generateJoinAnswer;
  readonly requestCamera?: QrScannerProps["requestCamera"];
  readonly startScanLoop?: QrScannerProps["startScanLoop"];
  readonly generateKeyPair?: typeof generateKeyPair;
  readonly generatePlayerId?: () => string;
}

function JoinFlow({ dependencies }: { dependencies?: JoinFlowDependencies }) {
  const [connected, setConnected] = useState<{
    playerId: string;
    privateKey: CryptoKey;
    localHub: RoomHub;
    transport: DataChannelTransport;
  } | null>(null);

  const generateAnswerWrapper = useCallback(
    async (hostOffer: unknown): Promise<JoinAnswerResult> => {
      const factory = dependencies?.generateAnswer ?? generateJoinAnswer;
      const result = await factory(hostOffer);
      const generateKeyPairImpl = dependencies?.generateKeyPair ?? generateKeyPair;
      const { publicKey, privateKey } = await generateKeyPairImpl();
      const publicKeyJwk = await exportPublicKeyJwk(publicKey);
      const playerId = (dependencies?.generatePlayerId ?? (() => crypto.randomUUID()))();
      const transport = createDataChannelTransport(result.dataChannel);
      const localHub = new RoomHub();
      bridgeTransportIntoLocalHub(transport, localHub);
      setConnected({ playerId, privateKey, localHub, transport });
      return { ...result, answer: { ...result.answer, publicKeyJwk, playerId } } as unknown as JoinAnswerResult;
    },
    [dependencies],
  );

  if (!connected) {
    return (
      <JoinPage
        generateAnswer={generateAnswerWrapper}
        requestCamera={dependencies?.requestCamera}
        startScanLoop={dependencies?.startScanLoop}
      />
    );
  }

  return <JoinFlowInGame connected={connected} />;
}

function JoinFlowInGame({
  connected,
}: {
  connected: { playerId: string; privateKey: CryptoKey; localHub: RoomHub; transport: DataChannelTransport };
}) {
  const transport = useMemo<PlayerActionTransport>(
    () => ({ send: (message) => connected.transport.send(message) }),
    [connected.transport],
  );
  const hookResult = usePlayerGameState({
    roomHub: connected.localHub,
    playerId: connected.playerId,
    privateKey: connected.privateKey,
    transport,
  });

  // Persist the latest known page so a mid-game reload can restore it (gameplay.md Flow 7); the
  // actual live connection cannot survive a reload, so this is a read-only snapshot restore.
  useEffect(() => {
    writeLocalIdentity({
      playerId: connected.playerId,
      roomId: JOINER_ROOM_ID,
      lastKnownState: {
        selfPlayerId: connected.playerId,
        gameState: hookResult.gameState,
        roleInfo: hookResult.roleInfo,
      },
    });
  }, [connected.playerId, hookResult.gameState, hookResult.roleInfo]);

  const players: LobbyPlayer[] = (hookResult.gameState?.players ?? []).map((id) => ({ id, displayName: id }));

  if (!hookResult.gameState) {
    return (
      <LobbyPage
        roomHub={connected.localHub}
        selfPlayerId={`${connected.playerId}:lobby-observer`}
        playerCount={0}
        isHost={false}
      />
    );
  }

  return (
    <GameChrome
      selfPlayerId={connected.playerId}
      gameState={hookResult.gameState}
      roleInfo={hookResult.roleInfo}
      isHost={false}
      players={players}
      proposeTeam={hookResult.proposeTeam}
      castVote={hookResult.castVote}
      submitMissionCard={hookResult.submitMissionCard}
      submitAssassinationGuess={hookResult.submitAssassinationGuess}
    />
  );
}

export interface AppProps {
  readonly hostDependencies?: HostFlowDependencies;
  readonly joinDependencies?: JoinFlowDependencies;
  readonly checkHostReachable?: HostReachabilityCheck;
}

type LandingFlow = "landing" | "host" | "join";

function NewPlayerFlow({ hostDependencies, joinDependencies }: AppProps) {
  const [flow, setFlow] = useState<LandingFlow>("landing");

  if (flow === "landing") {
    return <LandingPage onHost={() => setFlow("host")} onJoin={() => setFlow("join")} />;
  }
  if (flow === "host") {
    return <HostFlow dependencies={hostDependencies} />;
  }
  return <JoinFlow dependencies={joinDependencies} />;
}

export function App({ hostDependencies, joinDependencies, checkHostReachable }: AppProps) {
  return (
    <AppRoot
      checkHostReachable={checkHostReachable}
      renderNewPlayerEntry={() => (
        <NewPlayerFlow hostDependencies={hostDependencies} joinDependencies={joinDependencies} />
      )}
      renderRestoredState={(currentState) => {
        const restored = currentState as {
          selfPlayerId: string;
          gameState: PublicGameStateView | null;
          roleInfo: PlayerRoleInfo | null;
        } | null;
        if (!restored) {
          return <p role="alert">Unable to restore your prior session.</p>;
        }
        const players: LobbyPlayer[] = (restored.gameState?.players ?? []).map((id) => ({ id, displayName: id }));
        return (
          <GameChrome
            selfPlayerId={restored.selfPlayerId}
            gameState={restored.gameState}
            roleInfo={restored.roleInfo}
            isHost={false}
            players={players}
            proposeTeam={() => {}}
            castVote={() => {}}
            submitMissionCard={() => {}}
            submitAssassinationGuess={() => {}}
          />
        );
      }}
    />
  );
}
