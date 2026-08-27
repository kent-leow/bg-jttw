import { decryptOwnPayload } from "../crypto/decryptOwnPayload";
import { encryptForPlayer, type EncryptedEnvelope } from "../crypto/encryptForPlayer";
import { assignRoles } from "../engine/assignRoles";
import { computeHiddenKnowledge } from "../engine/hiddenKnowledge";
import type { MissionCard } from "../engine/missionResolution";
import { rematch } from "../engine/rematch";
import { buildRolePool } from "../engine/rolePool";
import { getRoleSplit } from "../engine/roleSplitTable";
import {
  createInitialRoundLoopState,
  proposeTeam as validateTeamProposal,
  resolveAssassinationAndFinish,
  submitMissionCardsAndAdvance,
  submitVotesAndAdvance,
  type RoundLoopState,
} from "../engine/roundLoop";
import type { RoleAssignment } from "../engine/types";
import type { Vote } from "../engine/voteResolution";
import { RoomHub } from "./roomHub";

export interface HostOrchestratorPlayer {
  readonly playerId: string;
  readonly publicKey: CryptoKey;
}

export interface PublicGameStateView {
  readonly kind: "gameState";
  readonly players: readonly string[];
  readonly leaderId: string;
  readonly missionNumber: number;
  readonly requiredTeamSize: number;
  readonly phase: RoundLoopState["phase"];
  readonly teamProposal?: readonly string[];
  readonly votes: Readonly<Record<string, Vote>>;
  readonly missionResults: readonly ("Success" | "Fail")[];
  readonly result: RoundLoopState["result"];
  readonly resultReason?: string;
}

/**
 * Drives the authoritative host-side game state machine: composes the pure `engine/` functions
 * with `RoomHub` broadcasts and per-player encrypted relays. This is the single place that turns
 * isolated engine logic into an actual multiplayer game against connected peers.
 */
export class HostOrchestrator {
  private players: readonly HostOrchestratorPlayer[] = [];
  private roleAssignments: readonly RoleAssignment[] = [];
  private roundLoopState: RoundLoopState | null = null;
  private currentTeamProposal: readonly string[] = [];
  private currentVotes: Record<string, Vote> = {};
  private currentMissionCards: Record<string, MissionCard> = {};

  constructor(private readonly roomHub: RoomHub) {}

  private async deliverRoleEnvelopes(): Promise<void> {
    const hiddenKnowledgeByPlayer = computeHiddenKnowledge(this.roleAssignments);
    for (const assignment of this.roleAssignments) {
      const player = this.players.find((p) => p.playerId === assignment.playerId);
      const hiddenKnowledge = hiddenKnowledgeByPlayer.find((k) => k.playerId === assignment.playerId);
      if (!player || !hiddenKnowledge) {
        continue;
      }
      const envelope: EncryptedEnvelope = await encryptForPlayer(player.publicKey, {
        role: assignment.role,
        hiddenKnowledge,
      });
      this.roomHub.relayToPlayer(assignment.playerId, envelope);
    }
  }

  async startGame(players: readonly HostOrchestratorPlayer[], rng: () => number = Math.random): Promise<void> {
    this.players = players;
    const playerIds = players.map((p) => p.playerId);
    const split = getRoleSplit(playerIds.length);
    const pool = buildRolePool(split);
    this.roleAssignments = assignRoles(playerIds, pool, rng);
    this.roundLoopState = createInitialRoundLoopState(this.roleAssignments);
    this.currentTeamProposal = [];
    this.currentVotes = {};
    this.currentMissionCards = {};

    await this.deliverRoleEnvelopes();
    this.broadcastState();
  }

  private requireState(): RoundLoopState {
    if (!this.roundLoopState) {
      throw new Error("Game has not started.");
    }
    return this.roundLoopState;
  }

  private buildPublicView(): PublicGameStateView {
    const state = this.requireState();
    const split = getRoleSplit(state.playerCount);
    return {
      kind: "gameState",
      players: this.players.map((p) => p.playerId),
      leaderId: this.players[state.leaderIndex]?.playerId ?? "",
      missionNumber: state.missionNumber,
      requiredTeamSize: split.missionSizes[state.missionNumber - 1] ?? 0,
      phase: state.phase,
      teamProposal: this.currentTeamProposal.length > 0 ? this.currentTeamProposal : undefined,
      votes: { ...this.currentVotes },
      missionResults: state.missionResults,
      result: state.result,
      resultReason: state.resultReason,
    };
  }

  private broadcastState(): void {
    this.roomHub.broadcastPublicState(this.buildPublicView());
  }

  proposeTeam(teamPlayerIds: readonly string[]): { valid: boolean; reason?: string } {
    const state = this.requireState();
    const validation = validateTeamProposal(state, teamPlayerIds);
    if (!validation.valid) {
      return validation;
    }
    this.currentTeamProposal = teamPlayerIds;
    this.currentVotes = {};
    this.broadcastState();
    return validation;
  }

  castVote(playerId: string, vote: Vote): void {
    const state = this.requireState();
    this.currentVotes = { ...this.currentVotes, [playerId]: vote };
    this.broadcastState();

    if (Object.keys(this.currentVotes).length < this.players.length) {
      return;
    }
    this.roundLoopState = submitVotesAndAdvance(state, this.currentVotes);
    this.currentVotes = {};
    if (this.roundLoopState.phase === "TeamProposal") {
      this.currentTeamProposal = [];
    }
    this.broadcastState();
  }

  submitMissionCard(playerId: string, card: MissionCard): void {
    const state = this.requireState();
    this.currentMissionCards = { ...this.currentMissionCards, [playerId]: card };

    if (Object.keys(this.currentMissionCards).length < this.currentTeamProposal.length) {
      return;
    }
    this.roundLoopState = submitMissionCardsAndAdvance(state, this.currentTeamProposal, this.currentMissionCards);
    this.currentMissionCards = {};
    this.currentTeamProposal = [];
    this.broadcastState();
  }

  submitAssassinationGuess(targetPlayerId: string): void {
    const state = this.requireState();
    this.roundLoopState = resolveAssassinationAndFinish(state, targetPlayerId);
    this.broadcastState();
  }

  async requestRematch(rng: () => number = Math.random): Promise<void> {
    this.requireState();
    const playerIds = this.players.map((p) => p.playerId);
    const result = rematch(playerIds, rng);
    this.roleAssignments = result.roleAssignments;
    this.roundLoopState = result.roundLoopState;
    this.currentTeamProposal = [];
    this.currentVotes = {};
    this.currentMissionCards = {};

    await this.deliverRoleEnvelopes();
    this.broadcastState();
  }

  getRoundLoopState(): RoundLoopState | null {
    return this.roundLoopState;
  }
}

// Re-exported so tests/consumers can decrypt a relayed envelope without importing crypto directly.
export { decryptOwnPayload };
