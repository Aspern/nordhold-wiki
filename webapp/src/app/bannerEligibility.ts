import type { ContentRepository } from "../content/contentRepository.ts";
import { localizeRequiredText, localizeText } from "../i18n/localizeContent.ts";
import type { BannerClassification, CssVisual, SupportedLocale } from "../types/content.ts";

export const STABLE_TOWER_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;
const bannerGroupOrder: readonly BannerClassification[] = [
  "tower-specific",
  "fusion",
  "unique",
  "generalist",
];

export interface LocalizedFusionTower {
  readonly id: string;
  readonly name: string;
  readonly width: number;
  readonly height: number;
}

export interface LocalizedBannerItem {
  readonly id: string;
  readonly name: string;
  readonly summary: string;
  readonly classification: BannerClassification;
  readonly visual: CssVisual;
  readonly visualAlt: string;
  readonly fusionTowers: readonly LocalizedFusionTower[];
}

export interface BannerGroupModel {
  readonly classification: BannerClassification;
  readonly items: readonly LocalizedBannerItem[];
}

export interface TowerDetailFoundModel {
  readonly kind: "found";
  readonly tower: {
    readonly id: string;
    readonly name: string;
    readonly summary: string;
    readonly visualAlt: string;
  };
  readonly groups: readonly BannerGroupModel[];
  readonly bannerCount: number;
}

export interface TowerDetailNotFoundModel {
  readonly kind: "not-found";
}

export type TowerDetailModel = TowerDetailFoundModel | TowerDetailNotFoundModel;

export function parseTowerId(value: unknown): string | undefined {
  if (typeof value !== "string" || !STABLE_TOWER_ID.test(value)) {
    return undefined;
  }
  return value;
}

export function createTowerDetailModel(
  repository: ContentRepository,
  towerIdValue: unknown,
  locale: SupportedLocale,
): TowerDetailModel {
  const towerId = parseTowerId(towerIdValue);
  const tower = towerId === undefined ? undefined : repository.getTower(towerId);
  if (tower === undefined) {
    return { kind: "not-found" };
  }

  const eligibleIds = new Set(
    repository.getEligibilityForTower(tower.id).map((entry) => entry.bannerId),
  );
  const eligibleTowerIdsByBanner = new Map<string, Set<string>>();
  for (const candidateTower of repository.towers) {
    for (const entry of repository.getEligibilityForTower(candidateTower.id)) {
      const towerIds = eligibleTowerIdsByBanner.get(entry.bannerId) ?? new Set<string>();
      towerIds.add(candidateTower.id);
      eligibleTowerIdsByBanner.set(entry.bannerId, towerIds);
    }
  }
  const banners = repository.banners
    .filter((banner) => eligibleIds.has(banner.id))
    .filter(
      (banner) => banner.classification !== "tower-specific" || banner.towerAffinityId === tower.id,
    )
    .map((banner) => ({
      id: banner.id,
      name: localizeText(banner.name, locale),
      summary: localizeRequiredText(banner.effectSummary, locale),
      classification: banner.classification,
      visual: banner.visual,
      visualAlt: localizeText(banner.visual.alt, locale),
      fusionTowers:
        banner.classification === "fusion"
          ? repository.towers
              .filter((candidateTower) =>
                eligibleTowerIdsByBanner.get(banner.id)?.has(candidateTower.id),
              )
              .map((candidateTower) => ({
                id: candidateTower.id,
                name: localizeText(candidateTower.name, locale),
                width: candidateTower.visual.width,
                height: candidateTower.visual.height,
              }))
          : [],
    }));
  const groups = bannerGroupOrder.map((classification) => ({
    classification,
    items: banners.filter((banner) => banner.classification === classification),
  }));

  return {
    kind: "found",
    tower: {
      id: tower.id,
      name: localizeText(tower.name, locale),
      summary: localizeRequiredText(tower.effectSummary, locale),
      visualAlt: localizeText(tower.visual.alt, locale),
    },
    groups,
    bannerCount: banners.length,
  };
}
