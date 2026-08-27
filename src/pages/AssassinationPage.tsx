import type { LobbyPlayer } from "./LobbyPage";
import { PlayerPortraitChip } from "./components/PlayerPortraitChip";

export interface AssassinationPageProps {
  readonly isAssassin: boolean;
  readonly players: readonly LobbyPlayer[];
  readonly onSelectTarget?: (targetPlayerId: string) => void;
}

export function AssassinationPage({ isAssassin, players, onSelectTarget }: AssassinationPageProps) {
  if (!isAssassin) {
    return (
      <section>
        <p data-testid="assassination-suspense">The Assassin is choosing…</p>
      </section>
    );
  }

  return (
    <section>
      <h1>Choose Your Target</h1>
      <ul aria-label="Assassination targets" data-testid="assassination-target-grid">
        {players.map((player) => (
          <li key={player.id}>
            <PlayerPortraitChip displayName={player.displayName} onClick={() => onSelectTarget?.(player.id)} />
          </li>
        ))}
      </ul>
    </section>
  );
}
