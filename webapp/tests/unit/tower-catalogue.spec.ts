import { describe, expect, it } from "vitest";

import { createTowerCatalogueModel } from "../../src/app/towerCatalogue.ts";
import { createContentRepository } from "../../src/content/contentRepository.ts";
import { cloneValidBundle } from "../fixtures/content/index.ts";

describe("tower catalogue read model", () => {
  it("exposes each active tower once with localized content and its image reference", () => {
    const repository = createContentRepository(cloneValidBundle());
    const model = createTowerCatalogueModel(repository, "de", "");

    expect(model.totalCount).toBe(2);
    expect(model.resultCount).toBe(2);
    expect(new Set(model.items.map((item) => item.id)).size).toBe(2);
    expect(model.items[0]).toMatchObject({
      id: "arc-tower",
      name: "Arkan-Turm",
      visual: { kind: "image", path: "src/assets/entities/towers/arc-tower.png" },
    });
  });

  it("reports a clear no-results state without changing the total", () => {
    const repository = createContentRepository(cloneValidBundle());
    const model = createTowerCatalogueModel(repository, "en", "missing");

    expect(model).toMatchObject({ totalCount: 2, resultCount: 0, hasNoResults: true, items: [] });
  });
});
