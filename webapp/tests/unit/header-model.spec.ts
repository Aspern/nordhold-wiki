import { describe, expect, it } from "vitest";

import { createHeaderModel } from "../../src/app/headerModel.ts";
import type { ReleaseMetadata } from "../../src/types/release.ts";

const metadata: ReleaseMetadata = {
  version: "1.2.3",
  buildDate: "2026-09-05",
  commitSha: "1234567890abcdef1234567890abcdef12345678",
};

describe("header read model", () => {
  it("combines localized labels with immutable release identity", () => {
    const model = createHeaderModel(metadata, "de", {
      title: "Nordhold Wiki",
      attribution: "powered by Aspern Tallow",
      version: "Version",
      published: "Veröffentlicht",
    });

    expect(model).toMatchObject({
      title: "Nordhold Wiki",
      attribution: "powered by Aspern Tallow",
      version: "Version 1.2.3",
      raw: metadata,
    });
    expect(model.published).toContain("2026");
  });

  it("uses identical release metadata for catalogue and detail header states", () => {
    const labels = {
      title: "Nordhold Wiki",
      attribution: "powered by Aspern Tallow",
      version: "Version",
      published: "Published",
    };
    const catalogue = createHeaderModel(metadata, "en", labels);
    const detail = createHeaderModel(metadata, "en", labels);

    expect(catalogue.raw).toBe(detail.raw);
    expect(catalogue.version).toBe(detail.version);
    expect(catalogue.published).toBe(detail.published);
  });
});
