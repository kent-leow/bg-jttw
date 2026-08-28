import { useTranslation } from "../i18n";
import { LandingScene } from "../theme/scenes/landingScene";
import { LanguageToggle } from "./components/LanguageToggle";
import { ScrollCard } from "./components/ScrollCard";

export interface LandingPageProps {
  readonly onStartGame?: () => void;
}

export function LandingPage({ onStartGame }: LandingPageProps) {
  const { t } = useTranslation();

  return (
    <section className="page page--centered">
      <LanguageToggle />
      <LandingScene />
      <ScrollCard>
        <button type="button" className="btn btn--primary" onClick={onStartGame}>
          {t("landing.startGame")}
        </button>
      </ScrollCard>
    </section>
  );
}
