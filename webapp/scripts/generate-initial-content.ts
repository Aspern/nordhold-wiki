import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  normalizeGameData,
  type NormalizationDecisions,
  type NormalizationEditorial,
  type RawExtraction,
} from "./normalize-game-data.ts";
import { extractBannerEffectValues, sanitizeGameText } from "./extract-banner-effects.ts";
import {
  cssVisualMotifs,
  type BannerClassification,
  type BannerEffectValue,
  type BannerRarityEffectValue,
  type BannerRarityValues,
  type ImageVisual,
  type ProvenanceDataset,
  type RequiredLocalizedText,
  type StableIdMap,
  type WikiContent,
} from "../src/types/content.ts";

interface SpriteManifestEntry {
  readonly towerId: string;
  readonly width: number;
  readonly height: number;
  readonly sha256: string;
}

interface SpriteManifest {
  readonly steamBuildId: string;
  readonly publicationAuthorized: boolean;
  readonly files: readonly SpriteManifestEntry[];
}

interface InventoryTower {
  readonly id: string;
  readonly name: { readonly en: string; readonly de: string };
  readonly pathId: string;
}

interface InventoryBanner extends InventoryTower {
  readonly classification: BannerClassification;
  readonly towerIds: readonly string[];
}

type LocalizationTerms = ReadonlyMap<string, RequiredLocalizedText>;

const bannerPlaceholderIds: Readonly<Record<string, string>> = {
  BarrierBreaker: "barrier-shatter",
  BleedCrits: "critical-bleed",
  CardName: "",
  ChillExplosion: "chill-explosion",
  Collapse: "collapse",
  CritAura: "deadly-presence",
  DoomBlast: "doom-blast",
  FocusRune: "focus-rune",
  IcyDeath: "icy-death",
  LightningSurge: "lightning-surge",
  MagicalCharge: "magical-charge",
  MagmaField: "magma-field",
  Mastery: "mastery",
  Omnipotence: "omnipotence",
  Overdose: "overdose",
  Scraper: "scraper",
  Shockwave: "shockwave",
  Trinity: "trinity",
  WideBlast: "wide-blast",
  WrathScattering: "wrath-scattering",
};

const numericPlaceholderSources: Readonly<
  Record<string, Readonly<Record<string, string | number>>>
> = {
  "chaos-storm": { Amount: "ChaosStormAmount" },
  darkness: { Amount: "DarknessChance" },
  earthquake: { Amount: "EarthquakeDuration" },
  "frost-magician": { Amount: "FrostMagicianChance" },
  prism: { Amount: "PrismDamageTransfer" },
  trinity: { Amount: 3 },
  "wrath-scattering": { Amount: "BaseDamage" },
};

const towerSummaries: Readonly<Record<string, RequiredLocalizedText>> = {
  "arc-tower": {
    en: "Chains electrical attacks between enemies and ignores blocking.",
    de: "Verkettet elektrische Angriffe zwischen Gegnern und ignoriert Blocken.",
  },
  "arrow-tower": {
    en: "Fires dependable ranged arrows with balanced damage and speed.",
    de: "Feuert zuverlässige Fernkampfpfeile mit ausgewogenem Schaden und Tempo.",
  },
  "frost-tower": {
    en: "Uses slow frost attacks that bypass blocking and hinder enemies.",
    de: "Nutzt langsame Frostangriffe, die Blocken umgehen und Gegner behindern.",
  },
  "volcano-mortar": {
    en: "Launches long-range explosive shots that leave burning areas.",
    de: "Verschießt weitreichende Explosivgeschosse, die Brandflächen hinterlassen.",
  },
  "shadow-tower": {
    en: "Strikes rapidly through armor and works with weakness effects.",
    de: "Greift schnell durch Rüstung hindurch an und nutzt Schwächeeffekte.",
  },
  "runestone-tower": {
    en: "Projects rapid runic beams and can support nearby towers.",
    de: "Projiziert schnelle Runenstrahlen und kann nahe Türme unterstützen.",
  },
  "tornado-tower": {
    en: "Creates swift tornadoes whose attacks ignore armor.",
    de: "Erzeugt schnelle Tornados, deren Angriffe Rüstung ignorieren.",
  },
  "raven-tower": {
    en: "Delivers powerful long-range shots that bypass magical barriers.",
    de: "Führt mächtige Fernangriffe aus, die magische Barrieren umgehen.",
  },
  "chaos-reaper": {
    en: "Deals heavy close-range scythe strikes with strong critical and barrier damage.",
    de: "Verursacht schwere Sensenhiebe im Nahbereich mit hohem Krit- und Barrierschaden.",
  },
};

function requiredArgument(name: string): string {
  const index = process.argv.indexOf(name);
  const value = index < 0 ? undefined : process.argv[index + 1];
  if (value === undefined) {
    throw new Error(`Missing required argument ${name}.`);
  }
  return value;
}

function optionalArgument(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index < 0 ? undefined : process.argv[index + 1];
}

function parseCells(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/u, "")
    .replace(/\|$/u, "")
    .split("|")
    .map((cell) => cell.trim().replaceAll("`", ""));
}

function parseProvenance(value: string): string {
  const match = /:(-?[0-9]+) \([^)]*\)$/u.exec(value);
  if (match?.[1] === undefined) {
    throw new Error(`Invalid inventory provenance '${value}'.`);
  }
  return match[1];
}

function parseInventory(markdown: string): {
  readonly towers: readonly InventoryTower[];
  readonly banners: readonly InventoryBanner[];
} {
  const towers: InventoryTower[] = [];
  const banners: InventoryBanner[] = [];
  let section: "towers" | "banners" | undefined;
  for (const line of markdown.split(/\r?\n/u)) {
    if (line === "## Towers") {
      section = "towers";
      continue;
    }
    if (line === "## Banners") {
      section = "banners";
      continue;
    }
    if (!/^\|\s*\[[ x]\]\s*\|/u.test(line)) {
      continue;
    }
    const cells = parseCells(line);
    if (section === "towers") {
      const [id, en, de, provenance] = [cells[1], cells[2], cells[3], cells[9]];
      if (id === undefined || en === undefined || de === undefined || provenance === undefined) {
        throw new Error(`Incomplete tower inventory row '${line}'.`);
      }
      towers.push({ id, name: { en, de }, pathId: parseProvenance(provenance) });
    } else if (section === "banners") {
      const [id, en, de, classification, eligible, provenance] = [
        cells[1],
        cells[2],
        cells[3],
        cells[4],
        cells[5],
        cells[10],
      ];
      if (
        id === undefined ||
        en === undefined ||
        de === undefined ||
        classification === undefined ||
        eligible === undefined ||
        provenance === undefined ||
        !["tower-specific", "generalist", "unique", "fusion"].includes(classification)
      ) {
        throw new Error(`Incomplete banner inventory row '${line}'.`);
      }
      banners.push({
        id,
        name: { en, de },
        pathId: parseProvenance(provenance),
        classification: classification as BannerClassification,
        towerIds: [...eligible.matchAll(/[a-z0-9]+(?:-[a-z0-9]+)*/gu)].map((match) => match[0]),
      });
    }
  }
  return { towers, banners };
}

function rawRecord(raw: RawExtraction, pathId: string) {
  const record = raw.records.find((candidate) => candidate.path_id === pathId);
  if (record === undefined) {
    throw new Error(`Raw extraction has no record '${pathId}'.`);
  }
  return record;
}

function rawString(record: ReturnType<typeof rawRecord>, key: string): string {
  const value = (record.data as Readonly<Record<string, unknown>>)[key];
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Raw record '${String(record.path_id)}' has no string '${key}'.`);
  }
  return value;
}

function rawBytes(record: ReturnType<typeof rawRecord>): readonly number[] {
  const data = record.data as Readonly<Record<string, unknown>>;
  const serialization = data.serializationData;
  if (typeof serialization !== "object" || serialization === null) {
    throw new Error(`Raw record '${String(record.path_id)}' has no serialization data.`);
  }
  const bytes = (serialization as Readonly<Record<string, unknown>>).SerializedBytes;
  if (!Array.isArray(bytes) || !bytes.every((value) => typeof value === "number")) {
    throw new Error(`Raw record '${String(record.path_id)}' has no serialized byte array.`);
  }
  return bytes;
}

function localizationTerms(raw: RawExtraction): LocalizationTerms {
  const source = raw.records.find(
    (record) => record.source === "NordHold_Data/resources.assets" && record.name === "I2Languages",
  );
  const data = source?.data as Readonly<Record<string, unknown>> | undefined;
  const mSource = data?.mSource as Readonly<Record<string, unknown>> | undefined;
  const terms = mSource?.mTerms;
  if (!Array.isArray(terms)) {
    throw new Error("I2Languages localization terms are unavailable.");
  }
  const result = new Map<string, RequiredLocalizedText>();
  for (const value of terms) {
    if (typeof value !== "object" || value === null) {
      continue;
    }
    const term = (value as Readonly<Record<string, unknown>>).Term;
    const languages = (value as Readonly<Record<string, unknown>>).Languages;
    const en: unknown = Array.isArray(languages) ? languages[1] : undefined;
    const de: unknown = Array.isArray(languages) ? languages[2] : undefined;
    if (typeof term === "string" && typeof en === "string" && typeof de === "string") {
      result.set(term, { en, de });
    }
  }
  return result;
}

function requiredLocalization(terms: LocalizationTerms, term: string): RequiredLocalizedText {
  const localized = terms.get(term);
  if (localized === undefined || localized.en.length === 0 || localized.de.length === 0) {
    throw new Error(`Required English/German localization '${term}' is unavailable.`);
  }
  return localized;
}

function resolveBannerReferences(
  value: string,
  locale: "en" | "de",
  banner: InventoryBanner,
  bannerNames: ReadonlyMap<string, RequiredLocalizedText>,
): string {
  return value.replace(/\[([A-Za-z0-9]+)\]/gu, (_placeholder, token: string) => {
    if (token === "CardName") {
      return banner.name[locale];
    }
    const targetId = bannerPlaceholderIds[token];
    if (targetId === undefined || targetId.length === 0) {
      throw new Error(`Banner '${banner.id}' has unresolved placeholder '${token}'.`);
    }
    return requiredMapValue(bannerNames, targetId, "Banner placeholder")[locale];
  });
}

function compactNumbers(values: BannerRarityValues): string {
  return [values.common, values.rare, values.legendary].map(String).join("/");
}

function resolveNumericPlaceholders(
  value: string,
  bannerId: string,
  locale: "en" | "de",
  effects: readonly BannerEffectValue[],
): string {
  let resolved = value;
  const configured = numericPlaceholderSources[bannerId] ?? {};
  for (const [placeholder, source] of Object.entries(configured)) {
    const replacement =
      typeof source === "number"
        ? String(source)
        : (() => {
            const effect = effects.find((candidate) => candidate.sourceKey === source);
            if (effect === undefined) {
              throw new Error(
                `Banner '${bannerId}' cannot resolve numeric placeholder '${placeholder}'.`,
              );
            }
            return "value" in effect ? String(effect.value) : compactNumbers(effect.values);
          })();
    resolved = resolved.replaceAll(`[${placeholder}]`, replacement);
  }

  if (bannerId === "chaos-storm") {
    resolved = resolved.replace("[Amount2]x", locale === "de" ? "mehrfachen" : "multiple");
  } else if (bannerId === "ghost-raven") {
    resolved =
      locale === "de"
        ? resolved.replace("[Amount]% des", "einen Anteil des")
        : resolved.replace("[Amount]% of", "a share of");
  } else if (
    ["light-pillar", "supernova", "celestial-jumps", "spinning-scythe"].includes(bannerId)
  ) {
    resolved =
      locale === "de"
        ? resolved.replace("[Amount]%-Chance", "Chance")
        : resolved.replace("[Amount]% chance", "chance");
  } else if (bannerId === "squall") {
    resolved =
      locale === "de"
        ? resolved.replace("alle [Amount2] Sekunden um [Amount]% ab", "mit der Zeit ab")
        : resolved.replace("by [Amount]% every [Amount2] seconds", "over time");
  } else if (bannerId === "tempest-stopper") {
    resolved =
      locale === "de"
        ? resolved.replace("für [Amount] Sekunden", "für kurze Zeit")
        : resolved.replace("for [Amount] seconds", "for a short time");
  } else if (bannerId === "doom-scattering") {
    resolved = resolved
      .replace("[Chance] Chance", "Chance")
      .replace("a [Chance] chance", "a chance");
  }
  return resolved;
}

function resolveDescription(
  source: RequiredLocalizedText,
  banner: InventoryBanner,
  effects: readonly BannerEffectValue[],
  bannerNames: ReadonlyMap<string, RequiredLocalizedText>,
): RequiredLocalizedText {
  const resolveLocale = (locale: "en" | "de"): string => {
    let value = resolveNumericPlaceholders(
      sanitizeGameText(source[locale]),
      banner.id,
      locale,
      effects,
    );
    value = resolveBannerReferences(value, locale, banner, bannerNames);
    if (/<[^>]+>|\[[^\]]+\]/u.test(value)) {
      throw new Error(`Banner '${banner.id}' has an unresolved ${locale} description: '${value}'.`);
    }
    return value;
  };
  return { en: resolveLocale("en"), de: resolveLocale("de") };
}

export function normalizeBannerEffectValues(
  bannerId: string,
  classification: BannerClassification,
  effects: readonly BannerRarityEffectValue[],
): readonly BannerEffectValue[] {
  if (classification === "tower-specific") {
    return effects;
  }

  return effects.map(({ values, ...effect }) => {
    if (values.common !== values.rare || values.common !== values.legendary) {
      throw new Error(
        `Banner '${bannerId}' has rarity-dependent source values despite its '${classification}' classification.`,
      );
    }
    return { ...effect, value: values.common };
  });
}

function requiredMapValue<T>(values: ReadonlyMap<string, T>, key: string, label: string): T {
  const value = values.get(key);
  if (value === undefined) {
    throw new Error(`${label} '${key}' is unavailable.`);
  }
  return value;
}

function requiredArrayValue<T>(values: readonly T[], index: number, label: string): T {
  const value = values[index];
  if (value === undefined) {
    throw new Error(`${label} at index ${String(index)} is unavailable.`);
  }
  return value;
}

function markdownCell(value: string): string {
  return value.replaceAll("|", "\\|").replaceAll("\n", " ");
}

function reviewedInventory(content: WikiContent, provenance: ProvenanceDataset): string {
  const provenanceById = new Map(provenance.records.map((record) => [record.id, record]));
  const sourceLabel = (reference: string): string => {
    const source = requiredMapValue(provenanceById, reference, "Provenance").sources[0];
    if (source === undefined) {
      throw new Error(`Provenance '${reference}' has no source.`);
    }
    return `\`${source.sourceAsset}:${source.objectPathId} (${source.internalKey})\``;
  };
  const lines = [
    "# Content Inventory",
    "",
    `**Source build**: \`${content.gameBuildId}\`  `,
    "**Status**: Agent editorial and technical review complete; human release visual inspection remains tracked separately.",
    "",
    "This review record maps every published stable identity to bilingual source content, deterministic visual metadata, runtime eligibility, and source provenance. It contains no raw extraction dump or banner artwork.",
    "",
    "## Towers",
    "",
    "| Done | Stable ID | English name | German name | English summary | German summary | Visual | Authorship / license | Eligible banner review | Provenance |",
    "|---|---|---|---|---|---|---|---|---|---|",
  ];
  for (const tower of content.towers) {
    const eligibleCount = content.eligibility.filter((entry) => entry.towerId === tower.id).length;
    lines.push(
      `| [x] | \`${tower.id}\` | ${markdownCell(tower.name.en)} | ${markdownCell(tower.name.de ?? tower.name.en)} | ${markdownCell(tower.effectSummary.en)} | ${markdownCell(tower.effectSummary.de)} | \`${tower.visual.path}\` (${String(tower.visual.width)}×${String(tower.visual.height)}, SHA-256 recorded) | Authorized project-owner sprite; \`${tower.visual.licenseReference}\` | ${String(eligibleCount)} runtime-derived eligible banners reviewed | ${sourceLabel(tower.provenanceRef)} |`,
    );
  }
  lines.push(
    "",
    "## Banners",
    "",
    "| Done | Stable ID | English name | German name | Classification | Eligible towers | English description | German description | Effect values | Visual | Authorship / license | Provenance |",
    "|---|---|---|---|---|---|---|---|---|---|---|---|",
  );
  for (const banner of content.banners) {
    const eligibleTowers = content.eligibility
      .filter((entry) => entry.bannerId === banner.id)
      .map((entry) => `\`${entry.towerId}\``)
      .join(", ");
    lines.push(
      `| [x] | \`${banner.id}\` | ${markdownCell(banner.name.en)} | ${markdownCell(banner.name.de ?? banner.name.en)} | \`${banner.classification}\` | ${eligibleTowers} | ${markdownCell(banner.effectDescription.en)} | ${markdownCell(banner.effectDescription.de)} | ${String(banner.effectValues.length)} source record(s) | CSS \`${banner.visual.motif}\`, seed ${String(banner.visual.seed)} | Original CSS; \`${banner.visual.licenseReference}\` | ${sourceLabel(banner.provenanceRef)} |`,
    );
  }
  return `${lines.join("\n")}\n`;
}

async function main(): Promise<void> {
  const scriptDirectory = dirname(fileURLToPath(import.meta.url));
  const webappRoot = resolve(scriptDirectory, "..");
  const repositoryRoot = resolve(webappRoot, "..");
  const outputDirectory = resolve(requiredArgument("--output"));
  const [raw, inventoryMarkdown, spriteManifest] = await Promise.all([
    readFile(resolve(requiredArgument("--raw")), "utf8").then(
      (value) => JSON.parse(value) as RawExtraction,
    ),
    readFile(
      resolve(repositoryRoot, "specs/001-initial-wiki-platform/content-inventory.md"),
      "utf8",
    ),
    readFile(
      resolve(webappRoot, "src/assets/entities/towers/extraction-manifest.json"),
      "utf8",
    ).then((value) => JSON.parse(value) as SpriteManifest),
  ]);
  const inventory = parseInventory(inventoryMarkdown);
  if (inventory.towers.length !== 9 || inventory.banners.length !== 97) {
    throw new Error("Expected 9 towers and 97 active banners in the reviewed inventory.");
  }
  if (
    !spriteManifest.publicationAuthorized ||
    spriteManifest.steamBuildId !== raw.provenance.steam_build_id
  ) {
    throw new Error("Tower sprite authorization is missing or belongs to another game build.");
  }

  const terms = localizationTerms(raw);
  const bannerNames = new Map<string, RequiredLocalizedText>(
    inventory.banners.map((banner) => [banner.id, banner.name]),
  );
  const bannerEffects = new Map(
    inventory.banners.map((banner) => {
      const record = rawRecord(raw, banner.pathId);
      const extractedValues = extractBannerEffectValues(banner.id, rawBytes(record), (term) => {
        const label = requiredLocalization(terms, term);
        return {
          en: resolveBannerReferences(label.en, "en", banner, bannerNames),
          de: resolveBannerReferences(label.de, "de", banner, bannerNames),
        };
      });
      const values = normalizeBannerEffectValues(banner.id, banner.classification, extractedValues);
      const description = resolveDescription(
        requiredLocalization(terms, rawString(record, "Description")),
        banner,
        values,
        bannerNames,
      );
      return [banner.id, { description, values }] as const;
    }),
  );

  const towerSourceKeyById = new Map<string, string>();
  for (const tower of inventory.towers) {
    const sourceClass = rawRecord(raw, tower.pathId).script?.class;
    if (sourceClass === undefined) {
      throw new Error(`Tower '${tower.id}' has no source class identity.`);
    }
    towerSourceKeyById.set(tower.id, sourceClass);
  }
  const bannerSourceKeyById = new Map<string, string>();
  const bannerSourceClassById = new Map<string, string>();
  for (const banner of inventory.banners) {
    const sourceRecord = rawRecord(raw, banner.pathId);
    const sourceClass = sourceRecord.script?.class;
    if (sourceClass === undefined) {
      throw new Error(`Banner '${banner.id}' has no source class identity.`);
    }
    bannerSourceKeyById.set(
      banner.id,
      `${banner.classification}:${sourceClass}:${rawString(sourceRecord, "CardName")}`,
    );
    bannerSourceClassById.set(banner.id, sourceClass);
  }
  const manager = raw.records.find(
    (record) =>
      record.source === "NordHold_Data/level2" && record.script?.class === "RogueCardsManager",
  );
  if (manager?.path_id === null || manager?.path_id === undefined) {
    throw new Error("Runtime RogueCardsManager evidence is unavailable.");
  }
  const managerPathId = manager.path_id;

  const decisions: NormalizationDecisions = {
    schemaVersion: "1.0.0",
    extractorVersion: "1.0.0",
    uncertainties: [],
    towers: inventory.towers.map((tower, index) => ({
      sourceKey: requiredMapValue(towerSourceKeyById, tower.id, "Tower source key"),
      stableId: tower.id,
      sortOrder: index,
      name: tower.name,
      source: {
        sourceAsset: "NordHold_Data/resources.assets",
        objectPathId: tower.pathId,
        internalKey: requiredMapValue(towerSourceKeyById, tower.id, "Tower source key"),
      },
    })),
    banners: inventory.banners.map((banner, index) => ({
      sourceKey: requiredMapValue(bannerSourceKeyById, banner.id, "Banner source key"),
      stableId: banner.id,
      sortOrder: index,
      name: banner.name,
      classification: banner.classification,
      ...(banner.classification === "tower-specific"
        ? {
            towerAffinitySourceKey: requiredMapValue(
              towerSourceKeyById,
              requiredArrayValue(banner.towerIds, 0, `Tower affinity for '${banner.id}'`),
              "Tower source key",
            ),
          }
        : {}),
      source: {
        sourceAsset: "NordHold_Data/resources.assets",
        objectPathId: banner.pathId,
        internalKey: requiredMapValue(bannerSourceClassById, banner.id, "Banner source class"),
      },
    })),
    eligibility: inventory.banners.flatMap((banner) =>
      banner.towerIds.map((towerId) => ({
        towerSourceKey: requiredMapValue(towerSourceKeyById, towerId, "Tower source key"),
        bannerSourceKey: requiredMapValue(bannerSourceKeyById, banner.id, "Banner source key"),
        relationshipSource: {
          sourceAsset: "NordHold_Data/resources.assets" as const,
          objectPathId: banner.pathId,
          internalKey: requiredMapValue(bannerSourceClassById, banner.id, "Banner source class"),
        },
        source: {
          sourceAsset: "NordHold_Data/level2" as const,
          objectPathId: managerPathId,
          internalKey: "RogueCardsManager",
        },
      })),
    ),
  };

  const spriteByTower = new Map(spriteManifest.files.map((file) => [file.towerId, file]));
  const editorial = Object.fromEntries([
    ...inventory.towers.map((tower) => {
      const sprite = spriteByTower.get(tower.id);
      const effectSummary = towerSummaries[tower.id];
      if (sprite === undefined || effectSummary === undefined) {
        throw new Error(`Tower '${tower.id}' lacks visual or editorial data.`);
      }
      const visual: ImageVisual = {
        kind: "image",
        assetId: `${tower.id}-visual`,
        path: `src/assets/entities/towers/${tower.id}.png`,
        width: sprite.width,
        height: sprite.height,
        sha256: sprite.sha256,
        authorship: "authorized",
        licenseReference: "src/assets/entities/towers/extraction-manifest.json",
        alt: {
          en: `${tower.name.en} icon`,
          de: `Symbol für ${tower.name.de}`,
        },
      };
      return [tower.id, { effectSummary, visual }] as const;
    }),
    ...inventory.banners.map((banner, index) => {
      const effect = requiredMapValue(bannerEffects, banner.id, "Banner effect");
      return [
        banner.id,
        {
          effectDescription: effect.description,
          effectValues: effect.values,
          visual: {
            kind: "css" as const,
            assetId: `${banner.id}-visual`,
            seed: index + 1,
            motif: requiredArrayValue(
              cssVisualMotifs,
              index % cssVisualMotifs.length,
              "CSS visual motif",
            ),
            authorship: "original" as const,
            licenseReference: "Original CSS visual system in src/components/BannerVisual.vue",
            alt: {
              en: `Abstract emblem for ${banner.name.en}`,
              de: `Abstraktes Emblem für ${banner.name.de}`,
            },
          },
        },
      ] as const;
    }),
  ]) as NormalizationEditorial;
  const idMap: StableIdMap = { schemaVersion: "1.0.0", towers: [], banners: [] };
  const result = normalizeGameData(raw, decisions, editorial, idMap);
  await mkdir(outputDirectory, { recursive: true });
  const inventoryOutput = optionalArgument("--inventory-output");
  await Promise.all([
    writeFile(
      resolve(outputDirectory, "wiki-content.json"),
      `${JSON.stringify(result.bundle.content, undefined, 2)}\n`,
      "utf8",
    ),
    writeFile(
      resolve(outputDirectory, "provenance.json"),
      `${JSON.stringify(result.bundle.provenance, undefined, 2)}\n`,
      "utf8",
    ),
    writeFile(
      resolve(outputDirectory, "id-map.json"),
      `${JSON.stringify(result.bundle.idMap, undefined, 2)}\n`,
      "utf8",
    ),
    writeFile(
      resolve(outputDirectory, "normalization-report.json"),
      `${JSON.stringify(result.report, undefined, 2)}\n`,
      "utf8",
    ),
    ...(inventoryOutput === undefined
      ? []
      : [
          writeFile(
            resolve(inventoryOutput),
            reviewedInventory(result.bundle.content, result.bundle.provenance),
            "utf8",
          ),
        ]),
  ]);
  console.log(
    `Generated ${String(result.report.towerCount)} towers, ${String(result.report.bannerCount)} banners, and ${String(result.report.eligibilityCount)} eligibility relationships.`,
  );
}

if (process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
