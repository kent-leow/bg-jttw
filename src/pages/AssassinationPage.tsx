import { useTranslation } from "../i18n";
import { AssassinationSuspenseScene } from "../theme/scenes/assassinationSuspenseScene";
import type { LobbyPlayer } from "./LobbyPage";
import { PlayerPortraitChip } from "./components/PlayerPortraitChip";

export interface AssassinationPageProps {
  readonly isAssassin: boolean;
  readonly players: readonly LobbyPlayer[];
  readonly onSelectTarget?: (targetPlayerId: string) => void;
}

export function AssassinationPage({ isAssassin, players, onSelectTarget }: AssassinationPageProps) {
  const { t } = useTranslation();

  if (!isAssassin) {
    return (
      <section className="page page--centered">
        <AssassinationSuspenseScene />
        <p data-testid="assassination-suspense" className="status-text">
          {t("assassination.suspense")}
        </p>
      </section>
    );
  }

  return (
    <section className="page page--centered">
      <h1>{t("assassination.title")}</h1>
      <ul aria-label="Assassination targets" data-testid="assassination-target-grid" className="player-row">
        {players.map((player) => (
          <li key={player.id}>
            <PlayerPortraitChip displayName={player.displayName} onClick={() => onSelectTarget?.(player.id)} />
          </li>
        ))}
      </ul>
    </section>
  );
}
