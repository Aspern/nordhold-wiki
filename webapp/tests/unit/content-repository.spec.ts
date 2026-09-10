import { describe, expect, it } from "vitest";

import {
  ContentRepositoryError,
  createContentRepository,
} from "../../src/content/contentRepository.ts";
import type { Eligibility, Tower } from "../../src/types/content.ts";
import {
  cloneValidBundle,
  unresolvedReferenceFixture,
  validBundle,
} from "../fixtures/content/index.ts";

describe("content repository", () => {
  it("loads validated content into immutable identity indexes", () => {
    const source = cloneValidBundle();
    const repository = createContentRepository(source);
    const tower = repository.getTower("arc-tower");

    expect(tower?.name.en).toBe("Arc Tower");
    expect(repository.getBanner("arc-focus")?.classification).toBe("tower-specific");
    expect(repository.towers).not.toBe(source.content.towers);
    expect(Object.isFrozen(repository.towers)).toBe(true);
    expect(Object.isFrozen(tower)).toBe(true);

    const sourceTower = source.content.towers[0];
    if (sourceTower === undefined) {
      throw new Error("The valid fixture requires a tower.");
    }
    (sourceTower.name as { en: string }).en = "Changed after loading";
    expect(repository.getTower("arc-tower")?.name.en).toBe("Arc Tower");
  });

  it("provides stable entity and eligibility order regardless of input array order", () => {
    const source = cloneValidBundle();
    (source.content.towers as Tower[]).reverse();
    (source.content.eligibility as Eligibility[]).reverse();
    const repository = createContentRepository(source);

    expect(repository.towers.map((tower) => tower.id)).toEqual(["arc-tower", "ember-tower"]);
    expect(repository.getEligibilityForTower("arc-tower").map((row) => row.bannerId)).toEqual([
      "arc-focus",
      "combined-spark",
      "singular-purpose",
      "steady-hands",
    ]);
  });

  it("rejects non-text markup and executable URI-like values", () => {
    const markup = cloneValidBundle();
    const markupTower = markup.content.towers[0];
    if (markupTower === undefined) {
      throw new Error("The valid fixture requires a tower.");
    }
    (markupTower.name as { en: string }).en = "<img src=x onerror=alert(1)>";
    expect(() => createContentRepository(markup)).toThrow(ContentRepositoryError);

    const executable = cloneValidBundle();
    const executableBanner = executable.content.banners[0];
    if (executableBanner === undefined) {
      throw new Error("The valid fixture requires a banner.");
    }
    (executableBanner.effectDescription as { en: string }).en = "javascript:alert(1)";
    expect(() => createContentRepository(executable)).toThrow("unsafe text");
  });

  it("rejects unresolved content and provenance references", () => {
    expect(() => createContentRepository(unresolvedReferenceFixture())).toThrow(
      "unknown banner 'missing-banner'",
    );

    const missingProvenance = cloneValidBundle();
    const missingProvenanceTower = missingProvenance.content.towers[0];
    if (missingProvenanceTower === undefined) {
      throw new Error("The valid fixture requires a tower.");
    }
    (missingProvenanceTower as { provenanceRef: string }).provenanceRef = "missing-provenance";
    expect(() => createContentRepository(missingProvenance)).toThrow(
      "unknown provenance 'missing-provenance'",
    );
  });

  it("rejects duplicate identity records instead of silently overwriting an index", () => {
    const duplicate = cloneValidBundle();
    const duplicateTower = validBundle.content.towers[0];
    if (duplicateTower === undefined) {
      throw new Error("The valid fixture requires a tower.");
    }
    (duplicate.content.towers as Tower[]).push(structuredClone(duplicateTower));

    expect(() => createContentRepository(duplicate)).toThrow("duplicate tower 'arc-tower'");
  });
});
