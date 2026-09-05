import { describe, expect, it } from "vitest";

import {
  NormalizationError,
  normalizeGameData,
  serializeNormalizedFacts,
} from "../../scripts/normalize-game-data.ts";
import { decisions, editorial, initialIdMap, rawExtraction } from "../fixtures/normalization.ts";

describe("game-data normalization", () => {
  it("preserves stable aliases and 64-bit path IDs as decimal strings", () => {
    const result = normalizeGameData(rawExtraction, decisions, editorial, initialIdMap);
    const arcTower = result.bundle.content.towers.find((tower) => tower.id === "arc-tower");
    const provenance = result.bundle.provenance.records.find(
      (record) => record.id === "tower-arc-tower-source",
    );

    expect(arcTower?.sourceKey).toBe("Tower_Lightning");
    expect(provenance?.sources[0]?.objectPathId).toBe("9223372036854775806");
    expect(result.bundle.idMap.towers[0]?.id).toBe("arc-tower");
  });

  it("derives eligibility only from runtime banner-manager evidence", () => {
    const result = normalizeGameData(rawExtraction, decisions, editorial, initialIdMap);

    expect(result.bundle.content.eligibility).toEqual([
      expect.objectContaining({ towerId: "arc-tower", bannerId: "arc-focus" }),
      expect.objectContaining({ towerId: "arc-tower", bannerId: "steady-hands" }),
      expect.objectContaining({ towerId: "ember-tower", bannerId: "steady-hands" }),
    ]);
    expect(
      result.bundle.provenance.records
        .filter((record) => record.entityType === "eligibility")
        .every(
          (record) =>
            record.sources[0]?.sourceAsset === "NordHold_Data/level2" &&
            record.sources[1]?.sourceAsset === "NordHold_Data/resources.assets",
        ),
    ).toBe(true);
  });

  it("excludes reviewed obsolete and duplicate source records", () => {
    const result = normalizeGameData(rawExtraction, decisions, editorial, initialIdMap);

    expect(result.bundle.content.banners.map((banner) => banner.id)).toEqual([
      "arc-focus",
      "steady-hands",
    ]);
    expect(result.report.obsoleteSourceKeys).toEqual(["Banner_OldRule"]);
    expect(result.report.duplicateSourceKeys).toEqual(["Banner_General_Copy"]);
  });

  it("rejects extractor parse errors without producing facts", () => {
    const raw = {
      ...structuredClone(rawExtraction),
      parse_error_count: 1,
      parse_errors: [
        {
          source: "NordHold_Data/resources.assets",
          path_id: "999",
          error_type: "ValueError",
          error: "Unknown typetree",
        },
      ] satisfies {
        source: string;
        path_id: string;
        error_type: string;
        error: string;
      }[],
    };

    expect(() => normalizeGameData(raw, decisions, editorial, initialIdMap)).toThrow(
      NormalizationError,
    );
  });

  it("reports unresolved review uncertainty as a blocking failure", () => {
    const uncertain = {
      ...structuredClone(decisions),
      uncertainties: ["Banner classification is not resolved."],
    };

    expect(() => normalizeGameData(rawExtraction, uncertain, editorial, initialIdMap)).toThrow(
      "Banner classification is not resolved.",
    );
  });

  it("produces byte-stable facts for identical inputs", () => {
    const first = normalizeGameData(rawExtraction, decisions, editorial, initialIdMap);
    const second = normalizeGameData(
      structuredClone(rawExtraction),
      structuredClone(decisions),
      structuredClone(editorial),
      structuredClone(initialIdMap),
    );

    expect(serializeNormalizedFacts(first.bundle)).toBe(serializeNormalizedFacts(second.bundle));
  });
});
