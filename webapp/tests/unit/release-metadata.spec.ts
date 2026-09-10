import { describe, expect, it, vi } from "vitest";

import packageManifest from "../../package.json";
import { formatBuildDate } from "../../src/app/headerModel.ts";
import { releaseMetadata } from "../../src/generated/release.ts";
import {
  extractReleaseMetadata,
  ReleaseMetadataError,
  validateReleaseMetadata,
} from "../../src/types/release.ts";

describe("release metadata", () => {
  it("requires the package version, an exact UTC date, and a full lowercase SHA", () => {
    expect(validateReleaseMetadata(releaseMetadata, packageManifest.version)).toEqual(
      releaseMetadata,
    );
    expect(releaseMetadata.version).toBe(packageManifest.version);
    expect(packageManifest.version).toBe("1.0.0");
    expect(() =>
      validateReleaseMetadata(
        { version: "0.2.0", buildDate: "2026-02-30", commitSha: "ABC" },
        packageManifest.version,
      ),
    ).toThrow(ReleaseMetadataError);
  });

  it("rejects missing and additional release inputs", () => {
    expect(() => validateReleaseMetadata({ version: "0.1.0" })).toThrow(
      "must contain only version, buildDate, and commitSha",
    );
    expect(() => validateReleaseMetadata({ ...releaseMetadata, generatedAt: "runtime" })).toThrow(
      ReleaseMetadataError,
    );
  });

  it("extracts strict release metadata from a larger bundle manifest", () => {
    expect(
      extractReleaseMetadata({
        ...releaseMetadata,
        schemaVersion: "1.0.0",
        validTowerRoute: "/towers/arc-tower",
        files: [],
      }),
    ).toEqual(releaseMetadata);
  });

  it("formats the immutable record without consulting the client clock", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2040-01-01T23:59:59Z"));
    const first = formatBuildDate("2026-09-05", "en");
    vi.setSystemTime(new Date("1999-01-01T00:00:00Z"));
    const second = formatBuildDate("2026-09-05", "en");

    expect(second).toBe(first);
    vi.useRealTimers();
  });
});
