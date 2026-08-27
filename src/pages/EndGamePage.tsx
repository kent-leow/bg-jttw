import { useTranslation } from "../i18n";
import type { RoleDefinition } from "../engine/types";
import { SealBadge } from "./components/SealBadge";

export interface RevealedPlayer {
  readonly id: string;
  readonly displayName: string;
  readonly role: RoleDefinition;
}

export interface EndGamePageProps {
  readonly result: "GoodWin" | "EvilWin";
  readonly resultReason: string;
  readonly players: readonly RevealedPlayer[];
  readonly isHost: boolean;
  readonly onRematch?: () => void;
  readonly onEndSession?: () => void;
}

export function EndGamePage({ result, resultReason, players, isHost, onRematch, onEndSession }: EndGamePageProps) {
  const { t } = useTranslation();
  return (
    <section className="page page--centered">
      <SealBadge variant={result === "GoodWin" ? "good" : "evil"} />
      <h1 data-testid="game-result">{result}</h1>
      <p data-testid="game-result-reason" className="page__hint">{resultReason}</p>
      <ul aria-label="Revealed roles" className="player-row">
        {players.map((player) => (
          <li key={player.id} data-testid="revealed-role" className="scroll-card">
            {`${player.displayName}: ${player.role.name} (${player.role.alignment})`}
          </li>
        ))}
      </ul>
      {isHost && (
        <div className="scroll-card">
          <button type="button" className="btn btn--primary" onClick={onRematch}>
            {t("endGame.rematch")}
          </button>
          <button type="button" className="btn btn--secondary" onClick={onEndSession}>
            {t("endGame.endSession")}
          </button>
        </div>
      )}
    </section>
  );
}
