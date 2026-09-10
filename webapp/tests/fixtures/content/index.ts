import type {
  Banner,
  ContentBundle,
  CssVisual,
  Eligibility,
  ImageVisual,
  ProvenanceRecord,
  Tower,
} from "../../../src/types/content.ts";

export interface FixtureVisualInspection {
  readonly width: number;
  readonly height: number;
  readonly sha256: string;
}

function imageVisual(id: string, hex: string): ImageVisual {
  return {
    kind: "image",
    assetId: `${id}-visual`,
    path: `src/assets/entities/towers/${id}.png`,
    width: 64,
    height: 64,
    sha256: hex.repeat(64),
    authorship: "authorized",
    licenseReference: "Test authorization manifest.",
    alt: { en: `${id} emblem`, de: `${id} Emblem` },
  };
}

function cssVisual(id: string, seed: number): CssVisual {
  return {
    kind: "css",
    assetId: `${id}-visual`,
    seed,
    motif: "rune",
    authorship: "original",
    licenseReference: "Original test CSS visual.",
    alt: { en: `${id} emblem`, de: `${id} Emblem` },
  };
}

const towers: Tower[] = [
  {
    id: "arc-tower",
    sourceKey: "Tower_Arc",
    sortOrder: 10,
    name: { en: "Arc Tower", de: "Arkan-Turm" },
    effectSummary: { en: "Channels focused energy.", de: "Bündelt fokussierte Energie." },
    visual: imageVisual("arc-tower", "1"),
    provenanceRef: "tower-arc-source",
  },
  {
    id: "ember-tower",
    sourceKey: "Tower_Ember",
    sortOrder: 20,
    name: { en: "Ember Tower", de: "Glut-Turm" },
    effectSummary: { en: "Applies sustained heat.", de: "Verursacht anhaltende Hitze." },
    visual: imageVisual("ember-tower", "2"),
    provenanceRef: "tower-ember-source",
  },
];

const banners: Banner[] = [
  {
    id: "arc-focus",
    sourceKey: "Banner_ArcFocus",
    sortOrder: 10,
    classification: "tower-specific",
    towerAffinityId: "arc-tower",
    name: { en: "Arc Focus", de: "Arkan-Fokus" },
    effectDescription: { en: "Strengthens arc effects.", de: "Verstärkt Arkaneffekte." },
    effectValues: [
      {
        sourceKey: "ArcDamage",
        label: { en: "Damage", de: "Schaden" },
        values: { common: 2, rare: 6, legendary: 10 },
        format: {
          prefix: "plus",
          suffix: "percent",
          hideEqualValues: false,
          restriction: null,
        },
      },
    ],
    visual: cssVisual("arc-focus", 3),
    provenanceRef: "banner-arc-focus-source",
  },
  {
    id: "steady-hands",
    sourceKey: "Banner_SteadyHands",
    sortOrder: 20,
    classification: "generalist",
    name: { en: "Steady Hands", de: "Ruhige Hände" },
    effectDescription: { en: "Improves reliable output.", de: "Verbessert verlässliche Wirkung." },
    effectValues: [
      {
        sourceKey: "ReliableOutput",
        label: { en: "Reliable output", de: "Verlässliche Wirkung" },
        value: 5,
        format: {
          prefix: "plus",
          suffix: "percent",
          hideEqualValues: true,
          restriction: null,
        },
      },
    ],
    visual: cssVisual("steady-hands", 4),
    provenanceRef: "banner-steady-hands-source",
  },
  {
    id: "singular-purpose",
    sourceKey: "Banner_SingularPurpose",
    sortOrder: 30,
    classification: "unique",
    name: { en: "Singular Purpose", de: "Einziger Zweck" },
    effectDescription: { en: "Changes one tactical rule.", de: "Verändert eine taktische Regel." },
    effectValues: [],
    visual: cssVisual("singular-purpose", 5),
    provenanceRef: "banner-singular-purpose-source",
  },
  {
    id: "combined-spark",
    sourceKey: "Banner_CombinedSpark",
    sortOrder: 40,
    classification: "fusion",
    name: { en: "Combined Spark", de: "Vereinter Funke" },
    effectDescription: { en: "Combines two tower traits.", de: "Vereint zwei Turmeigenschaften." },
    effectValues: [],
    visual: cssVisual("combined-spark", 6),
    provenanceRef: "banner-combined-spark-source",
  },
];

const eligibility: Eligibility[] = [
  { towerId: "arc-tower", bannerId: "arc-focus", provenanceRef: "eligible-arc-focus" },
  {
    towerId: "arc-tower",
    bannerId: "combined-spark",
    provenanceRef: "eligible-arc-combined",
  },
  {
    towerId: "arc-tower",
    bannerId: "singular-purpose",
    provenanceRef: "eligible-arc-singular",
  },
  {
    towerId: "arc-tower",
    bannerId: "steady-hands",
    provenanceRef: "eligible-arc-steady",
  },
  {
    towerId: "ember-tower",
    bannerId: "combined-spark",
    provenanceRef: "eligible-ember-combined",
  },
  {
    towerId: "ember-tower",
    bannerId: "steady-hands",
    provenanceRef: "eligible-ember-steady",
  },
];

function provenanceRecord(
  id: string,
  entityType: ProvenanceRecord["entityType"],
  entityId: string,
  evidence: ProvenanceRecord["evidence"],
  internalKey: string,
): ProvenanceRecord {
  return {
    id,
    entityType,
    entityId,
    evidence,
    sources: [
      {
        sourceAsset:
          entityType === "eligibility" ? "NordHold_Data/level2" : "NordHold_Data/resources.assets",
        objectPathId: "9223372036854775806",
        internalKey,
      },
    ],
    localizationLanguages: entityType === "eligibility" ? [] : ["en", "de"],
    notes: [],
  };
}

const records: ProvenanceRecord[] = [
  ...towers.map((tower) =>
    provenanceRecord(tower.provenanceRef, "tower", tower.id, "direct-record", tower.sourceKey),
  ),
  ...banners.map((banner) =>
    provenanceRecord(banner.provenanceRef, "banner", banner.id, "direct-record", banner.sourceKey),
  ),
  ...eligibility.map((entry) =>
    provenanceRecord(
      entry.provenanceRef,
      "eligibility",
      `${entry.towerId}:${entry.bannerId}`,
      "runtime-reference",
      `${entry.towerId}:${entry.bannerId}`,
    ),
  ),
].sort((left, right) => left.id.localeCompare(right.id, "en"));

export const validBundle: ContentBundle = {
  content: {
    schemaVersion: "1.0.0",
    gameBuildId: "23261523",
    towers,
    banners,
    eligibility,
  },
  provenance: {
    schemaVersion: "1.0.0",
    datasetId: "nordhold-build-23261523",
    game: {
      steamAppId: "3028310",
      buildId: "23261523",
      unityVersion: "6000.0.34f1",
    },
    extraction: {
      extractor: ".agents/skills/nordhold-game-data/scripts/extract_game_data.py",
      extractorVersion: "1.0.0",
      pythonVersion: "3.13.7",
      dependencies: {
        TypeTreeGeneratorAPI: "0.0.10",
        UnityPy: "1.25.3",
      },
      generatedAt: "2026-09-05T10:00:00Z",
      parseErrors: [],
      uncertainties: [],
    },
    records,
  },
  idMap: {
    schemaVersion: "1.0.0",
    towers: towers.map((tower) => ({
      sourceKey: tower.sourceKey,
      id: tower.id,
      sourceKeyAliases: [],
    })),
    banners: banners.map((banner) => ({
      sourceKey: banner.sourceKey,
      id: banner.id,
      sourceKeyAliases: [],
    })),
  },
};

export const fixtureVisuals = new Map<string, FixtureVisualInspection>(
  towers.map((entity) => [
    entity.visual.path,
    {
      width: entity.visual.width,
      height: entity.visual.height,
      sha256: entity.visual.sha256,
    },
  ]),
);

export function cloneValidBundle(): ContentBundle {
  return structuredClone(validBundle);
}

export function malformedFixture(): unknown {
  return {
    ...structuredClone(validBundle),
    content: { schemaVersion: 1 },
  };
}

export function duplicateFixture(): ContentBundle {
  const fixture = cloneValidBundle();
  const mutable = fixture.content.towers as Tower[];
  const firstTower = mutable[0];
  if (firstTower === undefined) {
    throw new Error("The valid fixture must contain a tower.");
  }
  mutable.push(structuredClone(firstTower));
  return fixture;
}

export function obsoleteFixture(): Record<string, unknown> {
  return {
    sourceKey: "Banner_OldRule",
    objectPathId: "9223372036854775805",
    obsolete: true,
  };
}

export function unresolvedReferenceFixture(): ContentBundle {
  const fixture = cloneValidBundle();
  (fixture.content.eligibility as Eligibility[])[0] = {
    towerId: "arc-tower",
    bannerId: "missing-banner",
    provenanceRef: "eligible-arc-focus",
  };
  return fixture;
}

export function missingEnglishFixture(): ContentBundle {
  const fixture = cloneValidBundle();
  const firstTower = fixture.content.towers[0];
  if (firstTower === undefined) {
    throw new Error("The valid fixture must contain a tower.");
  }
  delete (firstTower.name as { en?: string }).en;
  return fixture;
}

export function missingGermanNameFixture(): ContentBundle {
  const fixture = cloneValidBundle();
  const firstTower = fixture.content.towers[0];
  if (firstTower === undefined) {
    throw new Error("The valid fixture must contain a tower.");
  }
  delete (firstTower.name as { de?: string }).de;
  return fixture;
}

export function missingGermanSummaryFixture(): ContentBundle {
  const fixture = cloneValidBundle();
  const firstTower = fixture.content.towers[0];
  if (firstTower === undefined) {
    throw new Error("The valid fixture must contain a tower.");
  }
  delete (firstTower.effectSummary as { de?: string }).de;
  return fixture;
}
