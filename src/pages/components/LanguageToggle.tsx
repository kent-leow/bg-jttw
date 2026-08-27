import { useTranslation, type Locale } from "../../i18n";

export function LanguageToggle() {
  const { locale, setLocale, t } = useTranslation();

  function selectLocale(next: Locale) {
    setLocale(next);
  }

  return (
    <div role="group" aria-label="Language">
      <button type="button" aria-pressed={locale === "en"} onClick={() => selectLocale("en")}>
        {t("languageToggle.english")}
      </button>
      <button type="button" aria-pressed={locale === "zh"} onClick={() => selectLocale("zh")}>
        {t("languageToggle.chinese")}
      </button>
    </div>
  );
}
