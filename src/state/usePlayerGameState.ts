import type { MissionCard } from "../engine/missionResolution";
import type { HiddenKnowledge } from "../engine/hiddenKnowledge";
import type { RoleDefinition } from "../engine/types";
import type { Vote } from "../engine/voteResolution";

// Stub types - originally from deleted modules
export interface PublicGameStateView {
  players: readonly string[];
  leaderId: string;
  missionNumber: number;
  requiredTeamSize: number;
  phase: string;
  votes: Record<string, Vote>;
  missionResults: readonly unknown[];
  result: unknown;
  resultReason?: string;
  revealedRoles?: readonly { playerId: string; role: RoleDefinition }[];
  teamProposal?: readonly string[];
}

export interface RoomHub {
  connect(opts: { playerId: string; onMessage: (message: unknown) => void }): void;
  disconnect(playerId: string): void;
}

export interface RoomHubMessage {
  kind: "broadcast" | "direct";
  targetPlayerId?: string;
  payload: unknown;
}

export interface PlayerRoleInfo {
  readonly role: RoleDefinition;
  readonly hiddenKnowledge: HiddenKnowledge;
}

export interface PlayerActionTransport {
  send(message: unknown): void;
}

export interface UsePlayerGameStateParams {
  readonly roomHub: RoomHub;
  readonly playerId: string;
  readonly privateKey: CryptoKey;
  readonly transport: PlayerActionTransport;
}

export interface UsePlayerGameStateResult {
  readonly gameState: PublicGameStateView | null;
  readonly roleInfo: PlayerRoleInfo | null;
  readonly sessionEnded: boolean;
  proposeTeam(teamPlayerIds: readonly string[]): void;
  castVote(vote: Vote): void;
  submitMissionCard(card: MissionCard): void;
  submitAssassinationGuess(targetPlayerId: string): void;
}

/**
 * STUB: usePlayerGameState has been removed (it was only used in the multi-device WebRTC flow).
 * This will be reimplemented in task-002 for the single-device pass-and-play model.
 */
export function usePlayerGameState(params: UsePlayerGameStateParams): UsePlayerGameStateResult {
  return {
    gameState: null,
    roleInfo: null,
    sessionEnded: false,
    proposeTeam: () => {},
    castVote: () => {},
    submitMissionCard: () => {},
    submitAssassinationGuess: () => {},
  };
}
