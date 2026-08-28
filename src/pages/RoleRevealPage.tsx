import { useState, useEffect } from "react";
import type { HiddenKnowledge } from "../engine/hiddenKnowledge";
import type { RoleDefinition } from "../engine/types";
import { useTranslation } from "../i18n";
import { LanguageToggle } from "./components/LanguageToggle";
import { PassDeviceGate } from "./components/PassDeviceGate";
import { ScrollCard } from "./components/ScrollCard";

export interface LobbyPlayer {
  readonly id: string;
  readonly displayName: string;
}

export interface RoleRevealPageProps {
  readonly roster: readonly LobbyPlayer[];
  readonly roleByPlayerId: ReadonlyMap<string, RoleDefinition>;
  readonly hiddenKnowledgeByPlayerId?: ReadonlyMap<string, HiddenKnowledge>;
  readonly onRoleRevealComplete?: () => void;
}

/**
 * RoleRevealPage: Sequential role reveal for each player via PassDeviceGate.
 * Steps through the roster one player at a time, revealing their role and hidden knowledge.
 * Only advances after the player has confirmed they've seen and hidden their role.
 */
export function RoleRevealPage({
  roster,
  roleByPlayerId,
  hiddenKnowledgeByPlayerId = new Map(),
  onRoleRevealComplete,
}: RoleRevealPageProps) {
  const { t } = useTranslation();
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);

  const isAllPlayersRevealed = currentPlayerIndex >= roster.length;

  // Call onRoleRevealComplete when all players have been revealed
  useEffect(() => {
    if (isAllPlayersRevealed) {
      onRoleRevealComplete?.();
    }
  }, [isAllPlayersRevealed, onRoleRevealComplete]);

  const handleHiddenForCurrentPlayer = () => {
    if (currentPlayerIndex < roster.length - 1) {
      // Move to next player
      setCurrentPlayerIndex(currentPlayerIndex + 1);
    } else {
      // All players have seen their role - advance to "complete" state
      setCurrentPlayerIndex(roster.length);
    }
  };

  // All players have seen their roles - show game board button
  if (isAllPlayersRevealed) {
    return (
      <section className="page page--centered">
        <LanguageToggle />
        <ScrollCard>
          <p>{t("roleReveal.revealing")}</p>
          <button
            type="button"
            className="btn btn--primary"
            onClick={onRoleRevealComplete}
            data-testid="start-game-board"
          >
            {t("common.next")}
          </button>
        </ScrollCard>
      </section>
    );
  }

  const currentPlayer = roster[currentPlayerIndex];

  if (!currentPlayer) {
    return (
      <section className="page page--centered">
        <LanguageToggle />
        <p role="alert">{t("common.error")}: Invalid roster state.</p>
      </section>
    );
  }

  const playerRole = roleByPlayerId.get(currentPlayer.id);
  const playerHiddenKnowledge = hiddenKnowledgeByPlayerId.get(currentPlayer.id);

  if (!playerRole) {
    return (
      <section className="page page--centered">
        <LanguageToggle />
        <p role="alert">{t("common.error")}: Role not found for {currentPlayer.displayName}.</p>
      </section>
    );
  }

  return (
    <section className="page page--centered">
      <LanguageToggle />
      <PassDeviceGate
        holderName={currentPlayer.displayName}
        onHidden={handleHiddenForCurrentPlayer}
      >
        <div className="role-reveal__content" data-testid={`role-card-${currentPlayer.id}`}>
          <h2 className="role-reveal__role-name" data-testid="role-name">
            {playerRole.name}
          </h2>
          <p className="role-reveal__alignment">
            {playerRole.alignment}
          </p>

          {playerHiddenKnowledge?.evilPlayerIds && (
            <div className="role-reveal__knowledge" data-testid="known-evil-players">
              <p className="role-reveal__knowledge-label">
                {t("roleReveal.evilPlayers")}
              </p>
              <ul className="role-reveal__knowledge-list">
                {playerHiddenKnowledge.evilPlayerIds.map((playerId) => {
                  const evilPlayer = roster.find((p) => p.id === playerId);
                  return (
                    <li key={playerId}>
                      {evilPlayer?.displayName || playerId}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {playerHiddenKnowledge?.merlinOrMorganaPlayerIds && (
            <div className="role-reveal__knowledge" data-testid="merlin-or-morgana">
              <p className="role-reveal__knowledge-label">
                {t("roleReveal.merlinOrMorgana")}
              </p>
              <ul className="role-reveal__knowledge-list">
                {playerHiddenKnowledge.merlinOrMorganaPlayerIds.map((playerId) => {
                  const suspectPlayer = roster.find((p) => p.id === playerId);
                  return (
                    <li key={playerId}>
                      {suspectPlayer?.displayName || playerId}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {playerHiddenKnowledge?.fellowMinionPlayerIds &&
            playerHiddenKnowledge.fellowMinionPlayerIds.length > 0 && (
              <div className="role-reveal__knowledge" data-testid="fellow-minions">
                <p className="role-reveal__knowledge-label">
                  {t("roleReveal.fellowMinions")}
                </p>
                <ul className="role-reveal__knowledge-list">
                  {playerHiddenKnowledge.fellowMinionPlayerIds.map((playerId) => {
                    const minionPlayer = roster.find((p) => p.id === playerId);
                    return (
                      <li key={playerId}>
                        {minionPlayer?.displayName || playerId}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
        </div>
      </PassDeviceGate>
    </section>
  );
}
