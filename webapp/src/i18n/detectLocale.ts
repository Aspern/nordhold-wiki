import { supportedLocales, type SupportedLocale } from "../types/content.ts";

const supportedLocaleSet = new Set<string>(supportedLocales);

export function selectSupportedLocale(preferences: readonly string[]): SupportedLocale {
  const visited = new Set<string>();

  for (const preference of preferences) {
    const normalized = preference.trim().replaceAll("_", "-").toLowerCase();
    if (normalized.length === 0 || visited.has(normalized)) {
      continue;
    }
    visited.add(normalized);

    const baseLocale = normalized.split("-")[0];
    if (baseLocale !== undefined && supportedLocaleSet.has(baseLocale)) {
      return baseLocale as SupportedLocale;
    }
  }

  return "en";
}

export function detectBrowserLocale(): SupportedLocale {
  if (typeof navigator === "undefined") {
    return "en";
  }

  const preferences = navigator.languages.length > 0 ? navigator.languages : [navigator.language];
  return selectSupportedLocale(preferences);
}
