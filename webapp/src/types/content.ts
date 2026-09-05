export const supportedLocales = ["en", "de"] as const;
export type SupportedLocale = (typeof supportedLocales)[number];

export const bannerClassifications = ["tower-specific", "generalist", "unique", "fusion"] as const;
export type BannerClassification = (typeof bannerClassifications)[number];

export interface LocalizedText {
  readonly en: string;
  readonly de?: string;
}

export interface RequiredLocalizedText {
  readonly en: string;
  readonly de: string;
}

interface VisualBase {
  readonly assetId: string;
  readonly licenseReference: string;
  readonly alt: LocalizedText;
}

export interface ImageVisual extends VisualBase {
  readonly kind: "image";
  readonly path: string;
  readonly width: number;
  readonly height: number;
  readonly sha256: string;
  readonly authorship: "authorized";
}

export const cssVisualMotifs = [
  "crest",
  "rune",
  "orbit",
  "burst",
  "weave",
  "blade",
  "crown",
  "vortex",
] as const;
export type CssVisualMotif = (typeof cssVisualMotifs)[number];

export interface CssVisual extends VisualBase {
  readonly kind: "css";
  readonly seed: number;
  readonly motif: CssVisualMotif;
  readonly authorship: "original";
}

export type EntityVisual = ImageVisual | CssVisual;

export interface Tower {
  readonly id: string;
  readonly sourceKey: string;
  readonly sortOrder: number;
  readonly name: LocalizedText;
  readonly effectSummary: RequiredLocalizedText;
  readonly visual: ImageVisual;
  readonly provenanceRef: string;
}

export interface Banner {
  readonly id: string;
  readonly sourceKey: string;
  readonly sortOrder: number;
  readonly classification: BannerClassification;
  readonly towerAffinityId?: string;
  readonly name: LocalizedText;
  readonly effectSummary: RequiredLocalizedText;
  readonly visual: CssVisual;
  readonly provenanceRef: string;
}

export interface Eligibility {
  readonly towerId: string;
  readonly bannerId: string;
  readonly provenanceRef: string;
}

export interface WikiContent {
  readonly schemaVersion: string;
  readonly gameBuildId: string;
  readonly towers: readonly Tower[];
  readonly banners: readonly Banner[];
  readonly eligibility: readonly Eligibility[];
}

export type ProvenanceEntityType = "tower" | "banner" | "eligibility";
export type ProvenanceEvidence = "direct-record" | "runtime-reference" | "localized-record";
export type SourceAsset = "NordHold_Data/resources.assets" | "NordHold_Data/level2";

export interface ProvenanceSource {
  readonly sourceAsset: SourceAsset;
  readonly objectPathId: string;
  readonly internalKey: string;
}

export interface ProvenanceRecord {
  readonly id: string;
  readonly entityType: ProvenanceEntityType;
  readonly entityId: string;
  readonly evidence: ProvenanceEvidence;
  readonly sources: readonly ProvenanceSource[];
  readonly localizationLanguages: readonly SupportedLocale[];
  readonly notes: readonly string[];
}

export interface ProvenanceDataset {
  readonly schemaVersion: string;
  readonly datasetId: string;
  readonly game: {
    readonly steamAppId: "3028310";
    readonly buildId: string;
    readonly unityVersion: string;
  };
  readonly extraction: {
    readonly extractor: ".agents/skills/nordhold-game-data/scripts/extract_game_data.py";
    readonly extractorVersion: string;
    readonly pythonVersion: string;
    readonly dependencies: Readonly<Record<string, string>>;
    readonly generatedAt: string;
    readonly parseErrors: readonly string[];
    readonly uncertainties: readonly string[];
  };
  readonly records: readonly ProvenanceRecord[];
}

export interface StableIdMapping {
  readonly sourceKey: string;
  readonly id: string;
  readonly sourceKeyAliases: readonly string[];
}

export interface StableIdMap {
  readonly schemaVersion: string;
  readonly towers: readonly StableIdMapping[];
  readonly banners: readonly StableIdMapping[];
}

export interface ContentBundle {
  readonly content: WikiContent;
  readonly provenance: ProvenanceDataset;
  readonly idMap: StableIdMap;
}
