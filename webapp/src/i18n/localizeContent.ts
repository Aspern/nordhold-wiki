import type { LocalizedText, RequiredLocalizedText, SupportedLocale } from "../types/content.ts";

export function localizeText(value: LocalizedText, locale: SupportedLocale): string {
  if (locale === "de" && value.de !== undefined && value.de.trim().length > 0) {
    return value.de;
  }

  return value.en;
}

export function localizeRequiredText(
  value: RequiredLocalizedText,
  locale: SupportedLocale,
): string {
  return value[locale];
}
