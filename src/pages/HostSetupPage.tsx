import { useState } from "react";
import { useTranslation } from "../i18n";
import { LanguageToggle } from "./components/LanguageToggle";
import { PhotoCapture } from "./components/PhotoCapture";
import { PlayerPortraitChip } from "./components/PlayerPortraitChip";
import { ScrollCard } from "./components/ScrollCard";

export interface RosterPlayer {
  readonly displayName: string;
  readonly photoUrl?: string;
}

export interface HostSetupPageProps {
  readonly onStartGame?: (roster: readonly RosterPlayer[]) => void;
  readonly onBack?: () => void;
}

type HostSetupStep = "playerCount" | "nameEntry" | "review";

/**
 * HostSetupPage: Single-device roster setup where one person picks a player count (5-10),
 * enters every player's display name plus optional camera-captured photo, then reviews the roster.
 */
export function HostSetupPage({ onStartGame, onBack }: HostSetupPageProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState<HostSetupStep>("playerCount");
  const [playerCount, setPlayerCount] = useState<number | null>(null);
  const [roster, setRoster] = useState<RosterPlayer[]>([]);
  const [currentSeat, setCurrentSeat] = useState(0);
  const [currentName, setCurrentName] = useState("");

  /**
   * Handle player count selection: initialize empty roster and move to name entry.
   */
  const handlePlayerCountSelect = (count: number) => {
    setPlayerCount(count);
    setRoster(Array.from({ length: count }, () => ({ displayName: "" })));
    setCurrentSeat(0);
    setCurrentName("");
    setStep("nameEntry");
  };

  /**
   * Handle name input for current seat.
   */
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentName(e.currentTarget.value);
  };

  /**
   * Handle photo capture for current seat.
   */
  const handlePhotoCapture = (dataUrl: string | null) => {
    const updatedRoster = [...roster];
    updatedRoster[currentSeat] = {
      displayName: currentName,
      photoUrl: dataUrl || undefined,
    };
    setRoster(updatedRoster);

    // Move to next seat or review
    if (currentSeat < playerCount! - 1) {
      setCurrentSeat(currentSeat + 1);
      setCurrentName("");
    } else {
      setStep("review");
    }
  };

  /**
   * Skip name entry for current seat if name is entered; move to next or review.
   */
  const handleSkipPhotoAndNext = () => {
    if (!currentName.trim()) {
      return; // Name is required
    }
    const updatedRoster = [...roster];
    updatedRoster[currentSeat] = {
      displayName: currentName,
      photoUrl: undefined,
    };
    setRoster(updatedRoster);

    if (currentSeat < playerCount! - 1) {
      setCurrentSeat(currentSeat + 1);
      setCurrentName("");
    } else {
      setStep("review");
    }
  };

  /**
   * Go back from name entry to player count selection.
   */
  const handleBackToPlayerCount = () => {
    setStep("playerCount");
    setPlayerCount(null);
    setRoster([]);
    setCurrentSeat(0);
    setCurrentName("");
  };

  /**
   * Start the game with the filled roster.
   */
  const handleStartGame = () => {
    const allNamesFilled = roster.every((p) => p.displayName.trim().length > 0);
    if (allNamesFilled && onStartGame) {
      onStartGame(roster);
    }
  };

  /**
   * Edit a specific seat during review.
   */
  const handleEditSeat = (seatIndex: number) => {
    setCurrentSeat(seatIndex);
    setCurrentName(roster[seatIndex]?.displayName || "");
    setStep("nameEntry");
  };

  // Player Count Selection
  if (step === "playerCount") {
    return (
      <section className="page page--centered">
        <LanguageToggle />
        <ScrollCard>
          <h2>{t("hostSetup.title")}</h2>
          <p className="page__intro">{t("hostSetup.choosePlayerCount")}</p>
          <div className="player-count-selector__beads">
            {Array.from({ length: 6 }, (_, i) => 5 + i).map((count) => (
              <button
                key={count}
                type="button"
                className="bead"
                onClick={() => handlePlayerCountSelect(count)}
              >
                {count}
              </button>
            ))}
          </div>
        </ScrollCard>
      </section>
    );
  }

  // Name Entry & Optional Photo Capture
  if (step === "nameEntry" && playerCount) {
    const isNameValid = currentName.trim().length > 0;
    const currentPlayer = roster[currentSeat];

    return (
      <section className="page page--centered">
        <LanguageToggle />
        <ScrollCard>
          <h2>
            {t("hostSetup.enterName", { seat: currentSeat + 1 })}
          </h2>
          <div className="roster-setup-form">
            <div className="roster-setup-form__section">
              <input
                type="text"
                className="roster-input"
                placeholder={`Player ${currentSeat + 1}`}
                value={currentName}
                onChange={handleNameChange}
                autoFocus
              />
            </div>

            {isNameValid && (
              <div className="roster-setup-form__section">
                <p className="page__hint">{t("hostSetup.capturePhoto")}</p>
                <PhotoCapture onCapture={handlePhotoCapture} />
              </div>
            )}

            <div className="roster-setup-form__actions">
              {currentSeat > 0 && (
                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={handleBackToPlayerCount}
                >
                  {t("common.back")}
                </button>
              )}
              <button
                type="button"
                className="btn btn--primary"
                disabled={!isNameValid}
                onClick={handleSkipPhotoAndNext}
              >
                {currentSeat < playerCount - 1 ? t("common.next") : t("hostSetup.reviewRoster")}
              </button>
            </div>
          </div>
        </ScrollCard>
      </section>
    );
  }

  // Roster Review
  if (step === "review" && playerCount) {
    const allNamesFilled = roster.every((p) => p.displayName.trim().length > 0);

    return (
      <section className="page page--centered">
        <LanguageToggle />
        <ScrollCard>
          <h2>{t("hostSetup.reviewRoster")}</h2>
          <div className="roster-review">
            <div className="roster-review__list">
              {roster.map((player, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="portrait-chip"
                  onClick={() => handleEditSeat(idx)}
                  title={`Edit ${player.displayName}`}
                >
                  <span className="portrait-chip__avatar">
                    {player.photoUrl ? (
                      <img
                        src={player.photoUrl}
                        alt={player.displayName}
                        className="portrait-chip__photo"
                      />
                    ) : (
                      player.displayName.charAt(0).toUpperCase()
                    )}
                  </span>
                  <span className="portrait-chip__name">{player.displayName}</span>
                </button>
              ))}
            </div>

            {!allNamesFilled && (
              <p className="alert-text">{t("hostSetup.allNamesRequired")}</p>
            )}

            <div className="roster-review__actions">
              <button
                type="button"
                className="btn btn--secondary"
                onClick={handleBackToPlayerCount}
              >
                {t("common.back")}
              </button>
              <button
                type="button"
                className="btn btn--primary"
                disabled={!allNamesFilled}
                onClick={handleStartGame}
              >
                {t("common.startGame")}
              </button>
            </div>
          </div>
        </ScrollCard>
      </section>
    );
  }

  // Fallback (should not reach here)
  return (
    <section className="page page--centered">
      <LanguageToggle />
      <ScrollCard>
        <p>{t("common.error")}: Invalid state</p>
        {onBack && (
          <button type="button" className="btn btn--secondary" onClick={onBack}>
            {t("common.back")}
          </button>
        )}
      </ScrollCard>
    </section>
  );
}
