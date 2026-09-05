import { describe, expect, it } from "vitest";

import { createTowerDetailModel } from "../../src/app/bannerEligibility.ts";
import { filterEligibleBannerGroups } from "../../src/app/bannerSearch.ts";
import { createContentRepository } from "../../src/content/contentRepository.ts";
import { cloneValidBundle } from "../fixtures/content/index.ts";

describe("banner search", () => {
  const detail = createTowerDetailModel(
    createContentRepository(cloneValidBundle()),
    "arc-tower",
    "en",
  );
  if (detail.kind !== "found") {
    throw new Error("Expected the Arc Tower detail model.");
  }

  it("filters only the precomputed eligibility set and preserves groups", () => {
    const result = filterEligibleBannerGroups(detail.groups, " SPARK ", "en");

    expect(result.groups.map((group) => group.classification)).toEqual(
      detail.groups.map((group) => group.classification),
    );
    expect(result.groups.flatMap((group) => group.items.map((item) => item.id))).toEqual([
      "combined-spark",
    ]);
    expect(result.totalCount).toBe(4);
    expect(result.resultCount).toBe(1);
  });

  it("restores the full stable grouping for blank input", () => {
    const result = filterEligibleBannerGroups(detail.groups, "   ", "en");
    expect(result.groups).toEqual(detail.groups);
    expect(result.resultCount).toBe(4);
  });
});
