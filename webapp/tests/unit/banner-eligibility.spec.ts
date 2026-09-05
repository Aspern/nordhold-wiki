import { describe, expect, it } from "vitest";

import { createTowerDetailModel } from "../../src/app/bannerEligibility.ts";
import { createContentRepository } from "../../src/content/contentRepository.ts";
import { cloneValidBundle } from "../fixtures/content/index.ts";

describe("banner eligibility", () => {
  it("joins only eligible banners and keeps all four classification groups in order", () => {
    const repository = createContentRepository(cloneValidBundle());
    const detail = createTowerDetailModel(repository, "arc-tower", "en");
    if (detail.kind !== "found") {
      throw new Error("Expected the Arc Tower detail model.");
    }

    expect(detail.bannerCount).toBe(4);
    expect(detail.groups.map((group) => group.classification)).toEqual([
      "tower-specific",
      "fusion",
      "unique",
      "generalist",
    ]);
    expect(detail.groups.flatMap((group) => group.items.map((item) => item.id))).toEqual([
      "arc-focus",
      "combined-spark",
      "singular-purpose",
      "steady-hands",
    ]);

    const fusionBanner = detail.groups
      .find((group) => group.classification === "fusion")
      ?.items.find((item) => item.id === "combined-spark");
    expect(fusionBanner?.fusionTowers).toEqual([
      {
        id: "arc-tower",
        name: "Arc Tower",
        width: 64,
        height: 64,
      },
      {
        id: "ember-tower",
        name: "Ember Tower",
        width: 64,
        height: 64,
      },
    ]);
    expect(detail.groups[0]?.items[0]?.fusionTowers).toEqual([]);
  });

  it("does not leak a tower-specific banner into another tower", () => {
    const repository = createContentRepository(cloneValidBundle());
    const detail = createTowerDetailModel(repository, "ember-tower", "en");
    if (detail.kind !== "found") {
      throw new Error("Expected the Ember Tower detail model.");
    }

    expect(detail.groups.flatMap((group) => group.items.map((item) => item.id))).not.toContain(
      "arc-focus",
    );
    expect(detail.groups[0]?.items).toEqual([]);
  });
});
