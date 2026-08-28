import type { ReactNode } from "react";
import { useState } from "react";
import { useTranslation } from "../../i18n";
import { ScrollCard } from "./ScrollCard";

export interface PassDeviceGateProps {
  readonly holderName: string | null;
  readonly children: ReactNode;
  readonly onHidden: () => void;
}

/**
 * PassDeviceGate: enforces the "pass to <player>, confirm, reveal, hide" pattern
 * for all private-info moments (role reveal, voting, mission cards, assassination).
 *
 * Renders an interstitial "Pass to <holderName>, tap when ready" screen by default.
 * Only after the player taps to confirm does it reveal the children (secret content).
 * A "Hide & Continue" action then calls onHidden and returns to the interstitial state.
 */
export function PassDeviceGate({
  holderName,
  children,
  onHidden,
}: PassDeviceGateProps) {
  const { t } = useTranslation();
  const [isRevealed, setIsRevealed] = useState(false);

  const handleConfirm = () => {
    setIsRevealed(true);
  };

  const handleHide = () => {
    setIsRevealed(false);
    onHidden();
  };

  if (!isRevealed) {
    // Interstitial state: "Pass to <holderName>, tap when ready"
    const message =
      holderName !== null
        ? t("passDeviceGate.passTo", { holderName })
        : t("passDeviceGate.passToGeneric");

    return (
      <ScrollCard>
        <p
          className="pass-device-gate__instruction"
          data-testid="pass-device-gate-instruction"
        >
          {message}
        </p>
        <button
          type="button"
          className="btn btn--primary"
          onClick={handleConfirm}
          data-testid="pass-device-gate-confirm"
        >
          {t("common.next")}
        </button>
      </ScrollCard>
    );
  }

  // Revealed state: show children and "Hide & Continue" button
  return (
    <ScrollCard>
      <div
        className="pass-device-gate__content"
        data-testid="pass-device-gate-content"
      >
        {children}
      </div>
      <button
        type="button"
        className="btn btn--primary"
        onClick={handleHide}
        data-testid="pass-device-gate-hide"
      >
        {t("passDeviceGate.hideAndContinue")}
      </button>
    </ScrollCard>
  );
}
