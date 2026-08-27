import { useTranslation } from "../i18n";
import { LandingScene } from "../theme/scenes/landingScene";
import { LanguageToggle } from "./components/LanguageToggle";
import { ScrollCard } from "./components/ScrollCard";

export interface LandingPageProps {
  readonly onHost?: () => void;
  readonly onJoin?: () => void;
}

export function LandingPage({ onHost, onJoin }: LandingPageProps) {
  const { t } = useTranslation();

  return (
    <section className="page page--centered">
      <LanguageToggle />
      <LandingScene />
      <ScrollCard>
        <button type="button" className="btn btn--primary" onClick={onHost}>
          {t("landing.hostGame")}
        </button>
        <button type="button" className="btn btn--secondary" onClick={onJoin}>
          {t("landing.joinGame")}
        </button>
      </ScrollCard>
    </section>
  );
}
