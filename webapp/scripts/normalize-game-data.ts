import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import type {
  Banner,
  BannerClassification,
  ContentBundle,
  EntityVisual,
  Eligibility,
  LocalizedText,
  ProvenanceRecord,
  ProvenanceSource,
  RequiredLocalizedText,
  StableIdMap,
  StableIdMapping,
  Tower,
  WikiContent,
} from "../src/types/content.ts";

const EXPECTED_APP_ID = "3028310";
const EXPECTED_TOOLS = {
  UnityPy: "1.25.3",
  TypeTreeGeneratorAPI: "0.0.10",
} as const;
const DIRECT_SOURCE = "NordHold_Data/resources.assets";
const RUNTIME_SOURCE = "NordHold_Data/level2";
const STABLE_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;
const PATH_ID = /^-?[0-9]+$/u;

export interface RawExtractionRecord {
  readonly source: string;
  readonly path_id: string | null;
  readonly name: string | null;
  readonly script?: {
    readonly assembly?: string;
    readonly namespace?: string;
    readonly class?: string;
  };
  readonly data: unknown;
}

export interface RawParseError {
  readonly source: string;
  readonly path_id: string | null;
  readonly error_type: string;
  readonly error: string;
}

export interface RawExtraction {
  readonly provenance: {
    readonly steam_app_id: string;
    readonly steam_build_id: string;
    readonly unity_version: string;
    readonly generated_at: string;
    readonly python_version: string;
    readonly tool_versions: Readonly<Record<string, string>>;
  };
  readonly record_count: number;
  readonly parse_error_count: number;
  readonly records: readonly RawExtractionRecord[];
  readonly parse_errors: readonly RawParseError[];
}

export type NormalizationSource = ProvenanceSource;

interface BaseEntityDecision {
  readonly sourceKey: string;
  readonly source: NormalizationSource;
  readonly stableId?: string;
  readonly sortOrder: number;
  readonly name: LocalizedText;
  readonly obsolete?: boolean;
  readonly duplicateOfSourceKey?: string;
}

export type TowerDecision = BaseEntityDecision;

export interface BannerDecision extends BaseEntityDecision {
  readonly classification: BannerClassification;
  readonly towerAffinitySourceKey?: string;
}

export interface EligibilityDecision {
  readonly towerSourceKey: string;
  readonly bannerSourceKey: string;
  /** Runtime manager evidence that activates the category-selection rules. */
  readonly source: NormalizationSource;
  /** Direct banner record containing the exact TowerTypes relationship. */
  readonly relationshipSource: NormalizationSource;
}

export interface NormalizationDecisions {
  readonly schemaVersion: string;
  readonly extractorVersion: string;
  readonly uncertainties: readonly string[];
  readonly towers: readonly TowerDecision[];
  readonly banners: readonly BannerDecision[];
  readonly eligibility: readonly EligibilityDecision[];
}

export interface EditorialRecord {
  readonly effectSummary: RequiredLocalizedText;
  readonly visual: EntityVisual;
}

export type NormalizationEditorial = Readonly<Record<string, EditorialRecord>>;

export interface NormalizationReport {
  readonly duplicateSourceKeys: readonly string[];
  readonly obsoleteSourceKeys: readonly string[];
  readonly sourceRecordCount: number;
  readonly towerCount: number;
  readonly bannerCount: number;
  readonly eligibilityCount: number;
}

export interface NormalizationResult {
  readonly bundle: ContentBundle;
  readonly report: NormalizationReport;
}

export class NormalizationError extends Error {
  public readonly issues: readonly string[];

  public constructor(issues: readonly string[]) {
    super(`Game-data normalization failed:\n- ${issues.join("\n- ")}`);
    this.name = "NormalizationError";
    this.issues = issues;
  }
}

function uniqueSorted(values: readonly string[]): string[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right, "en"));
}

function recordContainsInternalKey(value: unknown, internalKey: string, depth = 0): boolean {
  if (depth > 16) {
    return false;
  }
  if (value === internalKey) {
    return true;
  }
  if (Array.isArray(value)) {
    return value.some((entry) => recordContainsInternalKey(entry, internalKey, depth + 1));
  }
  if (typeof value === "object" && value !== null) {
    return Object.entries(value).some(
      ([key, entry]) =>
        key === internalKey || recordContainsInternalKey(entry, internalKey, depth + 1),
    );
  }
  return false;
}

function verifyRawIdentity(raw: RawExtraction, decisions: NormalizationDecisions): string[] {
  const issues: string[] = [];
  if (raw.provenance.steam_app_id !== EXPECTED_APP_ID) {
    issues.push(
      `Expected Steam app ${EXPECTED_APP_ID}, received '${raw.provenance.steam_app_id}'.`,
    );
  }
  if (!/^[0-9]+$/u.test(raw.provenance.steam_build_id)) {
    issues.push("Steam build ID must be a decimal string.");
  }
  if (!/^[0-9]+\.[0-9]+\.[0-9]+[A-Za-z0-9.-]*$/u.test(raw.provenance.unity_version)) {
    issues.push("Unity version is missing or malformed.");
  }
  if (!/^[0-9]+\.[0-9]+(?:\.[0-9]+)?$/u.test(raw.provenance.python_version)) {
    issues.push("Python version is missing or malformed.");
  }
  for (const [tool, expectedVersion] of Object.entries(EXPECTED_TOOLS)) {
    if (raw.provenance.tool_versions[tool] !== expectedVersion) {
      issues.push(
        `Expected ${tool} ${expectedVersion}, received '${raw.provenance.tool_versions[tool] ?? "missing"}'.`,
      );
    }
  }
  if (raw.record_count !== raw.records.length) {
    issues.push("Extractor record_count does not match the record array length.");
  }
  if (raw.parse_error_count !== raw.parse_errors.length) {
    issues.push("Extractor parse_error_count does not match the parse-error array length.");
  }
  if (raw.parse_errors.length > 0) {
    issues.push(
      ...raw.parse_errors.map(
        (error) =>
          `Parse error ${error.error_type} at ${error.source}:${error.path_id ?? "unknown"}: ${error.error}`,
      ),
    );
  }
  issues.push(...decisions.uncertainties);
  for (const record of raw.records) {
    if (
      record.path_id === null ||
      typeof record.path_id !== "string" ||
      !PATH_ID.test(record.path_id)
    ) {
      issues.push(
        `Record '${record.name ?? "unnamed"}' must preserve its signed 64-bit path ID as decimal text.`,
      );
    }
    if (record.source !== DIRECT_SOURCE && record.source !== RUNTIME_SOURCE) {
      issues.push(`Unexpected or absolute source asset '${record.source}'.`);
    }
  }
  return issues;
}

function verifyEvidenceSource(
  source: NormalizationSource,
  rawRecords: readonly RawExtractionRecord[],
  expectedAsset: typeof DIRECT_SOURCE | typeof RUNTIME_SOURCE,
  issues: string[],
): void {
  if (source.sourceAsset !== expectedAsset) {
    issues.push(`Evidence '${source.internalKey}' must come from '${expectedAsset}'.`);
  }
  if (!PATH_ID.test(source.objectPathId)) {
    issues.push(`Evidence '${source.internalKey}' has a malformed path ID.`);
  }
  const record = rawRecords.find(
    (candidate) =>
      candidate.source === source.sourceAsset && candidate.path_id === source.objectPathId,
  );
  if (
    record === undefined ||
    (record.name !== source.internalKey &&
      record.script?.class !== source.internalKey &&
      !recordContainsInternalKey(record.data, source.internalKey))
  ) {
    issues.push(
      `Evidence '${source.internalKey}' at ${source.sourceAsset}:${source.objectPathId} does not resolve to an extracted record.`,
    );
  }
}

function findMapping(
  mappings: readonly StableIdMapping[],
  sourceKey: string,
): StableIdMapping | undefined {
  return mappings.find(
    (mapping) => mapping.sourceKey === sourceKey || mapping.sourceKeyAliases.includes(sourceKey),
  );
}

function resolveOrCreateMapping(
  sourceKey: string,
  proposedId: string | undefined,
  mappings: StableIdMapping[],
  issues: string[],
): string | undefined {
  const existing = findMapping(mappings, sourceKey);
  if (existing !== undefined) {
    if (proposedId !== undefined && proposedId !== existing.id) {
      issues.push(
        `Source key '${sourceKey}' is already mapped to '${existing.id}', not proposed ID '${proposedId}'.`,
      );
    }
    return existing.id;
  }
  if (proposedId === undefined || !STABLE_ID.test(proposedId)) {
    issues.push(`New source key '${sourceKey}' requires a valid reviewed stable ID.`);
    return undefined;
  }
  if (mappings.some((mapping) => mapping.id === proposedId)) {
    issues.push(`Stable ID '${proposedId}' is already assigned to another source identity.`);
    return undefined;
  }
  mappings.push({ sourceKey, id: proposedId, sourceKeyAliases: [] });
  return proposedId;
}

function attachDuplicateAlias(
  sourceKey: string,
  targetSourceKey: string,
  mappings: StableIdMapping[],
  issues: string[],
): void {
  const target = findMapping(mappings, targetSourceKey);
  if (target === undefined) {
    issues.push(`Duplicate '${sourceKey}' references unknown identity '${targetSourceKey}'.`);
    return;
  }
  if (findMapping(mappings, sourceKey) !== undefined) {
    issues.push(`Duplicate source key '${sourceKey}' is already mapped.`);
    return;
  }
  const index = mappings.indexOf(target);
  mappings[index] = {
    ...target,
    sourceKeyAliases: uniqueSorted([...target.sourceKeyAliases, sourceKey]),
  };
}

function editorialFor(
  id: string,
  editorial: NormalizationEditorial,
  issues: string[],
): EditorialRecord | undefined {
  const record = editorial[id];
  if (record === undefined) {
    issues.push(`Entity '${id}' is missing reviewed summaries or visual metadata.`);
  }
  return record;
}

function activeDecisions<T extends BaseEntityDecision>(decisions: readonly T[]): readonly T[] {
  return decisions.filter(
    (decision) => decision.obsolete !== true && decision.duplicateOfSourceKey === undefined,
  );
}

function canonicalEntityOrder<T extends { readonly id: string; readonly sortOrder: number }>(
  left: T,
  right: T,
): number {
  return left.sortOrder - right.sortOrder || left.id.localeCompare(right.id, "en");
}

function makeProvenance(
  id: string,
  entityType: ProvenanceRecord["entityType"],
  entityId: string,
  evidence: ProvenanceRecord["evidence"],
  sources: readonly ProvenanceSource[],
  localizationLanguages: ProvenanceRecord["localizationLanguages"],
): ProvenanceRecord {
  return {
    id,
    entityType,
    entityId,
    evidence,
    sources,
    localizationLanguages,
    notes: [],
  };
}

function asUtcTimestamp(value: string, issues: string[]): string {
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) {
    issues.push(`Extractor generation time '${value}' is invalid.`);
    return "1970-01-01T00:00:00Z";
  }
  return date.toISOString().replace(/\.000Z$/u, "Z");
}

export function normalizeGameData(
  raw: RawExtraction,
  decisions: NormalizationDecisions,
  editorial: NormalizationEditorial,
  initialIdMap: StableIdMap,
): NormalizationResult {
  const issues = verifyRawIdentity(raw, decisions);
  const towerMappings = structuredClone(initialIdMap.towers) as StableIdMapping[];
  const bannerMappings = structuredClone(initialIdMap.banners) as StableIdMapping[];

  for (const decision of [...decisions.towers, ...decisions.banners]) {
    verifyEvidenceSource(decision.source, raw.records, DIRECT_SOURCE, issues);
  }
  for (const decision of decisions.eligibility) {
    verifyEvidenceSource(decision.source, raw.records, RUNTIME_SOURCE, issues);
    verifyEvidenceSource(decision.relationshipSource, raw.records, DIRECT_SOURCE, issues);
  }

  const towerIds = new Map<string, string>();
  for (const decision of activeDecisions(decisions.towers)) {
    const id = resolveOrCreateMapping(decision.sourceKey, decision.stableId, towerMappings, issues);
    if (id !== undefined) {
      towerIds.set(decision.sourceKey, id);
    }
  }
  const bannerIds = new Map<string, string>();
  for (const decision of activeDecisions(decisions.banners)) {
    const id = resolveOrCreateMapping(
      decision.sourceKey,
      decision.stableId,
      bannerMappings,
      issues,
    );
    if (id !== undefined) {
      bannerIds.set(decision.sourceKey, id);
    }
  }

  for (const decision of decisions.towers) {
    if (decision.duplicateOfSourceKey !== undefined) {
      attachDuplicateAlias(
        decision.sourceKey,
        decision.duplicateOfSourceKey,
        towerMappings,
        issues,
      );
    }
  }
  for (const decision of decisions.banners) {
    if (decision.duplicateOfSourceKey !== undefined) {
      attachDuplicateAlias(
        decision.sourceKey,
        decision.duplicateOfSourceKey,
        bannerMappings,
        issues,
      );
    }
  }

  const towers: Tower[] = [];
  const provenanceRecords: ProvenanceRecord[] = [];
  for (const decision of activeDecisions(decisions.towers)) {
    const id = towerIds.get(decision.sourceKey);
    if (id === undefined) {
      continue;
    }
    const presentation = editorialFor(id, editorial, issues);
    if (presentation === undefined) {
      continue;
    }
    if (presentation.visual.kind !== "image") {
      issues.push(`Tower '${id}' requires an authorized image visual.`);
      continue;
    }
    const provenanceRef = `tower-${id}-source`;
    towers.push({
      id,
      sourceKey: decision.sourceKey,
      sortOrder: decision.sortOrder,
      name: decision.name,
      effectSummary: presentation.effectSummary,
      visual: presentation.visual,
      provenanceRef,
    });
    provenanceRecords.push(
      makeProvenance(
        provenanceRef,
        "tower",
        id,
        "direct-record",
        [decision.source],
        decision.name.de === undefined ? ["en"] : ["en", "de"],
      ),
    );
  }

  const banners: Banner[] = [];
  for (const decision of activeDecisions(decisions.banners)) {
    const id = bannerIds.get(decision.sourceKey);
    if (id === undefined) {
      continue;
    }
    const presentation = editorialFor(id, editorial, issues);
    if (presentation === undefined) {
      continue;
    }
    if (presentation.visual.kind !== "css") {
      issues.push(`Banner '${id}' requires an original CSS visual.`);
      continue;
    }
    const towerAffinityId =
      decision.towerAffinitySourceKey === undefined
        ? undefined
        : towerIds.get(decision.towerAffinitySourceKey);
    if (decision.classification === "tower-specific" && towerAffinityId === undefined) {
      issues.push(`Tower-specific banner '${decision.sourceKey}' requires a valid tower affinity.`);
    }
    if (decision.classification !== "tower-specific" && towerAffinityId !== undefined) {
      issues.push(
        `Only tower-specific banner '${decision.sourceKey}' may declare a tower affinity.`,
      );
    }
    const provenanceRef = `banner-${id}-source`;
    const banner: Banner = {
      id,
      sourceKey: decision.sourceKey,
      sortOrder: decision.sortOrder,
      classification: decision.classification,
      name: decision.name,
      effectSummary: presentation.effectSummary,
      visual: presentation.visual,
      provenanceRef,
      ...(towerAffinityId === undefined ? {} : { towerAffinityId }),
    };
    banners.push(banner);
    provenanceRecords.push(
      makeProvenance(
        provenanceRef,
        "banner",
        id,
        "direct-record",
        [decision.source],
        decision.name.de === undefined ? ["en"] : ["en", "de"],
      ),
    );
  }

  const bannersById = new Map(banners.map((banner) => [banner.id, banner]));
  const eligibilityByPair = new Map<string, Eligibility>();
  for (const decision of decisions.eligibility) {
    const towerId = towerIds.get(decision.towerSourceKey);
    const bannerId = bannerIds.get(decision.bannerSourceKey);
    if (towerId === undefined || bannerId === undefined) {
      issues.push(
        `Runtime eligibility '${decision.towerSourceKey}:${decision.bannerSourceKey}' references an excluded or unknown entity.`,
      );
      continue;
    }
    const banner = bannersById.get(bannerId);
    if (banner?.classification === "tower-specific" && banner.towerAffinityId !== towerId) {
      issues.push(
        `Runtime eligibility assigns tower-specific banner '${bannerId}' outside its affinity.`,
      );
      continue;
    }
    const pair = `${towerId}:${bannerId}`;
    if (eligibilityByPair.has(pair)) {
      issues.push(`Runtime eligibility contains duplicate pair '${pair}'.`);
      continue;
    }
    const provenanceRef = `eligible-${towerId}-${bannerId}`;
    eligibilityByPair.set(pair, { towerId, bannerId, provenanceRef });
    provenanceRecords.push(
      makeProvenance(
        provenanceRef,
        "eligibility",
        pair,
        "runtime-reference",
        [decision.source, decision.relationshipSource],
        [],
      ),
    );
  }

  const eligibility = [...eligibilityByPair.values()].sort((left, right) =>
    `${left.towerId}:${left.bannerId}`.localeCompare(`${right.towerId}:${right.bannerId}`, "en"),
  );
  for (const tower of towers) {
    if (!eligibility.some((entry) => entry.towerId === tower.id)) {
      issues.push(`Active tower '${tower.id}' has no runtime banner eligibility.`);
    }
  }
  for (const banner of banners) {
    if (!eligibility.some((entry) => entry.bannerId === banner.id)) {
      issues.push(`Active banner '${banner.id}' has no runtime tower eligibility.`);
    }
  }

  if (issues.length > 0) {
    throw new NormalizationError(uniqueSorted(issues));
  }

  const content: WikiContent = {
    schemaVersion: decisions.schemaVersion,
    gameBuildId: raw.provenance.steam_build_id,
    towers: towers.sort(canonicalEntityOrder),
    banners: banners.sort(canonicalEntityOrder),
    eligibility,
  };
  const idMap: StableIdMap = {
    schemaVersion: decisions.schemaVersion,
    towers: towerMappings.sort((left, right) => left.id.localeCompare(right.id, "en")),
    banners: bannerMappings.sort((left, right) => left.id.localeCompare(right.id, "en")),
  };
  const bundle: ContentBundle = {
    content,
    provenance: {
      schemaVersion: decisions.schemaVersion,
      datasetId: `nordhold-build-${raw.provenance.steam_build_id}`,
      game: {
        steamAppId: "3028310",
        buildId: raw.provenance.steam_build_id,
        unityVersion: raw.provenance.unity_version,
      },
      extraction: {
        extractor: ".agents/skills/nordhold-game-data/scripts/extract_game_data.py",
        extractorVersion: decisions.extractorVersion,
        pythonVersion: raw.provenance.python_version,
        dependencies: {
          TypeTreeGeneratorAPI: EXPECTED_TOOLS.TypeTreeGeneratorAPI,
          UnityPy: EXPECTED_TOOLS.UnityPy,
        },
        generatedAt: asUtcTimestamp(raw.provenance.generated_at, issues),
        parseErrors: [],
        uncertainties: [],
      },
      records: provenanceRecords.sort((left, right) => left.id.localeCompare(right.id, "en")),
    },
    idMap,
  };
  if (issues.length > 0) {
    throw new NormalizationError(uniqueSorted(issues));
  }
  return {
    bundle,
    report: {
      duplicateSourceKeys: uniqueSorted(
        [...decisions.towers, ...decisions.banners]
          .filter((decision) => decision.duplicateOfSourceKey !== undefined)
          .map((decision) => decision.sourceKey),
      ),
      obsoleteSourceKeys: uniqueSorted(
        [...decisions.towers, ...decisions.banners]
          .filter((decision) => decision.obsolete === true)
          .map((decision) => decision.sourceKey),
      ),
      sourceRecordCount: raw.records.length,
      towerCount: content.towers.length,
      bannerCount: content.banners.length,
      eligibilityCount: content.eligibility.length,
    },
  };
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }
  if (typeof value === "object" && value !== null) {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right, "en"))
        .map(([key, entry]) => [key, canonicalize(entry)]),
    );
  }
  return value;
}

export function serializeNormalizedFacts(bundle: ContentBundle): string {
  return `${JSON.stringify(canonicalize(bundle), undefined, 2)}\n`;
}

function requiredArgument(name: string): string {
  const index = process.argv.indexOf(name);
  const value = process.argv[index + 1];
  if (index < 0 || value === undefined || value.startsWith("--")) {
    throw new Error(`Missing required argument ${name}.`);
  }
  return value;
}

async function readJson<T>(path: string): Promise<T> {
  return JSON.parse(await readFile(resolve(path), "utf8")) as T;
}

async function atomicWrite(path: string, value: string): Promise<void> {
  const temporaryPath = `${path}.${String(process.pid)}.tmp`;
  await writeFile(temporaryPath, value, { encoding: "utf8", flag: "wx" });
  await rename(temporaryPath, path);
}

async function main(): Promise<void> {
  const outputDirectory = resolve(requiredArgument("--output"));
  const [raw, decisions, editorial, idMap] = await Promise.all([
    readJson<RawExtraction>(requiredArgument("--raw")),
    readJson<NormalizationDecisions>(requiredArgument("--decisions")),
    readJson<NormalizationEditorial>(requiredArgument("--editorial")),
    readJson<StableIdMap>(requiredArgument("--id-map")),
  ]);
  const result = normalizeGameData(raw, decisions, editorial, idMap);
  await mkdir(outputDirectory, { recursive: true });
  await Promise.all([
    atomicWrite(
      resolve(outputDirectory, "wiki-content.json"),
      `${JSON.stringify(canonicalize(result.bundle.content), undefined, 2)}\n`,
    ),
    atomicWrite(
      resolve(outputDirectory, "provenance.json"),
      `${JSON.stringify(canonicalize(result.bundle.provenance), undefined, 2)}\n`,
    ),
    atomicWrite(
      resolve(outputDirectory, "id-map.json"),
      `${JSON.stringify(canonicalize(result.bundle.idMap), undefined, 2)}\n`,
    ),
    atomicWrite(
      resolve(outputDirectory, "normalization-report.json"),
      `${JSON.stringify(canonicalize(result.report), undefined, 2)}\n`,
    ),
  ]);
  console.log(
    `Normalized ${String(result.report.towerCount)} towers, ${String(result.report.bannerCount)} banners, and ${String(result.report.eligibilityCount)} eligibility rows.`,
  );
}

const entryPoint = process.argv[1];
if (entryPoint !== undefined && resolve(entryPoint) === fileURLToPath(import.meta.url)) {
  try {
    await main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
