import { normalizeSearchQuery } from "./search.ts";
import type { BannerGroupModel } from "./bannerEligibility.ts";
import type { SupportedLocale } from "../types/content.ts";

export interface BannerSearchModel {
  readonly query: string;
  readonly groups: readonly BannerGroupModel[];
  readonly totalCount: number;
  readonly resultCount: number;
  readonly hasNoResults: boolean;
}

export function filterEligibleBannerGroups(
  groups: readonly BannerGroupModel[],
  query: string,
  locale: SupportedLocale,
): BannerSearchModel {
  const normalizedQuery = normalizeSearchQuery(query, locale);
  const filteredGroups = groups.map((group) => ({
    classification: group.classification,
    items:
      normalizedQuery.length === 0
        ? group.items
        : group.items.filter((banner) =>
            banner.name.normalize("NFC").toLocaleLowerCase(locale).includes(normalizedQuery),
          ),
  }));
  const totalCount = groups.reduce((count, group) => count + group.items.length, 0);
  const resultCount = filteredGroups.reduce((count, group) => count + group.items.length, 0);

  return {
    query: normalizedQuery,
    groups: filteredGroups,
    totalCount,
    resultCount,
    hasNoResults: resultCount === 0,
  };
}
