import { useTranslation, type Locale } from "../../i18n";

export function LanguageToggle() {
  const { locale, setLocale, t } = useTranslation();

  function selectLocale(next: Locale) {
    setLocale(next);
  }

  return (
    <div role="group" aria-label="Language" className="language-toggle">
      <button
        type="button"
        className="language-toggle__btn"
        aria-pressed={locale === "en"}
        onClick={() => selectLocale("en")}
      >
        {t("languageToggle.english")}
      </button>
      <button
        type="button"
        className="language-toggle__btn"
        aria-pressed={locale === "zh"}
        onClick={() => selectLocale("zh")}
      >
        {t("languageToggle.chinese")}
      </button>
    </div>
  );
}
