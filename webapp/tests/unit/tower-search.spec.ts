import { describe, expect, it } from "vitest";

import { matchesLocalizedName, normalizeSearchQuery } from "../../src/app/search.ts";
import { createContentRepository } from "../../src/content/contentRepository.ts";
import { createTowerCatalogueModel } from "../../src/app/towerCatalogue.ts";
import { cloneValidBundle } from "../fixtures/content/index.ts";

describe("tower search", () => {
  it("normalizes whitespace, Unicode, and locale-aware case without fuzzy matching", () => {
    expect(normalizeSearchQuery("  A\u0308THER  ", "de")).toBe("äther");
    expect(matchesLocalizedName({ en: "Aether", de: "Äther-Turm" }, " A\u0308THER ", "de")).toBe(
      true,
    );
    expect(matchesLocalizedName({ en: "Arc Tower" }, "ark", "en")).toBe(false);
  });

  it("restores all towers for empty input and preserves repository order", () => {
    const repository = createContentRepository(cloneValidBundle());

    expect(createTowerCatalogueModel(repository, "en", "  ").items.map((item) => item.id)).toEqual([
      "arc-tower",
      "ember-tower",
    ]);
    expect(
      createTowerCatalogueModel(repository, "en", "TOWER").items.map((item) => item.id),
    ).toEqual(["arc-tower", "ember-tower"]);
    expect(
      createTowerCatalogueModel(repository, "en", "ember").items.map((item) => item.id),
    ).toEqual(["ember-tower"]);
  });
});
