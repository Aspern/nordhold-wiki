import { localizeRequiredText } from "../i18n/localizeContent.ts";
import type {
  BannerEffectFormat,
  BannerEffectValue,
  BannerRarityValues,
  SupportedLocale,
} from "../types/content.ts";

export const bannerRarities = ["common", "rare", "legendary"] as const;
export type BannerRarity = (typeof bannerRarities)[number];

export interface LocalizedBannerRarityValue {
  readonly rarity: BannerRarity;
  readonly text: string;
}

interface LocalizedBannerEffectValueBase {
  readonly sourceKey: string;
  readonly label: string;
  readonly accessibleLabel: string;
}

export interface LocalizedBannerRarityEffectValue extends LocalizedBannerEffectValueBase {
  readonly kind: "rarity";
  readonly rarityValues: readonly LocalizedBannerRarityValue[];
}

export interface LocalizedBannerFixedEffectValue extends LocalizedBannerEffectValueBase {
  readonly kind: "fixed";
  readonly valueText: string;
}

export type LocalizedBannerEffectValue =
  LocalizedBannerRarityEffectValue | LocalizedBannerFixedEffectValue;

const rarityNames: Readonly<Record<SupportedLocale, Readonly<Record<BannerRarity, string>>>> = {
  en: { common: "Common", rare: "Rare", legendary: "Legendary" },
  de: { common: "Normal", rare: "Selten", legendary: "Legendär" },
};

function numberText(value: number, locale: SupportedLocale): string {
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: 6,
    useGrouping: false,
  }).format(value);
}

export function formatBannerEffectNumber(
  value: number,
  format: BannerEffectFormat,
  locale: SupportedLocale,
): string {
  const prefix = value < 0 || format.prefix === "none" ? "" : format.prefix === "plus" ? "+" : "±";
  const suffix =
    format.suffix === "percent"
      ? "%"
      : format.suffix === "seconds"
        ? locale === "de"
          ? " Sek."
          : " sec"
        : format.suffix === "multiplier"
          ? "x"
          : "";
  return `${prefix}${numberText(value, locale)}${suffix}`;
}

export function localizeBannerEffectValue(
  effect: BannerEffectValue,
  locale: SupportedLocale,
): LocalizedBannerEffectValue {
  const label = localizeRequiredText(effect.label, locale);
  if ("value" in effect) {
    const valueText = formatBannerEffectNumber(effect.value, effect.format, locale);
    return {
      kind: "fixed",
      sourceKey: effect.sourceKey,
      label,
      valueText,
      accessibleLabel: `${label}: ${valueText}`,
    };
  }

  const rarityValues = bannerRarities.map((rarity) => ({
    rarity,
    text: formatBannerEffectNumber(effect.values[rarity], effect.format, locale),
  }));
  const accessibleValues = rarityValues
    .map(({ rarity, text }) => `${rarityNames[locale][rarity]} ${text}`)
    .join(", ");
  return {
    kind: "rarity",
    sourceKey: effect.sourceKey,
    label,
    rarityValues,
    accessibleLabel: `${label}: ${accessibleValues}`,
  };
}

export function compactRawRarityValues(values: BannerRarityValues): string {
  return bannerRarities.map((rarity) => String(values[rarity])).join("/");
}
