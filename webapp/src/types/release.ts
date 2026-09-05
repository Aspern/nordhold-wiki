export interface ReleaseMetadata {
  readonly version: string;
  readonly buildDate: string;
  readonly commitSha: string;
}

const SEMANTIC_VERSION =
  /^(?:0|[1-9][0-9]*)\.(?:0|[1-9][0-9]*)\.(?:0|[1-9][0-9]*)(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/u;
const BUILD_DATE = /^(\d{4})-(\d{2})-(\d{2})$/u;
const COMMIT_SHA = /^[a-f0-9]{40}$/u;

export class ReleaseMetadataError extends Error {
  public readonly issues: readonly string[];

  public constructor(issues: readonly string[]) {
    super(`Invalid release metadata:\n- ${issues.join("\n- ")}`);
    this.name = "ReleaseMetadataError";
    this.issues = issues;
  }
}

function isExactUtcDate(value: string): boolean {
  const match = BUILD_DATE.exec(value);
  if (match === null) {
    return false;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
}

export function validateReleaseMetadata(
  value: unknown,
  expectedPackageVersion?: string,
): ReleaseMetadata {
  const issues: string[] = [];
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new ReleaseMetadataError(["Release metadata must be an object."]);
  }

  const candidate = value as Readonly<Record<string, unknown>>;
  const keys = Object.keys(candidate).sort();
  if (keys.join(",") !== "buildDate,commitSha,version") {
    issues.push("Release metadata must contain only version, buildDate, and commitSha.");
  }
  if (typeof candidate.version !== "string" || !SEMANTIC_VERSION.test(candidate.version)) {
    issues.push("Version must be a semantic version.");
  } else if (expectedPackageVersion !== undefined && candidate.version !== expectedPackageVersion) {
    issues.push("Version does not match package.json.");
  }
  if (typeof candidate.buildDate !== "string" || !isExactUtcDate(candidate.buildDate)) {
    issues.push("Build date must be a real UTC date in YYYY-MM-DD form.");
  }
  if (typeof candidate.commitSha !== "string" || !COMMIT_SHA.test(candidate.commitSha)) {
    issues.push("Commit SHA must be a full lowercase hexadecimal SHA.");
  }
  if (issues.length > 0) {
    throw new ReleaseMetadataError(issues);
  }

  return Object.freeze({
    version: candidate.version as string,
    buildDate: candidate.buildDate as string,
    commitSha: candidate.commitSha as string,
  });
}

export function extractReleaseMetadata(
  value: unknown,
  expectedPackageVersion?: string,
): ReleaseMetadata {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return validateReleaseMetadata(value, expectedPackageVersion);
  }

  const candidate = value as Readonly<Record<string, unknown>>;
  return validateReleaseMetadata(
    {
      version: candidate.version,
      buildDate: candidate.buildDate,
      commitSha: candidate.commitSha,
    },
    expectedPackageVersion,
  );
}
