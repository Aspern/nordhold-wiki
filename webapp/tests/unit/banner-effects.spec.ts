import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import {
  decodeOdinEntries,
  extractBannerEffectValues,
  sanitizeGameText,
} from "../../scripts/extract-banner-effects.ts";
import { normalizeBannerEffectValues } from "../../scripts/generate-initial-content.ts";
import {
  compactRawRarityValues,
  formatBannerEffectNumber,
  localizeBannerEffectValue,
} from "../../src/app/bannerEffects.ts";
import type { BannerFixedEffectValue, BannerRarityEffectValue } from "../../src/types/content.ts";

function int32(value: number): number[] {
  const bytes = new Uint8Array(4);
  new DataView(bytes.buffer).setInt32(0, value, true);
  return [...bytes];
}

function float32(value: number): number[] {
  const bytes = new Uint8Array(4);
  new DataView(bytes.buffer).setFloat32(0, value, true);
  return [...bytes];
}

function odinString(value: string): number[] {
  return [0, ...int32(value.length), ...new TextEncoder().encode(value)];
}

function legacyFireRateBytes(values: readonly number[]): number[] {
  return [
    0x01,
    ...odinString("BaseFireRate"),
    0x2e,
    ...int32(0),
    ...values.flatMap((value, rarity) => [
      0x17,
      ...odinString("$k"),
      ...int32(rarity),
      0x1f,
      ...odinString("$v"),
      ...float32(value),
    ]),
    0x05,
    0x31,
  ];
}

function contrastRatio(foreground: string, background: string): number {
  const luminance = (hex: string): number => {
    const channels = [1, 3, 5].map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16));
    const linear = channels.map((channel) => {
      const normalized = channel / 255;
      return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * (linear[0] ?? 0) + 0.7152 * (linear[1] ?? 0) + 0.0722 * (linear[2] ?? 0);
  };
  const lighter = Math.max(luminance(foreground), luminance(background));
  const darker = Math.min(luminance(foreground), luminance(background));
  return (lighter + 0.05) / (darker + 0.05);
}

const percentageEffect: BannerRarityEffectValue = {
  sourceKey: "Damage",
  label: { en: "Damage", de: "Schaden" },
  values: { common: 2, rare: 6, legendary: 10 },
  format: {
    prefix: "plus",
    suffix: "percent",
    hideEqualValues: false,
    restriction: null,
  },
};

const fixedPercentageEffect: BannerFixedEffectValue = {
  sourceKey: "ReliableOutput",
  label: { en: "Reliable output", de: "Verlaessliche Wirkung" },
  value: 5,
  format: {
    prefix: "plus",
    suffix: "percent",
    hideEqualValues: true,
    restriction: null,
  },
};

describe("banner effect extraction and presentation", () => {
  it("decodes a synthetic Odin rarity dictionary into a legacy effect", () => {
    const bytes = legacyFireRateBytes([12, 18, 25]);
    expect(decodeOdinEntries(bytes)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "$k", value: 0 }),
        expect.objectContaining({ name: "$v", value: 25 }),
      ]),
    );
    expect(
      extractBannerEffectValues("bodkin-arrow", bytes, () => ({ en: "unused", de: "unused" })),
    ).toEqual([
      {
        sourceKey: "BaseFireRate",
        label: { en: "Fire Rate", de: "Feuerrate" },
        values: { common: 12, rare: 18, legendary: 25 },
        format: {
          prefix: "plus",
          suffix: "percent",
          hideEqualValues: false,
          restriction: null,
        },
      },
    ]);
  });

  it("fails when binary rarity data is truncated or incomplete", () => {
    expect(() => decodeOdinEntries([0x17, 0])).toThrow("Unexpected end of Odin data");
    expect(() =>
      extractBannerEffectValues("bodkin-arrow", legacyFireRateBytes([12, 18]), () => ({
        en: "unused",
        de: "unused",
      })),
    ).toThrow("missing CardRarity 2");
  });

  it("preserves visible source wording while removing approved game markup", () => {
    expect(
      sanitizeGameText(
        "<colorName>Damage</colorName> increases <key>muliplicatively</key>. <icon=burn>",
      ),
    ).toBe("Damage increases muliplicatively.");
    expect(() => sanitizeGameText("Damage <script>alert(1)</script>")).toThrow(
      "Unsupported game markup",
    );
  });

  it("formats compact signed, percentage, duration, and multiplier values", () => {
    expect(formatBannerEffectNumber(2, percentageEffect.format, "en")).toBe("+2%");
    expect(
      formatBannerEffectNumber(
        2.5,
        { ...percentageEffect.format, prefix: "none", suffix: "seconds" },
        "de",
      ),
    ).toBe("2,5 Sek.");
    expect(
      formatBannerEffectNumber(
        1.75,
        { ...percentageEffect.format, prefix: "plus-or-minus", suffix: "multiplier" },
        "en",
      ),
    ).toBe("±1.75x");
    expect(compactRawRarityValues(percentageEffect.values)).toBe("2/6/10");
  });

  it("localizes all rarity values and exposes their identities without color", () => {
    expect(localizeBannerEffectValue(percentageEffect, "de")).toEqual({
      kind: "rarity",
      sourceKey: "Damage",
      label: "Schaden",
      rarityValues: [
        { rarity: "common", text: "+2%" },
        { rarity: "rare", text: "+6%" },
        { rarity: "legendary", text: "+10%" },
      ],
      accessibleLabel: "Schaden: Normal +2%, Selten +6%, Legendär +10%",
    });
  });

  it("normalizes and localizes one fixed value for non-rarity banner classifications", () => {
    const extracted: BannerRarityEffectValue[] = [
      {
        sourceKey: fixedPercentageEffect.sourceKey,
        label: fixedPercentageEffect.label,
        values: { common: 5, rare: 5, legendary: 5 },
        format: fixedPercentageEffect.format,
      },
    ];

    expect(normalizeBannerEffectValues("steady-hands", "generalist", extracted)).toEqual([
      fixedPercentageEffect,
    ]);
    expect(normalizeBannerEffectValues("arc-focus", "tower-specific", extracted)).toEqual(
      extracted,
    );
    expect(localizeBannerEffectValue(fixedPercentageEffect, "en")).toEqual({
      kind: "fixed",
      sourceKey: "ReliableOutput",
      label: "Reliable output",
      valueText: "+5%",
      accessibleLabel: "Reliable output: +5%",
    });
  });

  it("rejects rarity-dependent source slots for a non-rarity banner classification", () => {
    expect(() =>
      normalizeBannerEffectValues("steady-hands", "generalist", [percentageEffect]),
    ).toThrow("rarity-dependent source values");
  });

  it("keeps the visual three-value sequence together and labels it accessibly", async () => {
    const component = await readFile(
      new URL("../../src/components/BannerCard.vue", import.meta.url),
      "utf8",
    );
    expect(component).toContain(':aria-label="effect.accessibleLabel"');
    expect(component).toContain("effect.kind === 'fixed'");
    expect(component).toContain('v-if="index > 0" aria-hidden="true">/</span>');
    expect(component).toMatch(/banner-card__effect-values[\s\S]*white-space: nowrap/u);
  });

  it("uses rarity tokens that meet AA text contrast on banner cards", async () => {
    const tokens = await readFile(new URL("../../src/theme/tokens.css", import.meta.url), "utf8");
    const tokenValue = (name: string): string => {
      const value = new RegExp(`${name}:\\s*(#[0-9a-f]{6})`, "u").exec(tokens)?.[1];
      if (value === undefined) {
        throw new Error(`Missing color token '${name}'.`);
      }
      return value;
    };
    const background = tokenValue("--wiki-color-surface-raised");
    expect(
      contrastRatio(tokenValue("--wiki-color-rarity-common"), background),
    ).toBeGreaterThanOrEqual(4.5);
    expect(
      contrastRatio(tokenValue("--wiki-color-rarity-rare"), background),
    ).toBeGreaterThanOrEqual(4.5);
    expect(
      contrastRatio(tokenValue("--wiki-color-rarity-legendary"), background),
    ).toBeGreaterThanOrEqual(4.5);
  });
});
