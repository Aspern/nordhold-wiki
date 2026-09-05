import type {
  Banner,
  ContentBundle,
  Eligibility,
  ProvenanceRecord,
  Tower,
} from "../types/content.ts";

const UNSAFE_TEXT = /<[^>]*>|(?:javascript|data):/iu;

export class ContentRepositoryError extends Error {
  public readonly issues: readonly string[];

  public constructor(issues: readonly string[]) {
    super(`Cannot load wiki content:\n- ${issues.join("\n- ")}`);
    this.name = "ContentRepositoryError";
    this.issues = issues;
  }
}

export interface ContentRepository {
  readonly gameBuildId: string;
  readonly towers: readonly Tower[];
  readonly banners: readonly Banner[];
  getTower(id: string): Tower | undefined;
  getBanner(id: string): Banner | undefined;
  getEligibilityForTower(towerId: string): readonly Eligibility[];
}

function compareEntity(
  left: Pick<Tower | Banner, "sortOrder" | "id">,
  right: Pick<Tower | Banner, "sortOrder" | "id">,
): number {
  return left.sortOrder - right.sortOrder || left.id.localeCompare(right.id, "en");
}

function compareEligibility(left: Eligibility, right: Eligibility): number {
  return `${left.towerId}:${left.bannerId}`.localeCompare(
    `${right.towerId}:${right.bannerId}`,
    "en",
  );
}

function deepFreeze<T>(value: T): T {
  if (typeof value !== "object" || value === null || Object.isFrozen(value)) {
    return value;
  }
  for (const child of Object.values(value)) {
    deepFreeze(child);
  }
  return Object.freeze(value);
}

function duplicateIds(records: readonly { readonly id: string }[]): readonly string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const record of records) {
    if (seen.has(record.id)) {
      duplicates.add(record.id);
    }
    seen.add(record.id);
  }
  return [...duplicates].sort((left, right) => left.localeCompare(right, "en"));
}

function validateVisibleText(
  label: string,
  values: readonly (string | undefined)[],
  issues: string[],
): void {
  for (const value of values) {
    if (value !== undefined && UNSAFE_TEXT.test(value)) {
      issues.push(`${label} contains unsafe text.`);
    }
  }
}

function validateEntityText(entity: Tower | Banner, issues: string[]): void {
  validateVisibleText(
    `Entity '${entity.id}'`,
    [
      entity.name.en,
      entity.name.de,
      entity.effectSummary.en,
      entity.effectSummary.de,
      entity.visual.alt.en,
      entity.visual.alt.de,
    ],
    issues,
  );
}

function validateProvenanceReference(
  entityType: ProvenanceRecord["entityType"],
  entityId: string,
  provenanceRef: string,
  provenanceById: ReadonlyMap<string, ProvenanceRecord>,
  issues: string[],
): void {
  const record = provenanceById.get(provenanceRef);
  if (record === undefined) {
    issues.push(`${entityType} '${entityId}' references unknown provenance '${provenanceRef}'.`);
    return;
  }
  if (record.entityType !== entityType || record.entityId !== entityId) {
    issues.push(`Provenance '${provenanceRef}' does not describe ${entityType} '${entityId}'.`);
  }
}

function validateBundle(bundle: ContentBundle): readonly string[] {
  const issues: string[] = [];
  const duplicateTowerIds = duplicateIds(bundle.content.towers);
  const duplicateBannerIds = duplicateIds(bundle.content.banners);
  issues.push(...duplicateTowerIds.map((id) => `Content contains duplicate tower '${id}'.`));
  issues.push(...duplicateBannerIds.map((id) => `Content contains duplicate banner '${id}'.`));

  const towerById = new Map(bundle.content.towers.map((tower) => [tower.id, tower]));
  const bannerById = new Map(bundle.content.banners.map((banner) => [banner.id, banner]));
  const provenanceById = new Map(bundle.provenance.records.map((record) => [record.id, record]));
  const eligibilityPairs = new Set<string>();

  for (const tower of bundle.content.towers) {
    validateEntityText(tower, issues);
    validateProvenanceReference("tower", tower.id, tower.provenanceRef, provenanceById, issues);
  }
  for (const banner of bundle.content.banners) {
    validateEntityText(banner, issues);
    validateProvenanceReference("banner", banner.id, banner.provenanceRef, provenanceById, issues);
    if (
      banner.classification === "tower-specific" &&
      (banner.towerAffinityId === undefined || !towerById.has(banner.towerAffinityId))
    ) {
      issues.push(`Tower-specific banner '${banner.id}' has no valid tower affinity.`);
    }
    if (banner.classification !== "tower-specific" && banner.towerAffinityId !== undefined) {
      issues.push(`Non-tower-specific banner '${banner.id}' declares a tower affinity.`);
    }
  }
  for (const eligibility of bundle.content.eligibility) {
    if (!towerById.has(eligibility.towerId)) {
      issues.push(`Eligibility references unknown tower '${eligibility.towerId}'.`);
    }
    if (!bannerById.has(eligibility.bannerId)) {
      issues.push(`Eligibility references unknown banner '${eligibility.bannerId}'.`);
    }
    const pair = `${eligibility.towerId}:${eligibility.bannerId}`;
    if (eligibilityPairs.has(pair)) {
      issues.push(`Content contains duplicate eligibility '${pair}'.`);
    }
    eligibilityPairs.add(pair);
    validateProvenanceReference(
      "eligibility",
      pair,
      eligibility.provenanceRef,
      provenanceById,
      issues,
    );
  }

  if (
    bundle.content.schemaVersion !== bundle.provenance.schemaVersion ||
    bundle.content.schemaVersion !== bundle.idMap.schemaVersion
  ) {
    issues.push("Content, provenance, and stable-ID schema versions differ.");
  }
  if (bundle.content.gameBuildId !== bundle.provenance.game.buildId) {
    issues.push("Content and provenance game build IDs differ.");
  }
  if (bundle.provenance.extraction.parseErrors.length > 0) {
    issues.push("Provenance contains extraction parse errors.");
  }
  if (bundle.provenance.extraction.uncertainties.length > 0) {
    issues.push("Provenance contains unresolved extraction uncertainties.");
  }
  return issues;
}

export function createContentRepository(input: ContentBundle): ContentRepository {
  const bundle = structuredClone(input);
  const issues = validateBundle(bundle);
  if (issues.length > 0) {
    throw new ContentRepositoryError(issues);
  }

  const towers = deepFreeze([...bundle.content.towers].sort(compareEntity));
  const banners = deepFreeze([...bundle.content.banners].sort(compareEntity));
  const eligibility = deepFreeze([...bundle.content.eligibility].sort(compareEligibility));
  const towerById = new Map(towers.map((tower) => [tower.id, tower]));
  const bannerById = new Map(banners.map((banner) => [banner.id, banner]));
  const eligibilityByTower = new Map<string, readonly Eligibility[]>();
  for (const tower of towers) {
    eligibilityByTower.set(
      tower.id,
      deepFreeze(eligibility.filter((entry) => entry.towerId === tower.id)),
    );
  }

  return Object.freeze({
    gameBuildId: bundle.content.gameBuildId,
    towers,
    banners,
    getTower: (id: string) => towerById.get(id),
    getBanner: (id: string) => bannerById.get(id),
    getEligibilityForTower: (towerId: string) => eligibilityByTower.get(towerId) ?? [],
  });
}
