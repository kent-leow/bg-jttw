import { useTranslation } from "../i18n";

export interface MissionResultPageProps {
  readonly result: "Success" | "Fail";
}

export function MissionResultPage({ result }: MissionResultPageProps) {
  const { t } = useTranslation();
  return (
    <section>
      <h1>{t("missionResult.title")}</h1>
      <p data-testid="mission-result">{result}</p>
    </section>
  );
}
