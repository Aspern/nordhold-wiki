import type {
  CssVisual,
  EntityVisual,
  ImageVisual,
  RequiredLocalizedText,
  StableIdMap,
} from "../../src/types/content.ts";
import type {
  NormalizationDecisions,
  NormalizationEditorial,
  RawExtraction,
} from "../../scripts/normalize-game-data.ts";

const directSource = "NordHold_Data/resources.assets" as const;
const runtimeSource = "NordHold_Data/level2" as const;

export const rawExtraction: RawExtraction = {
  provenance: {
    steam_app_id: "3028310",
    steam_build_id: "23261523",
    unity_version: "2023.1.22f1",
    generated_at: "2026-09-05T10:00:00Z",
    tool_versions: {
      UnityPy: "1.25.3",
      TypeTreeGeneratorAPI: "0.0.10",
    },
    python_version: "3.13.7",
  },
  record_count: 7,
  parse_error_count: 0,
  records: [
    { source: directSource, path_id: "9223372036854775806", name: "Tower_Lightning", data: {} },
    { source: directSource, path_id: "102", name: "Tower_Ember", data: {} },
    { source: directSource, path_id: "201", name: "Banner_ArcFocus", data: {} },
    { source: directSource, path_id: "202", name: "Banner_General", data: {} },
    { source: directSource, path_id: "203", name: "Banner_General_Copy", data: {} },
    { source: directSource, path_id: "204", name: "Banner_OldRule", data: {} },
    { source: runtimeSource, path_id: "301", name: "RuntimeBannerManager", data: {} },
  ],
  parse_errors: [],
};

const source = (objectPathId: string, internalKey: string) => ({
  sourceAsset: directSource,
  objectPathId,
  internalKey,
});

export const decisions: NormalizationDecisions = {
  schemaVersion: "1.0.0",
  extractorVersion: "1.0.0",
  uncertainties: [],
  towers: [
    {
      sourceKey: "Tower_Lightning",
      source: source("9223372036854775806", "Tower_Lightning"),
      sortOrder: 10,
      name: { en: "Arc Tower", de: "Arkan-Turm" },
    },
    {
      sourceKey: "Tower_Ember",
      source: source("102", "Tower_Ember"),
      stableId: "ember-tower",
      sortOrder: 20,
      name: { en: "Ember Tower", de: "Glut-Turm" },
    },
  ],
  banners: [
    {
      sourceKey: "Banner_ArcFocus",
      source: source("201", "Banner_ArcFocus"),
      stableId: "arc-focus",
      sortOrder: 10,
      classification: "tower-specific",
      towerAffinitySourceKey: "Tower_Lightning",
      name: { en: "Arc Focus", de: "Arkan-Fokus" },
    },
    {
      sourceKey: "Banner_General",
      source: source("202", "Banner_General"),
      stableId: "steady-hands",
      sortOrder: 20,
      classification: "generalist",
      name: { en: "Steady Hands", de: "Ruhige Hände" },
    },
    {
      sourceKey: "Banner_General_Copy",
      source: source("203", "Banner_General_Copy"),
      duplicateOfSourceKey: "Banner_General",
      sortOrder: 21,
      classification: "generalist",
      name: { en: "Steady Hands", de: "Ruhige Hände" },
    },
    {
      sourceKey: "Banner_OldRule",
      source: source("204", "Banner_OldRule"),
      stableId: "old-rule",
      sortOrder: 30,
      classification: "unique",
      obsolete: true,
      name: { en: "Old Rule" },
    },
  ],
  eligibility: [
    {
      towerSourceKey: "Tower_Lightning",
      bannerSourceKey: "Banner_ArcFocus",
      relationshipSource: source("201", "Banner_ArcFocus"),
      source: {
        sourceAsset: runtimeSource,
        objectPathId: "301",
        internalKey: "RuntimeBannerManager",
      },
    },
    {
      towerSourceKey: "Tower_Lightning",
      bannerSourceKey: "Banner_General",
      relationshipSource: source("202", "Banner_General"),
      source: {
        sourceAsset: runtimeSource,
        objectPathId: "301",
        internalKey: "RuntimeBannerManager",
      },
    },
    {
      towerSourceKey: "Tower_Ember",
      bannerSourceKey: "Banner_General",
      relationshipSource: source("202", "Banner_General"),
      source: {
        sourceAsset: runtimeSource,
        objectPathId: "301",
        internalKey: "RuntimeBannerManager",
      },
    },
  ],
};

function imageVisual(id: string, hex: string): ImageVisual {
  return {
    kind: "image",
    assetId: `${id}-visual`,
    path: `src/assets/entities/towers/${id}.png`,
    width: 64,
    height: 64,
    sha256: hex.repeat(64),
    authorship: "authorized",
    licenseReference: "Authorized test tower artwork.",
    alt: { en: `${id} emblem`, de: `${id} Emblem` },
  };
}

function cssVisual(id: string, seed: number): CssVisual {
  return {
    kind: "css",
    assetId: `${id}-visual`,
    seed,
    motif: "crest",
    authorship: "original",
    licenseReference: "Original Nordhold Wiki CSS visual.",
    alt: { en: `${id} emblem`, de: `${id} Emblem` },
  };
}

function editorialEntry(
  id: string,
  kind: "towers" | "banners",
  hex: string,
): { readonly effectSummary: RequiredLocalizedText; readonly visual: EntityVisual } {
  return {
    effectSummary: { en: `English summary for ${id}.`, de: `Deutsche Zusammenfassung für ${id}.` },
    visual: kind === "towers" ? imageVisual(id, hex) : cssVisual(id, Number.parseInt(hex, 16)),
  };
}

export const editorial: NormalizationEditorial = {
  "arc-tower": editorialEntry("arc-tower", "towers", "1"),
  "ember-tower": editorialEntry("ember-tower", "towers", "2"),
  "arc-focus": editorialEntry("arc-focus", "banners", "3"),
  "steady-hands": editorialEntry("steady-hands", "banners", "4"),
};

export const initialIdMap: StableIdMap = {
  schemaVersion: "1.0.0",
  towers: [
    {
      sourceKey: "Tower_Arc",
      id: "arc-tower",
      sourceKeyAliases: ["Tower_Lightning"],
    },
  ],
  banners: [],
};
