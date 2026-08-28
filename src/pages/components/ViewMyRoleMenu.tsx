import { useState } from "react";
import type { RoleDefinition } from "../../engine/types";
import type { HiddenKnowledge } from "../../engine/hiddenKnowledge";
import { useTranslation } from "../../i18n";
import { PassDeviceGate } from "./PassDeviceGate";
import { ScrollCard } from "./ScrollCard";

export interface RosterPlayer {
  readonly id: string;
  readonly displayName: string;
}

export interface ViewMyRoleMenuProps {
  readonly selfPlayerId: string;
  readonly selfDisplayName: string;
  readonly roster: readonly RosterPlayer[];
  readonly roleByPlayerId: ReadonlyMap<string, RoleDefinition>;
  readonly hiddenKnowledgeByPlayerId?: ReadonlyMap<string, HiddenKnowledge>;
  readonly visible: boolean;
  readonly onDismiss?: () => void;
}

/**
 * ViewMyRoleMenu: A persistent control that lets a player recheck their role at any time
 * during the game by selecting their name from a roster dropdown.
 * Shows the role through PassDeviceGate without affecting game state.
 */
export function ViewMyRoleMenu({
  selfPlayerId,
  selfDisplayName,
  roster,
  roleByPlayerId,
  hiddenKnowledgeByPlayerId = new Map(),
  visible,
  onDismiss,
}: ViewMyRoleMenuProps) {
  const { t } = useTranslation();
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  if (!visible) {
    return null;
  }

  // If a player is selected and we're viewing their role
  if (selectedPlayerId !== null) {
    const selectedPlayer = roster.find((p) => p.id === selectedPlayerId);
    const selectedRole = roleByPlayerId.get(selectedPlayerId);
    const selectedHiddenKnowledge = hiddenKnowledgeByPlayerId.get(selectedPlayerId);

    if (!selectedPlayer || !selectedRole) {
      return null;
    }

    return (
      <div className="view-my-role-menu__modal" data-testid="view-my-role-modal">
        <PassDeviceGate
          holderName={selectedPlayer.displayName}
          onHidden={() => {
            setSelectedPlayerId(null);
            setIsMenuOpen(false);
            onDismiss?.();
          }}
        >
          <div className="role-reveal__content" data-testid={`view-role-card-${selectedPlayerId}`}>
            <h2 className="role-reveal__role-name" data-testid="view-role-name">
              {selectedRole.name}
            </h2>
            <p className="role-reveal__alignment">
              {selectedRole.alignment}
            </p>

            {selectedHiddenKnowledge?.evilPlayerIds && (
              <div className="role-reveal__knowledge" data-testid="view-known-evil-players">
                <p className="role-reveal__knowledge-label">
                  {t("roleReveal.evilPlayers")}
                </p>
                <ul className="role-reveal__knowledge-list">
                  {selectedHiddenKnowledge.evilPlayerIds.map((playerId) => {
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

            {selectedHiddenKnowledge?.merlinOrMorganaPlayerIds && (
              <div className="role-reveal__knowledge" data-testid="view-merlin-or-morgana">
                <p className="role-reveal__knowledge-label">
                  {t("roleReveal.merlinOrMorgana")}
                </p>
                <ul className="role-reveal__knowledge-list">
                  {selectedHiddenKnowledge.merlinOrMorganaPlayerIds.map((playerId) => {
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

            {selectedHiddenKnowledge?.fellowMinionPlayerIds &&
              selectedHiddenKnowledge.fellowMinionPlayerIds.length > 0 && (
                <div className="role-reveal__knowledge" data-testid="view-fellow-minions">
                  <p className="role-reveal__knowledge-label">
                    {t("roleReveal.fellowMinions")}
                  </p>
                  <ul className="role-reveal__knowledge-list">
                    {selectedHiddenKnowledge.fellowMinionPlayerIds.map((playerId) => {
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
      </div>
    );
  }

  // Menu closed - show button to open menu
  if (!isMenuOpen) {
    return (
      <div className="view-my-role-menu__trigger">
        <button
          type="button"
          className="btn btn--secondary"
          onClick={() => setIsMenuOpen(true)}
          data-testid="view-my-role-button"
          title={t("roleReveal.viewMyRole")}
        >
          {t("roleReveal.viewMyRole")}
        </button>
      </div>
    );
  }

  // Menu open - show dropdown to select player
  return (
    <div className="view-my-role-menu__panel" data-testid="view-my-role-panel">
      <ScrollCard>
        <h3>{t("roleReveal.selectYourName")}</h3>
        <ul className="view-my-role-menu__roster-list">
          {roster.map((player) => (
            <li key={player.id}>
              <button
                type="button"
                className="view-my-role-menu__roster-item"
                onClick={() => setSelectedPlayerId(player.id)}
                data-testid={`select-player-${player.id}`}
              >
                {player.displayName}
              </button>
            </li>
          ))}
        </ul>
        <button
          type="button"
          className="btn btn--secondary"
          onClick={() => {
            setIsMenuOpen(false);
            onDismiss?.();
          }}
          data-testid="close-view-my-role-menu"
        >
          {t("common.back")}
        </button>
      </ScrollCard>
    </div>
  );
}
