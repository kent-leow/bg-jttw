import { useCallback, useEffect, useState } from "react";
import en from "./locales/en.json";
import zh from "./locales/zh.json";

export type Locale = "en" | "zh";
export type TranslationTable = Record<string, string>;

const locales: Record<Locale, TranslationTable> = { en, zh };

let activeLocale: Locale = "en";
const listeners = new Set<() => void>();

export function getLocale(): Locale {
  return activeLocale;
}

export function setLocale(locale: Locale): void {
  activeLocale = locale;
  for (const listener of listeners) {
    listener();
  }
}

export function subscribeLocale(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Pure lookup, exposed separately from `t` so it can be unit-tested against fabricated tables
 * without depending on the real bundled locale files. Falls back to the `en` table (and warns
 * explicitly rather than failing silently) when a key is missing in the requested locale, and
 * returns the raw key (with a warning) if it is missing everywhere.
 */
export function translate(key: string, locale: Locale, tables: Record<Locale, TranslationTable>): string {
  const table = tables[locale];
  if (table && key in table) {
    return table[key]!;
  }
  const fallback = tables.en;
  if (locale !== "en" && fallback && key in fallback) {
    console.warn(`Missing translation for key "${key}" in locale "${locale}"; falling back to "en".`);
    return fallback[key]!;
  }
  console.warn(`Missing translation for key "${key}" in all locales.`);
  return key;
}

export function t(key: string, params?: Readonly<Record<string, string | number>>): string {
  let result = translate(key, activeLocale, locales);
  if (params) {
    for (const [name, value] of Object.entries(params)) {
      result = result.replaceAll(`{${name}}`, String(value));
    }
  }
  return result;
}

export function useTranslation() {
  const [locale, setLocaleState] = useState<Locale>(getLocale());

  useEffect(() => subscribeLocale(() => setLocaleState(getLocale())), []);

  const translateWithParams = useCallback(
    (key: string, params?: Readonly<Record<string, string | number>>) => t(key, params),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [locale],
  );

  return { t: translateWithParams, locale, setLocale };
}
