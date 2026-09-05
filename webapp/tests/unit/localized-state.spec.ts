import { describe, expect, it } from "vitest";

import { createTowerDetailModel } from "../../src/app/bannerEligibility.ts";
import { createTowerCatalogueModel } from "../../src/app/towerCatalogue.ts";
import { createContentRepository } from "../../src/content/contentRepository.ts";
import { cloneValidBundle } from "../fixtures/content/index.ts";

describe("localized application state", () => {
  const repository = createContentRepository(cloneValidBundle());

  it("resolves catalogue and detail game values consistently per locale", () => {
    const english = createTowerCatalogueModel(repository, "en", "arc");
    const german = createTowerCatalogueModel(repository, "de", "arkan");
    const germanDetail = createTowerDetailModel(repository, "arc-tower", "de");

    expect(english.items[0]?.name).toBe("Arc Tower");
    expect(german.items[0]?.name).toBe("Arkan-Turm");
    expect(germanDetail.kind).toBe("found");
    if (germanDetail.kind === "found") {
      expect(germanDetail.groups[0]?.items[0]?.name).toBe("Arkan-Fokus");
    }
  });
});
