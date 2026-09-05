import { describe, expect, it } from "vitest";

import { selectSupportedLocale } from "../../src/i18n/detectLocale.ts";

describe("browser locale selection", () => {
  it("uses the first supported ordered preference including regional variants", () => {
    expect(selectSupportedLocale(["fr-FR", "de-AT", "en-US"])).toBe("de");
    expect(selectSupportedLocale(["EN_us", "de-DE"])).toBe("en");
  });

  it("ignores blanks and duplicates and falls back to English", () => {
    expect(selectSupportedLocale(["", "de-DE", "DE-de"])).toBe("de");
    expect(selectSupportedLocale(["fr", "pl-PL"])).toBe("en");
    expect(selectSupportedLocale([])).toBe("en");
  });
});
