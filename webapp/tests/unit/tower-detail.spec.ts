import { describe, expect, it } from "vitest";

import { createTowerDetailModel, parseTowerId } from "../../src/app/bannerEligibility.ts";
import { createContentRepository } from "../../src/content/contentRepository.ts";
import { cloneValidBundle } from "../fixtures/content/index.ts";

describe("tower detail read model", () => {
  const repository = createContentRepository(cloneValidBundle());

  it("parses stable identifiers and safely rejects malformed route values", () => {
    expect(parseTowerId("arc-tower")).toBe("arc-tower");
    expect(parseTowerId("Arc Tower")).toBeUndefined();
    expect(parseTowerId(["arc-tower"])).toBeUndefined();
    expect(parseTowerId("../arc-tower")).toBeUndefined();
  });

  it("returns localized detail or the same safe not-found state", () => {
    expect(createTowerDetailModel(repository, "arc-tower", "de")).toMatchObject({
      kind: "found",
      tower: { id: "arc-tower", name: "Arkan-Turm" },
    });
    expect(createTowerDetailModel(repository, "unknown-tower", "en")).toEqual({
      kind: "not-found",
    });
    expect(createTowerDetailModel(repository, "bad/id", "en")).toEqual({ kind: "not-found" });
  });
});
