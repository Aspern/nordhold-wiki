import { createI18n } from "vue-i18n";

import type { SupportedLocale } from "../types/content.ts";
import de from "./messages/de.json";
import en from "./messages/en.json";
import { detectBrowserLocale } from "./detectLocale.ts";

export const interfaceMessages = { de, en } as const;

export function createWikiI18n(locale: SupportedLocale = detectBrowserLocale()) {
  return createI18n({
    legacy: false,
    locale,
    fallbackLocale: "en",
    escapeParameter: true,
    fallbackWarn: false,
    missingWarn: false,
    messages: interfaceMessages,
  });
}

export type WikiI18n = ReturnType<typeof createWikiI18n>;
