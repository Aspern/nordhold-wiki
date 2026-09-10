import { describe, expect, it } from "vitest";

import { validateContentBundle } from "../../scripts/validate-content.ts";
import wikiContent from "../../src/content/wiki-content.json";
import type {
  Banner,
  BannerEffectValue,
  ProvenanceRecord,
  Tower,
  WikiContent,
} from "../../src/types/content.ts";
import {
  cloneValidBundle,
  duplicateFixture,
  fixtureVisuals,
  malformedFixture,
  missingEnglishFixture,
  missingGermanNameFixture,
  missingGermanSummaryFixture,
  unresolvedReferenceFixture,
} from "../fixtures/content/index.ts";

const inspectFixtureVisual = (path: string) => fixtureVisuals.get(path);
const generatedWikiContent = wikiContent as unknown as WikiContent;

describe("content validation", () => {
  it("contains the complete bilingual build 23261523 banner extraction", () => {
    expect(generatedWikiContent.gameBuildId).toBe("23261523");
    expect(generatedWikiContent.banners).toHaveLength(97);
    expect(
      generatedWikiContent.banners.every((banner) => banner.effectDescription.en.length > 0),
    ).toBe(true);
    expect(
      generatedWikiContent.banners.every((banner) => banner.effectDescription.de.length > 0),
    ).toBe(true);
    expect(
      generatedWikiContent.banners.every(
        (banner) =>
          !/<[^>]+>|\[[^\]]+\]/u.test(banner.effectDescription.en) &&
          !/<[^>]+>|\[[^\]]+\]/u.test(banner.effectDescription.de) &&
          banner.effectValues.every(
            (effect) =>
              !/<[^>]+>|\[[^\]]+\]/u.test(effect.label.en) &&
              !/<[^>]+>|\[[^\]]+\]/u.test(effect.label.de),
          ),
      ),
    ).toBe(true);
    const rarityEffects = generatedWikiContent.banners
      .filter((banner) => banner.classification === "tower-specific")
      .flatMap((banner) => banner.effectValues);
    const fixedEffects = generatedWikiContent.banners
      .filter((banner) => banner.classification !== "tower-specific")
      .flatMap((banner) => banner.effectValues);
    expect([...rarityEffects, ...fixedEffects]).toHaveLength(126);
    expect(rarityEffects).toHaveLength(66);
    expect(fixedEffects).toHaveLength(60);
    expect(
      rarityEffects.every(
        (effect) =>
          "values" in effect &&
          [effect.values.common, effect.values.rare, effect.values.legendary].every(
            Number.isFinite,
          ),
      ),
    ).toBe(true);
    expect(fixedEffects.every((effect) => "value" in effect && Number.isFinite(effect.value))).toBe(
      true,
    );
    expect(
      generatedWikiContent.banners
        .filter((banner) => banner.classification !== "tower-specific")
        .flatMap((banner) => [banner.effectDescription.en, banner.effectDescription.de])
        .every(
          (description) => !/(?<value>-?\d+(?:[,.]\d+)?)\/\k<value>\/\k<value>/u.test(description),
        ),
    ).toBe(true);
    expect(
      generatedWikiContent.banners
        .filter((banner) => banner.effectValues.length === 0)
        .map((banner) => banner.id),
    ).toEqual(["corpse-explosion-tower-specific", "ghost-raven", "ring-of-death", "multitude"]);
  });

  it("accepts a complete canonical bundle with all four classifications", async () => {
    const result = await validateContentBundle(cloneValidBundle(), {
      inspectVisual: inspectFixtureVisual,
    });

    expect(result.errors).toEqual([]);
    expect(result.valid).toBe(true);
    expect(
      new Set(cloneValidBundle().content.banners.map((banner) => banner.classification)),
    ).toEqual(new Set(["tower-specific", "generalist", "unique", "fusion"]));
  });

  it("rejects malformed schema input and missing required English values", async () => {
    const malformed = await validateContentBundle(malformedFixture());
    const missingEnglish = await validateContentBundle(missingEnglishFixture(), {
      inspectVisual: inspectFixtureVisual,
    });

    expect(malformed.errors.some((issue) => issue.code === "schema.invalid")).toBe(true);
    expect(missingEnglish.errors.some((issue) => issue.code === "schema.invalid")).toBe(true);
  });

  it("rejects duplicate stable IDs and unresolved eligibility references", async () => {
    const duplicate = await validateContentBundle(duplicateFixture(), {
      inspectVisual: inspectFixtureVisual,
    });
    const unresolved = await validateContentBundle(unresolvedReferenceFixture(), {
      inspectVisual: inspectFixtureVisual,
    });

    expect(duplicate.errors.some((issue) => issue.code === "id.duplicate")).toBe(true);
    expect(unresolved.errors.some((issue) => issue.code === "reference.unresolved")).toBe(true);
  });

  it("allows detectable German name fallback but requires bilingual effect text", async () => {
    const fallback = await validateContentBundle(missingGermanNameFixture(), {
      inspectVisual: inspectFixtureVisual,
    });
    const missingSummary = await validateContentBundle(missingGermanSummaryFixture(), {
      inspectVisual: inspectFixtureVisual,
    });

    expect(fallback.valid).toBe(true);
    expect(fallback.warnings.some((issue) => issue.code === "localization.fallback")).toBe(true);
    expect(missingSummary.errors.some((issue) => issue.code === "schema.invalid")).toBe(true);
  });

  it("rejects unresolved game placeholders in banner descriptions", async () => {
    const fixture = cloneValidBundle();
    const banner = fixture.content.banners[0];
    if (banner === undefined) {
      throw new Error("The valid fixture requires a banner.");
    }
    (banner.effectDescription as { en: string }).en = "Adds [Amount]% damage.";

    const result = await validateContentBundle(fixture, {
      inspectVisual: inspectFixtureVisual,
    });

    expect(result.errors.some((issue) => issue.code === "text.markup")).toBe(true);
  });

  it("rejects incomplete rarity records and unsupported formatting metadata", async () => {
    const incomplete = cloneValidBundle();
    const incompleteEffect = incomplete.content.banners[0]?.effectValues[0];
    if (incompleteEffect === undefined) {
      throw new Error("The valid fixture requires a banner effect.");
    }
    if (!("values" in incompleteEffect)) {
      throw new Error("The first fixture effect must contain rarity values.");
    }
    delete (incompleteEffect.values as { legendary?: number }).legendary;

    const unsupported = cloneValidBundle();
    const unsupportedEffect = unsupported.content.banners[0]?.effectValues[0];
    if (unsupportedEffect === undefined) {
      throw new Error("The valid fixture requires a banner effect.");
    }
    (unsupportedEffect.format as { suffix: string }).suffix = "points";

    const [incompleteResult, unsupportedResult] = await Promise.all([
      validateContentBundle(incomplete, { inspectVisual: inspectFixtureVisual }),
      validateContentBundle(unsupported, { inspectVisual: inspectFixtureVisual }),
    ]);

    expect(incompleteResult.errors.some((issue) => issue.code === "schema.invalid")).toBe(true);
    expect(unsupportedResult.errors.some((issue) => issue.code === "schema.invalid")).toBe(true);
  });

  it("rejects an effect-value shape that does not match the banner classification", async () => {
    const fixture = cloneValidBundle();
    const banner = fixture.content.banners.find(
      (candidate) => candidate.classification === "generalist",
    );
    const effect = banner?.effectValues[0];
    if (banner === undefined || effect === undefined || !("value" in effect)) {
      throw new Error("The valid fixture requires a fixed generalist effect.");
    }
    const { value, ...sharedEffect } = effect;
    (banner.effectValues as BannerEffectValue[])[0] = {
      ...sharedEffect,
      values: { common: value, rare: value, legendary: value },
    };

    const result = await validateContentBundle(fixture, {
      inspectVisual: inspectFixtureVisual,
    });

    expect(result.errors.some((issue) => issue.code === "schema.invalid")).toBe(true);
  });

  it("enforces tower affinity and provenance identity", async () => {
    const affinity = cloneValidBundle();
    (affinity.content.banners[0] as Banner & { towerAffinityId: string }).towerAffinityId =
      "ember-tower";
    const provenance = cloneValidBundle();
    (provenance.provenance.records[0] as ProvenanceRecord & { entityId: string }).entityId =
      "wrong-entity";

    const affinityResult = await validateContentBundle(affinity, {
      inspectVisual: inspectFixtureVisual,
    });
    const provenanceResult = await validateContentBundle(provenance, {
      inspectVisual: inspectFixtureVisual,
    });

    expect(affinityResult.errors.some((issue) => issue.code === "eligibility.affinity")).toBe(true);
    expect(provenanceResult.errors.some((issue) => issue.code === "provenance.mismatch")).toBe(
      true,
    );
  });

  it("rejects non-canonical order and incomplete or reused visuals", async () => {
    const unordered = cloneValidBundle();
    (unordered.content.towers as Tower[]).reverse();
    const reused = cloneValidBundle();
    const firstBanner = reused.content.banners[0];
    if (firstBanner === undefined || reused.content.banners[1] === undefined) {
      throw new Error("The valid fixture must contain two banners.");
    }
    (reused.content.banners[1] as Banner & { visual: Banner["visual"] }).visual =
      firstBanner.visual;

    const unorderedResult = await validateContentBundle(unordered, {
      inspectVisual: inspectFixtureVisual,
    });
    const reusedResult = await validateContentBundle(reused, {
      inspectVisual: inspectFixtureVisual,
    });

    expect(unorderedResult.errors.some((issue) => issue.code === "order.noncanonical")).toBe(true);
    expect(reusedResult.errors.some((issue) => issue.code === "visual.duplicate")).toBe(true);
  });

  it("rejects visual digest and dimension mismatches", async () => {
    const result = await validateContentBundle(cloneValidBundle(), {
      inspectVisual: (path) => {
        const visual = fixtureVisuals.get(path);
        return visual === undefined ? undefined : { ...visual, width: visual.width + 1 };
      },
    });

    expect(result.errors.some((issue) => issue.code === "visual.metadata")).toBe(true);
  });
});
