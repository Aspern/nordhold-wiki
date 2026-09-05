import { describe, expect, it } from "vitest";

import { interfaceMessages } from "../../src/i18n/index.ts";
import { localizeRequiredText, localizeText } from "../../src/i18n/localizeContent.ts";

function flattenKeys(value: Readonly<Record<string, unknown>>, prefix = ""): readonly string[] {
  return Object.entries(value).flatMap(([key, child]) => {
    const path = prefix.length === 0 ? key : `${prefix}.${key}`;
    return typeof child === "object" && child !== null
      ? flattenKeys(child as Readonly<Record<string, unknown>>, path)
      : [path];
  });
}

describe("localization validation", () => {
  it("keeps exact English and German interface key parity", () => {
    expect(
      [...flattenKeys(interfaceMessages.de as Readonly<Record<string, unknown>>)].sort(),
    ).toEqual([...flattenKeys(interfaceMessages.en as Readonly<Record<string, unknown>>)].sort());
  });

  it("falls back to English for optional German game text but not required summaries", () => {
    expect(localizeText({ en: "Runestone Tower" }, "de")).toBe("Runestone Tower");
    expect(
      localizeRequiredText({ en: "English summary", de: "Deutsche Zusammenfassung" }, "de"),
    ).toBe("Deutsche Zusammenfassung");
  });
});
