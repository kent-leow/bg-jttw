import { applyProposalVoteOutcome } from "./rejectionCounter";
import { getRoleSplit, type SupportedPlayerCount } from "./roleSplitTable";
import { resolveMission, submitMissionCard, type MissionCard } from "./missionResolution";
import { validateTeamProposal } from "./teamProposal";
import type { RoleAssignment } from "./types";
import { resolveVotes, type Vote } from "./voteResolution";
import { checkOverallWin, type GameResult } from "./winCheck";

export type RoundPhase = "TeamProposal" | "TeamVote" | "MissionResolution" | "Assassination" | "GameOver";

export interface RoundLoopState {
  readonly roleAssignments: readonly RoleAssignment[];
  readonly playerCount: SupportedPlayerCount;
  readonly leaderIndex: number;
  readonly missionNumber: number; // 1-based, 1..5
  readonly rejectionCount: number;
  readonly missionResults: readonly ("Success" | "Fail")[];
  readonly phase: RoundPhase;
  readonly result: GameResult;
  readonly resultReason?: string;
}

export function createInitialRoundLoopState(
  roleAssignments: readonly RoleAssignment[],
  leaderIndex = 0,
): RoundLoopState {
  const playerCount = roleAssignments.length as SupportedPlayerCount;
  getRoleSplit(playerCount); // throws for an unsupported player count
  return {
    roleAssignments,
    playerCount,
    leaderIndex,
    missionNumber: 1,
    rejectionCount: 0,
    missionResults: [],
    phase: "TeamProposal",
    result: null,
  };
}

function currentMissionSize(state: RoundLoopState): number {
  return getRoleSplit(state.playerCount).missionSizes[state.missionNumber - 1]!;
}

export function proposeTeam(
  state: RoundLoopState,
  proposedPlayerIds: readonly string[],
): { valid: boolean; reason?: string } {
  return validateTeamProposal(proposedPlayerIds, currentMissionSize(state));
}

export function submitVotesAndAdvance(
  state: RoundLoopState,
  votes: Readonly<Record<string, Vote>>,
): RoundLoopState {
  const { passed } = resolveVotes(votes);
  const { rejectionCount, hammer } = applyProposalVoteOutcome(state.rejectionCount, passed);

  if (hammer) {
    return {
      ...state,
      rejectionCount,
      leaderIndex: (state.leaderIndex + 1) % state.playerCount,
      phase: "GameOver",
      result: "EvilWin",
      resultReason: "5 consecutive rejected proposals",
    };
  }
  if (!passed) {
    return {
      ...state,
      rejectionCount,
      leaderIndex: (state.leaderIndex + 1) % state.playerCount,
      phase: "TeamProposal",
    };
  }
  return { ...state, rejectionCount, phase: "MissionResolution" };
}

export function submitMissionCardsAndAdvance(
  state: RoundLoopState,
  teamPlayerIds: readonly string[],
  cardsByPlayerId: Readonly<Record<string, MissionCard>>,
): RoundLoopState {
  const alignmentByPlayerId = new Map(state.roleAssignments.map((a) => [a.playerId, a.role.alignment]));
  const cards = teamPlayerIds.map((playerId) => {
    const alignment = alignmentByPlayerId.get(playerId);
    if (!alignment) {
      throw new Error(`Unknown player id in mission team: ${playerId}`);
    }
    return submitMissionCard(alignment, cardsByPlayerId[playerId]!);
  });

  const failThreshold = getRoleSplit(state.playerCount).failThresholds[state.missionNumber - 1]!;
  const { result: missionResult } = resolveMission(cards, failThreshold);
  const missionResults = [...state.missionResults, missionResult];
  const overallWin = checkOverallWin(missionResults);

  if (overallWin.result) {
    return {
      ...state,
      missionResults,
      phase: "GameOver",
      result: overallWin.result,
      resultReason: overallWin.reason,
    };
  }
  if (overallWin.proceedToAssassination) {
    return { ...state, missionResults, phase: "Assassination" };
  }
  return {
    ...state,
    missionResults,
    rejectionCount: 0,
    leaderIndex: (state.leaderIndex + 1) % state.playerCount,
    missionNumber: state.missionNumber + 1,
    phase: "TeamProposal",
  };
}

export function resolveAssassinationAndFinish(state: RoundLoopState, targetPlayerId: string): RoundLoopState {
  const merlin = state.roleAssignments.find((a) => a.role.name === "Merlin");
  if (!merlin) {
    throw new Error("No Merlin assignment found; cannot resolve assassination.");
  }
  const result: GameResult = targetPlayerId === merlin.playerId ? "EvilWin" : "GoodWin";
  const reason =
    result === "EvilWin"
      ? "Assassin correctly identified Merlin"
      : "Assassin failed to identify Merlin";
  return { ...state, phase: "GameOver", result, resultReason: reason };
}
