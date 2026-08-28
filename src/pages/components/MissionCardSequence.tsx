import { useState } from "react";
import type { MissionCard } from "../../engine/missionResolution";
import { useTranslation } from "../../i18n";
import type { LobbyPlayer } from "../LobbyPage";
import { PassDeviceGate } from "./PassDeviceGate";
import { ScrollCard } from "./ScrollCard";

export interface MissionCardSequenceProps {
  readonly approvedTeam: readonly LobbyPlayer[];
  readonly onAllCardsSubmitted: (cards: Readonly<Record<string, MissionCard>>) => void;
}

/**
 * MissionCardSequence: steps through each approved team member in turn, asking them
 * to submit Success or Fail via PassDeviceGate. Once all team members have submitted,
 * calls onAllCardsSubmitted with the collected cards. Individual submissions are never
 * rendered/exposed after submission.
 */
export function MissionCardSequence({
  approvedTeam,
  onAllCardsSubmitted,
}: MissionCardSequenceProps) {
  const [cards, setCards] = useState<Readonly<Record<string, MissionCard>>>({});
  const [currentTeamIndex, setCurrentTeamIndex] = useState(0);
  const [allCardsSubmitted, setAllCardsSubmitted] = useState(false);
  const { t } = useTranslation();

  const currentTeamMember = approvedTeam[currentTeamIndex];
  const hasCurrentMemberSubmitted =
    currentTeamMember && cards[currentTeamMember.id] !== undefined;

  const handleSubmitCard = (playerId: string, card: MissionCard) => {
    const newCards = { ...cards, [playerId]: card };
    setCards(newCards);

    // Check if all team members have submitted
    if (Object.keys(newCards).length === approvedTeam.length) {
      setAllCardsSubmitted(true);
      onAllCardsSubmitted(newCards);
    }
  };

  const handleMemberHidden = () => {
    // Move to next team member (their card is already recorded)
    setCurrentTeamIndex((prev) => prev + 1);
  };

  // All cards collected - we don't show results here, just return null
  // The parent component (GameBoardPage) will handle displaying the mission result
  if (allCardsSubmitted) {
    return null;
  }

  // Show mission card submission for current team member
  if (!currentTeamMember || currentTeamIndex >= approvedTeam.length) {
    return null; // Should not happen if onAllCardsSubmitted is called properly
  }

  return (
    <PassDeviceGate
      key={currentTeamIndex}
      holderName={currentTeamMember.displayName}
      onHidden={handleMemberHidden}
    >
      <div data-testid={`mission-card-panel-${currentTeamMember.id}`}>
        <h2>
          {t("gameBoard.submitMissionCard", {
            playerName: currentTeamMember.displayName,
          })}
        </h2>
        {hasCurrentMemberSubmitted ? (
          <div data-testid="card-submitted">
            <p>
              {t("gameBoard.cardSubmitted", {
                card: currentTeamMember && cards[currentTeamMember.id],
              })}
            </p>
            <p>{t("gameBoard.tapHideWhenReady")}</p>
          </div>
        ) : (
          <div className="mission-card-buttons">
            <button
              type="button"
              className="btn btn--success"
              onClick={() => handleSubmitCard(currentTeamMember.id, "Success")}
              data-testid={`card-success-${currentTeamMember.id}`}
            >
              {t("common.success")}
            </button>
            <button
              type="button"
              className="btn btn--fail"
              onClick={() => handleSubmitCard(currentTeamMember.id, "Fail")}
              data-testid={`card-fail-${currentTeamMember.id}`}
            >
              {t("common.fail")}
            </button>
          </div>
        )}
      </div>
    </PassDeviceGate>
  );
}
