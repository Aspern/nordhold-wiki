import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import type {
  BannerClassification,
  LocalizedText,
  ProvenanceSource,
} from "../src/types/content.ts";

type JsonObject = Readonly<Record<string, unknown>>;

interface ExtractionRecord {
  readonly source: string;
  readonly path_id: string | null;
  readonly name: string | null;
  readonly script?: {
    readonly class?: string;
  };
  readonly data: unknown;
}

interface RawExtraction {
  readonly provenance: {
    readonly steam_build_id: string;
  };
  readonly records: readonly ExtractionRecord[];
}

export interface InventoryTower {
  readonly id: string;
  readonly sourceKey: string;
  readonly towerType: number;
  readonly name: LocalizedText;
  readonly source: ProvenanceSource;
}

export interface InventoryBanner {
  readonly id: string;
  readonly sourceKey: string;
  readonly name: LocalizedText;
  readonly classification: BannerClassification;
  readonly eligibleTowerIds: readonly string[];
  readonly source: ProvenanceSource;
}

export interface ContentInventory {
  readonly buildId: string;
  readonly towers: readonly InventoryTower[];
  readonly banners: readonly InventoryBanner[];
  readonly exclusions: readonly string[];
}

const DIRECT_SOURCE = "NordHold_Data/resources.assets";
const RUNTIME_SOURCE = "NordHold_Data/level2";
const TOWER_DEFINITIONS = [
  { type: 0, className: "ArcTower", id: "arc-tower", localizationKey: "ArcTower" },
  { type: 1, className: "ArrowTower", id: "arrow-tower", localizationKey: "ArrowTower" },
  { type: 2, className: "FrostTower", id: "frost-tower", localizationKey: "FrostTower" },
  {
    type: 3,
    className: "VolcanoMortarTower",
    id: "volcano-mortar",
    localizationKey: "VolcanoTower",
  },
  { type: 4, className: "ShadowTower", id: "shadow-tower", localizationKey: "ShadowTower" },
  {
    type: 5,
    className: "ObliskTower",
    id: "runestone-tower",
    localizationKey: "RunestoneTower",
  },
  {
    type: 6,
    className: "TornadoTower",
    id: "tornado-tower",
    localizationKey: "TornadoTower",
  },
  { type: 7, className: "RavenTower", id: "raven-tower", localizationKey: "RavenTower" },
  {
    type: 8,
    className: "ChaosReaperTower",
    id: "chaos-reaper",
    localizationKey: "ChaosRepearTower",
  },
] as const;

function asObject(value: unknown, context: string): JsonObject {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`${context} must be an object.`);
  }
  return value as JsonObject;
}

function asString(value: unknown, context: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${context} must be a non-empty string.`);
  }
  return value;
}

function asNumberArray(value: unknown, context: string): readonly number[] {
  if (!Array.isArray(value) || value.some((entry) => !Number.isInteger(entry))) {
    throw new Error(`${context} must be an integer array.`);
  }
  return value as readonly number[];
}

function stripGameMarkup(value: string): string {
  const repaired = /(?:Ã|Â|â)/u.test(value) ? Buffer.from(value, "latin1").toString("utf8") : value;
  if (repaired.includes("�")) {
    throw new Error("A localized value could not be decoded without replacement characters.");
  }
  return repaired
    .replace(/<[^>]+>/gu, "")
    .replace(/\s+/gu, " ")
    .trim();
}

function slugify(value: string): string {
  const slug = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/gu, "")
    .toLocaleLowerCase("en")
    .replace(/[^a-z0-9]+/gu, "-")
    .replace(/^-|-$/gu, "");
  if (slug.length === 0) {
    throw new Error(`Cannot create a stable ID from '${value}'.`);
  }
  return slug;
}

function recordClass(record: ExtractionRecord): string {
  return record.script?.class ?? "";
}

function pathOrder(left: ExtractionRecord, right: ExtractionRecord): number {
  return BigInt(left.path_id ?? "0") < BigInt(right.path_id ?? "0") ? -1 : 1;
}

function localizationTerms(raw: RawExtraction): ReadonlyMap<string, readonly string[]> {
  const record = raw.records.find((candidate) => recordClass(candidate) === "LanguageSourceAsset");
  if (record === undefined) {
    throw new Error("The extraction does not contain LanguageSourceAsset.");
  }
  const source = asObject(asObject(record.data, "LanguageSourceAsset data").mSource, "mSource");
  if (!Array.isArray(source.mTerms)) {
    throw new Error("LanguageSourceAsset.mSource.mTerms must be an array.");
  }
  return new Map(
    source.mTerms.map((entry, index) => {
      const term = asObject(entry, `localization term ${String(index)}`);
      const key = asString(term.Term, `localization term ${String(index)} key`);
      if (!Array.isArray(term.Languages)) {
        throw new Error(`Localization term '${key}' has no language array.`);
      }
      return [key, term.Languages.filter((value): value is string => typeof value === "string")];
    }),
  );
}

function localizedName(terms: ReadonlyMap<string, readonly string[]>, key: string): LocalizedText {
  const languages = terms.get(key);
  const english = languages?.[1];
  if (english === undefined || english.length === 0) {
    throw new Error(`Localization key '${key}' has no English value.`);
  }
  const german = languages?.[2];
  return {
    en: stripGameMarkup(english),
    ...(german === undefined || german.length === 0 ? {} : { de: stripGameMarkup(german) }),
  };
}

function sourceFor(record: ExtractionRecord, internalKey: string): ProvenanceSource {
  if (record.source !== DIRECT_SOURCE && record.source !== RUNTIME_SOURCE) {
    throw new Error(`Unsupported provenance source '${record.source}'.`);
  }
  return {
    sourceAsset: record.source,
    objectPathId: asString(record.path_id, `${internalKey} path ID`),
    internalKey,
  };
}

function classifyBanner(data: JsonObject): BannerClassification {
  if (data.IsFusion === true) {
    return "fusion";
  }
  if (data.IsGeneralistBanner === true) {
    return "generalist";
  }
  if (data.IsAlwaysUnique === true) {
    return "unique";
  }
  return "tower-specific";
}

function bannerSourceKey(
  record: ExtractionRecord,
  localizationKey: string,
  classification: BannerClassification,
  towerTypes: readonly number[],
): string {
  return [
    "banner",
    recordClass(record),
    localizationKey,
    classification,
    towerTypes.join("-"),
  ].join(":");
}

export function extractContentInventory(raw: RawExtraction): ContentInventory {
  const terms = localizationTerms(raw);
  const towers = TOWER_DEFINITIONS.map((definition) => {
    const candidates = raw.records
      .filter((record) => {
        if (record.source !== DIRECT_SOURCE || recordClass(record) !== definition.className) {
          return false;
        }
        return asObject(record.data, `${definition.className} data`).TowerType === definition.type;
      })
      .sort(pathOrder);
    const record = candidates[0];
    if (record === undefined) {
      throw new Error(
        `Tower type ${String(definition.type)} (${definition.className}) is missing.`,
      );
    }
    return {
      id: definition.id,
      sourceKey: `tower:${String(definition.type)}:${definition.className}`,
      towerType: definition.type,
      name: localizedName(terms, definition.localizationKey),
      source: sourceFor(record, "TowerType"),
    };
  });
  const towerIdByType = new Map<number, string>(towers.map((tower) => [tower.towerType, tower.id]));

  const obsoleteRecords: ExtractionRecord[] = [];
  const bannerDrafts = raw.records
    .filter((record) => {
      if (record.source !== DIRECT_SOURCE) {
        return false;
      }
      const data = asObject(record.data, `${recordClass(record)} data`);
      if (typeof data.CardName !== "string") {
        return false;
      }
      if (!Array.isArray(data.TowerTypes)) {
        return false;
      }
      const towerTypes = asNumberArray(data.TowerTypes, `${recordClass(record)}.TowerTypes`);
      if (towerTypes.length === 0 && data.IsGeneralistBanner !== true) {
        return false;
      }
      if (typeof data.m_Name === "string" && /\s-\sOld$/u.test(data.m_Name)) {
        obsoleteRecords.push(record);
        return false;
      }
      return true;
    })
    .sort(pathOrder)
    .map((record) => {
      const data = asObject(record.data, `${recordClass(record)} data`);
      const localizationKey = asString(data.CardName, `${recordClass(record)}.CardName`);
      const towerTypes = asNumberArray(data.TowerTypes, `${recordClass(record)}.TowerTypes`);
      const classification = classifyBanner(data);
      const name = localizedName(terms, localizationKey);
      return {
        record,
        localizationKey,
        towerTypes,
        classification,
        name,
        baseId: slugify(name.en),
      };
    });

  const duplicatedBaseIds = new Set(
    bannerDrafts
      .map((banner) => banner.baseId)
      .filter((id, index, ids) => ids.indexOf(id) !== index),
  );
  const banners = bannerDrafts.map((banner) => {
    const id = duplicatedBaseIds.has(banner.baseId)
      ? `${banner.baseId}-${banner.classification}`
      : banner.baseId;
    const eligibleTowerIds =
      banner.classification === "generalist"
        ? towers.map((tower) => tower.id)
        : banner.towerTypes.map((towerType) => {
            const towerId = towerIdByType.get(towerType);
            if (towerId === undefined) {
              throw new Error(
                `Banner '${banner.localizationKey}' references unknown tower type ${String(towerType)}.`,
              );
            }
            return towerId;
          });
    return {
      id,
      sourceKey: bannerSourceKey(
        banner.record,
        banner.localizationKey,
        banner.classification,
        banner.towerTypes,
      ),
      name: banner.name,
      classification: banner.classification,
      eligibleTowerIds,
      source: sourceFor(banner.record, banner.localizationKey),
    };
  });
  const duplicateIds = banners
    .map((banner) => banner.id)
    .filter((id, index, ids) => ids.indexOf(id) !== index);
  if (duplicateIds.length > 0) {
    throw new Error(`Generated duplicate banner IDs: ${[...new Set(duplicateIds)].join(", ")}.`);
  }

  return {
    buildId: raw.provenance.steam_build_id,
    towers,
    banners,
    exclusions: obsoleteRecords.map(
      (record) =>
        `${recordClass(record)} at ${record.source}:${record.path_id ?? "unknown"} is explicitly marked Old.`,
    ),
  };
}

function cell(value: string): string {
  return value.replace(/\|/gu, "\\|").replace(/\r?\n/gu, " ");
}

export function renderContentInventory(inventory: ContentInventory): string {
  const lines = [
    "# Content Inventory",
    "",
    `**Source build**: \`${inventory.buildId}\`  `,
    "**Status**: Editorial and visual review pending",
    "",
    "This generated checklist contains stable identities and concise source facts only. It does not contain game descriptions or copied artwork. A reviewer must replace every `TODO`, verify each mapping, and mark every row complete before production normalization.",
    "",
    "## Towers",
    "",
    "| Done | Stable ID | English name | German name | English summary | German summary | Visual | Authorship / license | Eligible banner review | Provenance |",
    "|---|---|---|---|---|---|---|---|---|---|",
    ...inventory.towers.map((tower) =>
      [
        "[ ]",
        `\`${tower.id}\``,
        cell(tower.name.en),
        cell(tower.name.de ?? "English fallback"),
        "TODO",
        "TODO",
        `\`src/assets/entities/towers/${tower.id}.png\``,
        "TODO",
        "TODO",
        `\`${cell(tower.source.sourceAsset)}:${tower.source.objectPathId} (${cell(tower.source.internalKey)})\``,
      ]
        .join(" | ")
        .replace(/^/u, "| ")
        .replace(/$/u, " |"),
    ),
    "",
    "## Banners",
    "",
    "| Done | Stable ID | English name | German name | Classification | Eligible towers | English summary | German summary | Visual | Authorship / license | Provenance |",
    "|---|---|---|---|---|---|---|---|---|---|---|",
    ...inventory.banners.map((banner) =>
      [
        "[ ]",
        `\`${banner.id}\``,
        cell(banner.name.en),
        cell(banner.name.de ?? "English fallback"),
        `\`${banner.classification}\``,
        banner.eligibleTowerIds.map((id) => `\`${id}\``).join(", "),
        "TODO",
        "TODO",
        `\`src/assets/entities/banners/${banner.id}.png\``,
        "TODO",
        `\`${cell(banner.source.sourceAsset)}:${banner.source.objectPathId} (${cell(banner.source.internalKey)})\``,
      ]
        .join(" | ")
        .replace(/^/u, "| ")
        .replace(/$/u, " |"),
    ),
    "",
    "## Reviewed exclusions",
    "",
    ...inventory.exclusions.map((exclusion) => `- [x] ${exclusion}`),
    "",
  ];
  return `${lines.join("\n")}\n`;
}

function requiredArgument(name: string): string {
  const index = process.argv.indexOf(name);
  const value = process.argv[index + 1];
  if (index < 0 || value === undefined || value.startsWith("--")) {
    throw new Error(`Missing required argument ${name}.`);
  }
  return value;
}

async function atomicWrite(path: string, value: string): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const temporaryPath = `${path}.${String(process.pid)}.tmp`;
  await writeFile(temporaryPath, value, { encoding: "utf8", flag: "wx" });
  await rename(temporaryPath, path);
}

async function main(): Promise<void> {
  const raw = JSON.parse(
    await readFile(resolve(requiredArgument("--raw")), "utf8"),
  ) as RawExtraction;
  const output = resolve(requiredArgument("--output"));
  const inventory = extractContentInventory(raw);
  await atomicWrite(output, renderContentInventory(inventory));
  console.log(
    `Generated review inventory for ${String(inventory.towers.length)} towers and ${String(inventory.banners.length)} banners.`,
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
