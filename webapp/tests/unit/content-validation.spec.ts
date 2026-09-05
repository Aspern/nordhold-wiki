import { describe, expect, it } from "vitest";

import { validateContentBundle } from "../../scripts/validate-content.ts";
import type { Banner, ProvenanceRecord, Tower } from "../../src/types/content.ts";
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

describe("content validation", () => {
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

  it("allows detectable German name fallback but requires bilingual effect summaries", async () => {
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
