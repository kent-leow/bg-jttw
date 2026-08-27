import { useEffect, useState } from "react";
import { RoomHub, type RoomHubMessage } from "../connection/roomHub";

export interface LobbyPlayer {
  readonly id: string;
  readonly displayName: string;
}

interface PlayerListBroadcast {
  readonly kind: "playerList";
  readonly players: readonly LobbyPlayer[];
}

function isPlayerListBroadcast(payload: unknown): payload is PlayerListBroadcast {
  return (
    typeof payload === "object" &&
    payload !== null &&
    (payload as Partial<PlayerListBroadcast>).kind === "playerList" &&
    Array.isArray((payload as Partial<PlayerListBroadcast>).players)
  );
}

export interface LobbyPageProps {
  readonly roomHub: RoomHub;
  readonly selfPlayerId: string;
  readonly playerCount: number;
  readonly isHost: boolean;
  readonly onStartGame?: () => void;
}

export function LobbyPage({ roomHub, selfPlayerId, playerCount, isHost, onStartGame }: LobbyPageProps) {
  const [players, setPlayers] = useState<readonly LobbyPlayer[]>([]);

  useEffect(() => {
    function handleMessage(message: RoomHubMessage) {
      if (message.kind === "broadcast" && isPlayerListBroadcast(message.payload)) {
        setPlayers(message.payload.players);
      }
    }
    roomHub.connect({ playerId: selfPlayerId, onMessage: handleMessage });
    return () => roomHub.disconnect(selfPlayerId);
  }, [roomHub, selfPlayerId]);

  const seatsFilled = players.length === playerCount;

  return (
    <section>
      <h1>Lobby</h1>
      <p>{`${players.length}/${playerCount} joined`}</p>
      <ul aria-label="Connected players">
        {players.map((player) => (
          <li key={player.id} data-testid="player-portrait-chip">
            {player.displayName}
          </li>
        ))}
      </ul>
      {isHost && (
        <button type="button" disabled={!seatsFilled} onClick={onStartGame}>
          Start Game
        </button>
      )}
    </section>
  );
}
