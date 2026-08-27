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
    <section>
      <LanguageToggle />
      <LandingScene />
      <ScrollCard>
        <button type="button" onClick={onHost}>
          {t("landing.hostGame")}
        </button>
        <button type="button" onClick={onJoin}>
          {t("landing.joinGame")}
        </button>
      </ScrollCard>
    </section>
  );
}
