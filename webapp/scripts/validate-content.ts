import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { dirname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

import Ajv2020, { type ErrorObject, type ValidateFunction } from "ajv/dist/2020.js";

import type {
  Banner,
  ContentBundle,
  EntityVisual,
  ProvenanceEntityType,
  StableIdMapping,
  Tower,
} from "../src/types/content.ts";

export interface VisualInspection {
  readonly width: number;
  readonly height: number;
  readonly sha256: string;
}

export interface ValidationIssue {
  readonly code: string;
  readonly path: string;
  readonly message: string;
}

export interface ContentValidationResult {
  readonly valid: boolean;
  readonly errors: readonly ValidationIssue[];
  readonly warnings: readonly ValidationIssue[];
}

export interface ContentValidationOptions {
  readonly inspectVisual?: (
    path: string,
  ) => Promise<VisualInspection | undefined> | VisualInspection | undefined;
}

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const applicationRoot = resolve(scriptDirectory, "..");
const schemaDirectory = resolve(applicationRoot, "src/content/schemas");

const ajv = new Ajv2020({ allErrors: true, strict: true, strictRequired: false });

async function loadValidator(schemaName: string): Promise<ValidateFunction> {
  const schema = JSON.parse(await readFile(resolve(schemaDirectory, schemaName), "utf8")) as object;
  return ajv.compile(schema);
}

const validatorPromise = Promise.all([
  loadValidator("wiki-content.schema.json"),
  loadValidator("provenance.schema.json"),
  loadValidator("stable-id-map.schema.json"),
]);

function schemaIssues(prefix: string, errors: ErrorObject[] | null | undefined): ValidationIssue[] {
  return (errors ?? []).map((error) => ({
    code: "schema.invalid",
    path: `${prefix}${error.instancePath || "/"}`,
    message: error.message ?? "The value does not satisfy its JSON Schema contract.",
  }));
}

function duplicates(values: readonly string[]): Set<string> {
  const seen = new Set<string>();
  const repeated = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) {
      repeated.add(value);
    }
    seen.add(value);
  }
  return repeated;
}

function compareEntityOrder(
  left: Pick<Tower | Banner, "sortOrder" | "id">,
  right: Pick<Tower | Banner, "sortOrder" | "id">,
): number {
  return left.sortOrder - right.sortOrder || left.id.localeCompare(right.id, "en");
}

function isSorted<T>(values: readonly T[], compare: (left: T, right: T) => number): boolean {
  return values.every((value, index) => {
    const previous = values[index - 1];
    return previous === undefined || compare(previous, value) <= 0;
  });
}

function addDuplicateIssues(
  values: readonly string[],
  path: string,
  errors: ValidationIssue[],
): void {
  for (const value of duplicates(values)) {
    errors.push({
      code: "id.duplicate",
      path,
      message: `Duplicate identifier '${value}'.`,
    });
  }
}

function validateCanonicalOrder(bundle: ContentBundle, errors: ValidationIssue[]): void {
  if (!isSorted(bundle.content.towers, compareEntityOrder)) {
    errors.push({
      code: "order.noncanonical",
      path: "content/towers",
      message: "Towers must be ordered by sortOrder and then stable ID.",
    });
  }
  if (!isSorted(bundle.content.banners, compareEntityOrder)) {
    errors.push({
      code: "order.noncanonical",
      path: "content/banners",
      message: "Banners must be ordered by sortOrder and then stable ID.",
    });
  }
  if (
    !isSorted(bundle.content.eligibility, (left, right) =>
      `${left.towerId}:${left.bannerId}`.localeCompare(`${right.towerId}:${right.bannerId}`, "en"),
    )
  ) {
    errors.push({
      code: "order.noncanonical",
      path: "content/eligibility",
      message: "Eligibility rows must be ordered by tower ID and banner ID.",
    });
  }
  if (
    !isSorted(bundle.provenance.records, (left, right) => left.id.localeCompare(right.id, "en"))
  ) {
    errors.push({
      code: "order.noncanonical",
      path: "provenance/records",
      message: "Provenance records must be ordered by stable provenance ID.",
    });
  }
}

function validateIdentifiersAndReferences(bundle: ContentBundle, errors: ValidationIssue[]): void {
  const towerIds = new Set(bundle.content.towers.map((tower) => tower.id));
  const bannerIds = new Set(bundle.content.banners.map((banner) => banner.id));
  addDuplicateIssues(
    [
      ...bundle.content.towers.map((tower) => tower.id),
      ...bundle.content.banners.map((banner) => banner.id),
    ],
    "content",
    errors,
  );
  addDuplicateIssues(
    bundle.content.towers.map((tower) => tower.sourceKey),
    "content/towers",
    errors,
  );
  addDuplicateIssues(
    bundle.content.banners.map((banner) => banner.sourceKey),
    "content/banners",
    errors,
  );
  addDuplicateIssues(
    bundle.content.eligibility.map((entry) => `${entry.towerId}:${entry.bannerId}`),
    "content/eligibility",
    errors,
  );

  for (const [index, entry] of bundle.content.eligibility.entries()) {
    if (!towerIds.has(entry.towerId) || !bannerIds.has(entry.bannerId)) {
      errors.push({
        code: "reference.unresolved",
        path: `content/eligibility/${String(index)}`,
        message: `Eligibility references unknown tower '${entry.towerId}' or banner '${entry.bannerId}'.`,
      });
      continue;
    }
    const banner = bundle.content.banners.find((candidate) => candidate.id === entry.bannerId);
    if (banner === undefined) {
      continue;
    }
    if (banner.classification === "tower-specific" && banner.towerAffinityId !== entry.towerId) {
      errors.push({
        code: "eligibility.affinity",
        path: `content/eligibility/${String(index)}`,
        message: `Tower-specific banner '${banner.id}' is not eligible for its declared affinity.`,
      });
    }
  }

  for (const [index, banner] of bundle.content.banners.entries()) {
    if (banner.towerAffinityId !== undefined && !towerIds.has(banner.towerAffinityId)) {
      errors.push({
        code: "reference.unresolved",
        path: `content/banners/${String(index)}/towerAffinityId`,
        message: `Banner '${banner.id}' references unknown tower '${banner.towerAffinityId}'.`,
      });
    }
    if (!bundle.content.eligibility.some((entry) => entry.bannerId === banner.id)) {
      errors.push({
        code: "eligibility.missing",
        path: `content/banners/${String(index)}`,
        message: `Active banner '${banner.id}' is not eligible for any tower.`,
      });
    }
  }
}

function expectedProvenance(
  bundle: ContentBundle,
): Map<string, { readonly entityType: ProvenanceEntityType; readonly entityId: string }> {
  const entries: (readonly [
    string,
    { readonly entityType: ProvenanceEntityType; readonly entityId: string },
  ])[] = [
    ...bundle.content.towers.map(
      (tower) => [tower.provenanceRef, { entityType: "tower", entityId: tower.id }] as const,
    ),
    ...bundle.content.banners.map(
      (banner) => [banner.provenanceRef, { entityType: "banner", entityId: banner.id }] as const,
    ),
    ...bundle.content.eligibility.map(
      (entry) =>
        [
          entry.provenanceRef,
          { entityType: "eligibility", entityId: `${entry.towerId}:${entry.bannerId}` },
        ] as const,
    ),
  ];
  return new Map(entries);
}

function validateProvenance(bundle: ContentBundle, errors: ValidationIssue[]): void {
  if (bundle.content.gameBuildId !== bundle.provenance.game.buildId) {
    errors.push({
      code: "provenance.build",
      path: "provenance/game/buildId",
      message: "Content and provenance must identify the same game build.",
    });
  }
  if (
    bundle.content.schemaVersion !== bundle.provenance.schemaVersion ||
    bundle.content.schemaVersion !== bundle.idMap.schemaVersion
  ) {
    errors.push({
      code: "schema.version",
      path: "schemaVersion",
      message: "Content, provenance, and stable-ID map schema versions must match.",
    });
  }
  if (
    bundle.provenance.extraction.parseErrors.length > 0 ||
    bundle.provenance.extraction.uncertainties.length > 0
  ) {
    errors.push({
      code: "provenance.unresolved",
      path: "provenance/extraction",
      message: "Publishable provenance cannot contain parse errors or unresolved uncertainties.",
    });
  }

  addDuplicateIssues(
    bundle.provenance.records.map((record) => record.id),
    "provenance/records",
    errors,
  );
  const records = new Map(bundle.provenance.records.map((record) => [record.id, record]));
  for (const [reference, expected] of expectedProvenance(bundle)) {
    const record = records.get(reference);
    if (record === undefined) {
      errors.push({
        code: "provenance.missing",
        path: "provenance/records",
        message: `Missing provenance record '${reference}'.`,
      });
      continue;
    }
    if (record.entityType !== expected.entityType || record.entityId !== expected.entityId) {
      errors.push({
        code: "provenance.mismatch",
        path: `provenance/records/${reference}`,
        message: `Provenance '${reference}' does not identify the referenced ${expected.entityType}.`,
      });
    }
  }
}

function allMappingKeys(mapping: StableIdMapping): string[] {
  return [mapping.sourceKey, ...mapping.sourceKeyAliases];
}

function validateStableIdMap(bundle: ContentBundle, errors: ValidationIssue[]): void {
  const validateMappings = (
    mappings: readonly StableIdMapping[],
    entities: readonly (Tower | Banner)[],
    path: string,
  ): void => {
    addDuplicateIssues(
      mappings.map((mapping) => mapping.id),
      path,
      errors,
    );
    addDuplicateIssues(mappings.flatMap(allMappingKeys), path, errors);
    const byId = new Map(mappings.map((mapping) => [mapping.id, mapping]));
    for (const entity of entities) {
      const mapping = byId.get(entity.id);
      if (mapping === undefined || !allMappingKeys(mapping).includes(entity.sourceKey)) {
        errors.push({
          code: "id-map.missing",
          path,
          message: `Stable-ID map does not resolve '${entity.sourceKey}' to '${entity.id}'.`,
        });
      }
    }
  };

  validateMappings(bundle.idMap.towers, bundle.content.towers, "idMap/towers");
  validateMappings(bundle.idMap.banners, bundle.content.banners, "idMap/banners");
}

function containsMarkup(value: string): boolean {
  return /<\/?[a-z][^>]*>/iu.test(value) || /javascript\s*:/iu.test(value);
}

function validateLocalizedText(
  bundle: ContentBundle,
  errors: ValidationIssue[],
  warnings: ValidationIssue[],
): void {
  for (const [kind, entities] of [
    ["towers", bundle.content.towers],
    ["banners", bundle.content.banners],
  ] as const) {
    for (const [index, entity] of entities.entries()) {
      if (entity.name.de === undefined) {
        warnings.push({
          code: "localization.fallback",
          path: `content/${kind}/${String(index)}/name/de`,
          message: `German name for '${entity.id}' is unavailable; English fallback will be used.`,
        });
      }
      if (entity.visual.alt.de === undefined) {
        warnings.push({
          code: "localization.fallback",
          path: `content/${kind}/${String(index)}/visual/alt/de`,
          message: `German alternative text for '${entity.id}' is unavailable; English fallback will be used.`,
        });
      }
      const textValues = [
        entity.name.en,
        entity.name.de,
        entity.effectSummary.en,
        entity.effectSummary.de,
        entity.visual.alt.en,
        entity.visual.alt.de,
      ].filter((value): value is string => value !== undefined);
      if (textValues.some(containsMarkup)) {
        errors.push({
          code: "text.markup",
          path: `content/${kind}/${String(index)}`,
          message: `Entity '${entity.id}' contains markup or a script-like URI in a text-only field.`,
        });
      }
    }
  }
}

function visualEntries(bundle: ContentBundle): readonly EntityVisual[] {
  return [...bundle.content.towers, ...bundle.content.banners].map((entity) => entity.visual);
}

async function validateVisuals(
  bundle: ContentBundle,
  errors: ValidationIssue[],
  inspectVisual: ContentValidationOptions["inspectVisual"],
): Promise<void> {
  const visuals = visualEntries(bundle);
  const imageVisuals = visuals.filter(
    (visual): visual is Extract<EntityVisual, { readonly kind: "image" }> =>
      visual.kind === "image",
  );
  const cssVisuals = visuals.filter(
    (visual): visual is Extract<EntityVisual, { readonly kind: "css" }> => visual.kind === "css",
  );

  for (const value of duplicates(visuals.map((visual) => visual.assetId))) {
    errors.push({
      code: "visual.duplicate",
      path: "content/visual/assetId",
      message: `Visual assetId '${value}' is reused by multiple entities.`,
    });
  }
  for (const field of ["path", "sha256"] as const) {
    for (const value of duplicates(imageVisuals.map((visual) => visual[field]))) {
      errors.push({
        code: "visual.duplicate",
        path: `content/visual/${field}`,
        message: `Image visual ${field} '${value}' is reused by multiple towers.`,
      });
    }
  }
  for (const value of duplicates(cssVisuals.map((visual) => String(visual.seed)))) {
    errors.push({
      code: "visual.duplicate",
      path: "content/visual/seed",
      message: `CSS visual seed '${value}' is reused by multiple banners.`,
    });
  }

  for (const visual of visuals) {
    const visualIdentity =
      visual.kind === "image"
        ? `${visual.assetId} ${visual.path}`
        : `${visual.assetId} ${visual.motif}`;
    if (/(?:placeholder|dummy|generic|todo|sample)/iu.test(visualIdentity)) {
      errors.push({
        code: "visual.placeholder",
        path: visual.assetId,
        message: "Placeholder or generic visuals cannot be published.",
      });
    }
  }

  for (const visual of imageVisuals) {
    if (inspectVisual === undefined) {
      errors.push({
        code: "visual.unchecked",
        path: visual.path,
        message: "No visual inspector was supplied.",
      });
      continue;
    }
    const inspection = await inspectVisual(visual.path);
    if (inspection === undefined) {
      errors.push({
        code: "visual.missing",
        path: visual.path,
        message: "Referenced visual does not exist or cannot be inspected.",
      });
      continue;
    }
    if (
      inspection.width !== visual.width ||
      inspection.height !== visual.height ||
      inspection.sha256.toLowerCase() !== visual.sha256.toLowerCase()
    ) {
      errors.push({
        code: "visual.metadata",
        path: visual.path,
        message: "Visual dimensions or SHA-256 digest do not match the checked-in metadata.",
      });
    }
  }
}

export async function validateContentBundle(
  input: unknown,
  options: ContentValidationOptions = {},
): Promise<ContentValidationResult> {
  const [validateContent, validateProvenanceSchema, validateIdMap] = await validatorPromise;
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];

  if (typeof input !== "object" || input === null) {
    errors.push({
      code: "schema.invalid",
      path: "/",
      message: "Content bundle must be an object.",
    });
    return { valid: false, errors, warnings };
  }
  const candidate = input as Partial<Record<keyof ContentBundle, unknown>>;
  if (!validateContent(candidate.content)) {
    errors.push(...schemaIssues("content", validateContent.errors));
  }
  if (!validateProvenanceSchema(candidate.provenance)) {
    errors.push(...schemaIssues("provenance", validateProvenanceSchema.errors));
  }
  if (!validateIdMap(candidate.idMap)) {
    errors.push(...schemaIssues("idMap", validateIdMap.errors));
  }
  if (errors.length > 0) {
    return { valid: false, errors, warnings };
  }

  const bundle = candidate as unknown as ContentBundle;
  validateCanonicalOrder(bundle, errors);
  validateIdentifiersAndReferences(bundle, errors);
  validateProvenance(bundle, errors);
  validateStableIdMap(bundle, errors);
  validateLocalizedText(bundle, errors, warnings);
  await validateVisuals(bundle, errors, options.inspectVisual);

  return { valid: errors.length === 0, errors, warnings };
}

function imageDimensions(bytes: Buffer): { readonly width: number; readonly height: number } {
  const pngSignature = "89504e470d0a1a0a";
  if (bytes.length >= 24 && bytes.subarray(0, 8).toString("hex") === pngSignature) {
    return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
  }

  if (
    bytes.length >= 30 &&
    bytes.subarray(0, 4).toString("ascii") === "RIFF" &&
    bytes.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    const chunk = bytes.subarray(12, 16).toString("ascii");
    if (chunk === "VP8X") {
      return {
        width: 1 + bytes.readUIntLE(24, 3),
        height: 1 + bytes.readUIntLE(27, 3),
      };
    }
    if (chunk === "VP8L" && bytes[20] === 0x2f) {
      const packed = bytes.readUInt32LE(21);
      return { width: 1 + (packed & 0x3fff), height: 1 + ((packed >>> 14) & 0x3fff) };
    }
    if (chunk === "VP8 " && bytes.subarray(23, 26).toString("hex") === "9d012a") {
      return {
        width: bytes.readUInt16LE(26) & 0x3fff,
        height: bytes.readUInt16LE(28) & 0x3fff,
      };
    }
  }

  throw new Error("Unsupported or malformed PNG/WebP image.");
}

async function inspectRepositoryVisual(path: string): Promise<VisualInspection | undefined> {
  const absolutePath = resolve(applicationRoot, path);
  const allowedRoot = resolve(applicationRoot, "src/assets/entities");
  if (absolutePath !== allowedRoot && !absolutePath.startsWith(`${allowedRoot}${sep}`)) {
    return undefined;
  }
  try {
    const bytes = await readFile(absolutePath);
    const dimensions = imageDimensions(bytes);
    return {
      ...dimensions,
      sha256: createHash("sha256").update(bytes).digest("hex"),
    };
  } catch {
    return undefined;
  }
}

async function loadJson(path: string): Promise<unknown> {
  return JSON.parse(await readFile(path, "utf8")) as unknown;
}

async function main(): Promise<void> {
  const contentDirectory = resolve(applicationRoot, "src/content");
  const [content, provenance, idMap] = await Promise.all([
    loadJson(resolve(contentDirectory, "wiki-content.json")),
    loadJson(resolve(contentDirectory, "provenance.json")),
    loadJson(resolve(contentDirectory, "id-map.json")),
  ]);
  const result = await validateContentBundle(
    { content, provenance, idMap },
    { inspectVisual: inspectRepositoryVisual },
  );
  for (const warning of result.warnings) {
    console.warn(`WARNING ${warning.code} ${warning.path}: ${warning.message}`);
  }
  for (const error of result.errors) {
    console.error(`ERROR ${error.code} ${error.path}: ${error.message}`);
  }
  if (!result.valid) {
    process.exitCode = 1;
    return;
  }
  console.log("Wiki content, provenance, stable IDs, and visuals are valid.");
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
