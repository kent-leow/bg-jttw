import { useTranslation } from "../i18n";
import { LanguageToggle } from "./components/LanguageToggle";

// LobbyPlayer type - originally from deleted connection/playerListBroadcast
export interface LobbyPlayer {
  readonly id: string;
  readonly displayName: string;
}

// Stub RoomHub interface - originally from deleted connection/roomHub
export interface RoomHub {
  connect(opts: { playerId: string; onMessage: (message: unknown) => void }): void;
  disconnect(playerId: string): void;
}

export interface LobbyPageProps {
  readonly roomHub: RoomHub;
  readonly selfPlayerId: string;
  readonly playerCount: number;
  readonly isHost: boolean;
  readonly onStartGame?: () => void;
}

export function LobbyPage({ isHost, onStartGame }: LobbyPageProps) {
  const { t } = useTranslation();

  return (
    <section className="page page--centered">
      <LanguageToggle />
      <p role="alert">{t("common.error")}: Lobby has been removed. This feature will be reimplemented in task-002.</p>
      {isHost && (
        <button type="button" className="btn btn--primary" onClick={onStartGame}>
          {t("common.startGame")}
        </button>
      )}
    </section>
  );
}
