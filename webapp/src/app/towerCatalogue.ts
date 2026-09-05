import { matchesLocalizedName, normalizeSearchQuery } from "./search.ts";
import { localizeRequiredText, localizeText } from "../i18n/localizeContent.ts";
import type { ContentRepository } from "../content/contentRepository.ts";
import type { ImageVisual, SupportedLocale } from "../types/content.ts";

export interface TowerCatalogueItem {
  readonly id: string;
  readonly name: string;
  readonly summary: string;
  readonly visual: ImageVisual;
  readonly visualAlt: string;
}

export interface TowerCatalogueModel {
  readonly query: string;
  readonly totalCount: number;
  readonly resultCount: number;
  readonly items: readonly TowerCatalogueItem[];
  readonly hasNoResults: boolean;
}

export function createTowerCatalogueModel(
  repository: ContentRepository,
  locale: SupportedLocale,
  query: string,
): TowerCatalogueModel {
  const items = repository.towers
    .filter((tower) => matchesLocalizedName(tower.name, query, locale))
    .map((tower) => ({
      id: tower.id,
      name: localizeText(tower.name, locale),
      summary: localizeRequiredText(tower.effectSummary, locale),
      visual: tower.visual,
      visualAlt: localizeText(tower.visual.alt, locale),
    }));

  return {
    query: normalizeSearchQuery(query, locale),
    totalCount: repository.towers.length,
    resultCount: items.length,
    items,
    hasNoResults: items.length === 0,
  };
}
