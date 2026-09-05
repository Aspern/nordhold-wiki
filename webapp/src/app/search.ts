import type { LocalizedText, SupportedLocale } from "../types/content.ts";
import { localizeText } from "../i18n/localizeContent.ts";

export function normalizeSearchQuery(value: string, locale: SupportedLocale): string {
  return value.normalize("NFC").trim().toLocaleLowerCase(locale);
}

export function matchesLocalizedName(
  name: LocalizedText,
  query: string,
  locale: SupportedLocale,
): boolean {
  const normalizedQuery = normalizeSearchQuery(query, locale);
  if (normalizedQuery.length === 0) {
    return true;
  }

  return localizeText(name, locale)
    .normalize("NFC")
    .toLocaleLowerCase(locale)
    .includes(normalizedQuery);
}
