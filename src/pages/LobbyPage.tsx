import { useEffect, useState } from "react";
import { RoomHub, type RoomHubMessage } from "../connection/roomHub";
import { useTranslation } from "../i18n";
import { LanguageToggle } from "./components/LanguageToggle";

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
  const { t } = useTranslation();

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
    <section className="page page--centered">
      <LanguageToggle />
      <h1>{t("lobby.title")}</h1>
      <p className="seat-counter">{t("lobby.seatCounter", { joined: players.length, total: playerCount })}</p>
      <ul aria-label="Connected players" className="player-row">
        {players.map((player) => (
          <li key={player.id} data-testid="player-portrait-chip">
            <span className="portrait-chip">
              <span className="portrait-chip__avatar" aria-hidden="true">
                {player.displayName.charAt(0).toUpperCase()}
              </span>
              <span className="portrait-chip__name">{player.displayName}</span>
            </span>
          </li>
        ))}
      </ul>
      {isHost && (
        <button type="button" className="btn btn--primary" disabled={!seatsFilled} onClick={onStartGame}>
          {t("common.startGame")}
        </button>
      )}
    </section>
  );
}
