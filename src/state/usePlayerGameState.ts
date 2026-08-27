import { useCallback, useEffect, useState } from "react";
import type { PublicGameStateView } from "../connection/hostOrchestrator";
import { RoomHub, type RoomHubMessage } from "../connection/roomHub";
import { decryptOwnPayload } from "../crypto/decryptOwnPayload";
import type { EncryptedEnvelope } from "../crypto/encryptForPlayer";
import type { MissionCard } from "../engine/missionResolution";
import type { HiddenKnowledge } from "../engine/hiddenKnowledge";
import type { RoleDefinition } from "../engine/types";
import type { Vote } from "../engine/voteResolution";

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

function isPublicGameStateView(payload: unknown): payload is PublicGameStateView {
  return typeof payload === "object" && payload !== null && (payload as { kind?: unknown }).kind === "gameState";
}

function isSessionEndedMessage(payload: unknown): boolean {
  return typeof payload === "object" && payload !== null && (payload as { kind?: unknown }).kind === "sessionEnded";
}

/**
 * Turns `RoomHub` broadcasts and this player's own encrypted relay into live page state, and
 * exposes action senders that transmit through the connected transport to the host orchestrator.
 */
export function usePlayerGameState({
  roomHub,
  playerId,
  privateKey,
  transport,
}: UsePlayerGameStateParams): UsePlayerGameStateResult {
  const [gameState, setGameState] = useState<PublicGameStateView | null>(null);
  const [roleInfo, setRoleInfo] = useState<PlayerRoleInfo | null>(null);
  const [sessionEnded, setSessionEnded] = useState(false);

  useEffect(() => {
    setGameState(null);
    setRoleInfo(null);
    setSessionEnded(false);

    function handleMessage(message: RoomHubMessage) {
      if (message.kind === "broadcast") {
        if (isPublicGameStateView(message.payload)) {
          setGameState(message.payload);
        } else if (isSessionEndedMessage(message.payload)) {
          setSessionEnded(true);
        }
        return;
      }
      // Direct message: only ever decrypt this player's own envelope. Each new envelope (e.g., a
      // rematch's freshly dealt role) replaces the previous one rather than being resolved once.
      if (message.targetPlayerId !== playerId) {
        return;
      }
      decryptOwnPayload<PlayerRoleInfo>(privateKey, message.payload as EncryptedEnvelope)
        .then((decrypted) => {
          setRoleInfo(decrypted);
        })
        .catch(() => {
          // Not decryptable with this device's key (e.g., malformed/misrouted); ignore, don't crash the UI.
        });
    }

    roomHub.connect({ playerId, onMessage: handleMessage });
    return () => roomHub.disconnect(playerId);
  }, [roomHub, playerId, privateKey]);

  const proposeTeam = useCallback(
    (teamPlayerIds: readonly string[]) => {
      transport.send({ type: "proposeTeam", teamPlayerIds });
    },
    [transport],
  );

  const castVote = useCallback(
    (vote: Vote) => {
      transport.send({ type: "castVote", playerId, vote });
    },
    [transport, playerId],
  );

  const submitMissionCard = useCallback(
    (card: MissionCard) => {
      transport.send({ type: "submitMissionCard", playerId, card });
    },
    [transport, playerId],
  );

  const submitAssassinationGuess = useCallback(
    (targetPlayerId: string) => {
      transport.send({ type: "submitAssassinationGuess", targetPlayerId });
    },
    [transport],
  );

  return { gameState, roleInfo, sessionEnded, proposeTeam, castVote, submitMissionCard, submitAssassinationGuess };
}
