import { useState, useCallback } from "react";
import { assignRoles } from "../engine/assignRoles";
import { buildRolePool } from "../engine/rolePool";
import { getRoleSplit } from "../engine/roleSplitTable";
import { computeHiddenKnowledge, type HiddenKnowledge } from "../engine/hiddenKnowledge";
import {
  createInitialRoundLoopState,
  proposeTeam,
  submitVotesAndAdvance,
  submitMissionCardsAndAdvance,
  resolveAssassinationAndFinish,
  type RoundLoopState,
} from "../engine/roundLoop";
import { rematch as engineRematch } from "../engine/rematch";
import { readSnapshot, writeSnapshot, clearSnapshot, type LobbyPlayer, type GameSnapshot } from "./localGameSnapshot";
import type { RoleAssignment } from "../engine/types";
import type { Vote } from "../engine/voteResolution";
import type { MissionCard } from "../engine/missionResolution";

export interface UseLocalGameStateResult {
  readonly roundLoopState: RoundLoopState | null;
  readonly roleAssignments: readonly RoleAssignment[];
  readonly hiddenKnowledgeByPlayerId: Map<string, HiddenKnowledge>;
  readonly roster: readonly LobbyPlayer[];
  startGame(roster: readonly LobbyPlayer[]): void;
  proposeTeam(teamPlayerIds: readonly string[]): { valid: boolean; reason?: string };
  castVote(votes: Readonly<Record<string, Vote>>): void;
  submitMissionCard(teamPlayerIds: readonly string[], cardsByPlayerId: Readonly<Record<string, MissionCard>>): void;
  submitAssassinationGuess(targetPlayerId: string): void;
  rematch(): void;
  endSession(): void;
}

/**
 * A transport-free game orchestrator that drives the same engine/roundLoop state machine
 * purely in local React state on one device — no encryption, no broadcast.
 * Persists to localGameSnapshot after every state change.
 */
export function useLocalGameState(): UseLocalGameStateResult {
  const [roundLoopState, setRoundLoopState] = useState<RoundLoopState | null>(null);
  const [roleAssignments, setRoleAssignments] = useState<readonly RoleAssignment[]>([]);
  const [hiddenKnowledgeByPlayerId, setHiddenKnowledgeByPlayerId] = useState<Map<string, HiddenKnowledge>>(new Map());
  const [roster, setRoster] = useState<readonly LobbyPlayer[]>([]);

  const startGame = useCallback((playerRoster: readonly LobbyPlayer[]) => {
    const split = getRoleSplit(playerRoster.length);
    const rolePool = buildRolePool(split);
    const assignments = assignRoles(
      playerRoster.map((p) => p.id),
      rolePool,
    );
    const hiddenKnowledge = computeHiddenKnowledge(assignments);
    const knowledgeMap = new Map(hiddenKnowledge.map((hk) => [hk.playerId, hk]));

    const initialState = createInitialRoundLoopState(assignments);

    const snapshot: GameSnapshot = {
      roster: playerRoster,
      roleAssignments: assignments,
      roundLoopState: initialState,
    };

    writeSnapshot(snapshot);

    setRoster(playerRoster);
    setRoleAssignments(assignments);
    setHiddenKnowledgeByPlayerId(knowledgeMap);
    setRoundLoopState(initialState);
  }, []);

  const proposeTeamHandler = useCallback(
    (teamPlayerIds: readonly string[]): { valid: boolean; reason?: string } => {
      if (!roundLoopState) return { valid: false, reason: "No game in progress" };
      return proposeTeam(roundLoopState, teamPlayerIds);
    },
    [roundLoopState],
  );

  const castVote = useCallback(
    (votes: Readonly<Record<string, Vote>>) => {
      if (!roundLoopState) return;

      const newState = submitVotesAndAdvance(roundLoopState, votes);

      const snapshot: GameSnapshot = {
        roster,
        roleAssignments,
        roundLoopState: newState,
      };
      writeSnapshot(snapshot);

      setRoundLoopState(newState);
    },
    [roundLoopState, roster, roleAssignments],
  );

  const submitMissionCardHandler = useCallback(
    (teamPlayerIds: readonly string[], cardsByPlayerId: Readonly<Record<string, MissionCard>>) => {
      if (!roundLoopState) return;

      const newState = submitMissionCardsAndAdvance(roundLoopState, teamPlayerIds, cardsByPlayerId);

      const snapshot: GameSnapshot = {
        roster,
        roleAssignments,
        roundLoopState: newState,
      };
      writeSnapshot(snapshot);

      setRoundLoopState(newState);
    },
    [roundLoopState, roster, roleAssignments],
  );

  const submitAssassinationGuess = useCallback(
    (targetPlayerId: string) => {
      if (!roundLoopState) return;

      const newState = resolveAssassinationAndFinish(roundLoopState, targetPlayerId);

      const snapshot: GameSnapshot = {
        roster,
        roleAssignments,
        roundLoopState: newState,
      };
      writeSnapshot(snapshot);

      setRoundLoopState(newState);
    },
    [roundLoopState, roster, roleAssignments],
  );

  const rematchHandler = useCallback(() => {
    if (roster.length === 0) return;

    const result = engineRematch(roster.map((p) => p.id));
    const hiddenKnowledge = computeHiddenKnowledge(result.roleAssignments);
    const knowledgeMap = new Map(hiddenKnowledge.map((hk) => [hk.playerId, hk]));

    const snapshot: GameSnapshot = {
      roster,
      roleAssignments: result.roleAssignments,
      roundLoopState: result.roundLoopState,
    };
    writeSnapshot(snapshot);

    setRoleAssignments(result.roleAssignments);
    setHiddenKnowledgeByPlayerId(knowledgeMap);
    setRoundLoopState(result.roundLoopState);
  }, [roster]);

  const endSession = useCallback(() => {
    clearSnapshot();
    setRoster([]);
    setRoleAssignments([]);
    setHiddenKnowledgeByPlayerId(new Map());
    setRoundLoopState(null);
  }, []);

  return {
    roundLoopState,
    roleAssignments,
    hiddenKnowledgeByPlayerId,
    roster,
    startGame,
    proposeTeam: proposeTeamHandler,
    castVote,
    submitMissionCard: submitMissionCardHandler,
    submitAssassinationGuess,
    rematch: rematchHandler,
    endSession,
  };
}
