import type {
  BannerEffectFormat,
  BannerRarityEffectValue,
  RequiredLocalizedText,
} from "../src/types/content.ts";

export interface OdinEntry {
  readonly offset: number;
  readonly kind: "node" | "array" | "value";
  readonly name: string | null;
  readonly path: readonly string[];
  readonly nodeType?: string | null;
  readonly value?: string | number | boolean | null;
}

export type LocalizationLookup = (term: string) => RequiredLocalizedText;

interface LegacyEffectDefinition {
  readonly sourceKey: string;
  readonly label: RequiredLocalizedText;
  readonly prefix: BannerEffectFormat["prefix"];
  readonly suffix: BannerEffectFormat["suffix"];
  readonly scale?: number;
  readonly offset?: number;
}

const namedEntryTypes = new Set([
  0x01, 0x03, 0x09, 0x0b, 0x0d, 0x0f, 0x11, 0x13, 0x15, 0x17, 0x19, 0x1b, 0x1d, 0x1f, 0x21, 0x23,
  0x25, 0x27, 0x29, 0x2b, 0x2d, 0x32,
]);

const legacyEffects: Readonly<Record<string, readonly LegacyEffectDefinition[]>> = {
  "bodkin-arrow": [
    {
      sourceKey: "BaseFireRate",
      label: { en: "Fire Rate", de: "Feuerrate" },
      prefix: "plus",
      suffix: "percent",
    },
  ],
  "chain-crits": [
    {
      sourceKey: "BaseCritChance",
      label: { en: "Crit Chance", de: "Krit. Chance" },
      prefix: "plus",
      suffix: "percent",
      scale: 100,
    },
  ],
  "cold-snap": [
    {
      sourceKey: "BaseSlowPercent",
      label: { en: "Slow Effect", de: "Verlangsamungseffekt" },
      prefix: "plus",
      suffix: "percent",
      scale: 100,
    },
  ],
  "crescendo-blast": [
    {
      sourceKey: "BaseAOE",
      label: { en: "Area of Effect", de: "Wirkungsbereich" },
      prefix: "none",
      suffix: "percent",
    },
    {
      sourceKey: "Base4AOE",
      label: { en: "4th Shot AOE", de: "AOE des 4. Schusses" },
      prefix: "none",
      suffix: "percent",
    },
  ],
  "critical-nexus": [
    {
      sourceKey: "BaseChainLightning",
      label: { en: "Chain Lightnings", de: "Kettenblitze" },
      prefix: "none",
      suffix: "none",
    },
    {
      sourceKey: "BaseDamagePercent",
      label: { en: "Damage", de: "Schaden" },
      prefix: "none",
      suffix: "percent",
    },
  ],
  "doom-blast": [
    {
      sourceKey: "BaseMaxXPDamage",
      label: { en: "Maximum HP Damage", de: "Maximaler LP-Schaden" },
      prefix: "none",
      suffix: "percent",
    },
  ],
  "chain-echo": [
    {
      sourceKey: "BaseJump",
      label: { en: "Jumps", de: "Sprünge" },
      prefix: "plus",
      suffix: "none",
    },
    {
      sourceKey: "BaseJumpDamageIncrease",
      label: { en: "Jump Damage", de: "Sprungschaden" },
      prefix: "plus",
      suffix: "percent",
    },
  ],
  "focus-rune": [
    {
      sourceKey: "BaseDamageIncrease",
      label: { en: "Damage", de: "Schaden" },
      prefix: "plus",
      suffix: "percent",
    },
  ],
  "icy-death": [
    {
      sourceKey: "BaseZoneDPS",
      label: { en: "Zone DPS", de: "Zonen-DPS" },
      prefix: "none",
      suffix: "percent",
    },
    {
      sourceKey: "BaseDpsIncrease",
      label: { en: "DPS Increase per sec", de: "DPS-Zuwachs pro Sek." },
      prefix: "plus",
      suffix: "percent",
    },
  ],
  "magma-field": [
    {
      sourceKey: "BaseAppliedDamage",
      label: { en: "Stacks at Impact", de: "Stapel bei Aufprall" },
      prefix: "none",
      suffix: "none",
    },
    {
      sourceKey: "BaseStackDamage",
      label: { en: "Stacks per Hexfield", de: "Stapel pro Hexfeld" },
      prefix: "none",
      suffix: "none",
    },
    {
      sourceKey: "BaseBurnFieldDuration",
      label: { en: "Field Duration", de: "Felddauer" },
      prefix: "none",
      suffix: "seconds",
    },
  ],
  "opening-blitz": [
    {
      sourceKey: "BaseSpecialDamage",
      label: { en: "Special Damage", de: "Spezialschaden" },
      prefix: "plus",
      suffix: "percent",
    },
  ],
  "outreach-first": [
    {
      sourceKey: "BaseRange",
      label: { en: "Range", de: "Reichweite" },
      prefix: "plus",
      suffix: "percent",
    },
    {
      sourceKey: "BaseFireRate",
      label: { en: "Fire Rate", de: "Feuerrate" },
      prefix: "none",
      suffix: "percent",
      scale: -1,
    },
  ],
  "lucky-shot": [
    {
      sourceKey: "BaseDamagePercent",
      label: { en: "Damage", de: "Schaden" },
      prefix: "plus",
      suffix: "percent",
      offset: -100,
    },
    {
      sourceKey: "BaseExtraShotChancePercent",
      label: { en: "Extra Shot Chance", de: "Chance auf Extraschuss" },
      prefix: "none",
      suffix: "percent",
    },
  ],
  "runic-fire-aura": [
    {
      sourceKey: "BaseFireRateBonus",
      label: { en: "Fire Rate Bonus", de: "Feuerratenbonus" },
      prefix: "plus",
      suffix: "percent",
    },
  ],
  rapture: [
    {
      sourceKey: "BaseWeaknessBonus",
      label: { en: "Weakness", de: "Schwäche" },
      prefix: "plus",
      suffix: "percent",
    },
  ],
  "skyfall-arrows": [
    {
      sourceKey: "BaseDamagePercent",
      label: { en: "Damage", de: "Schaden" },
      prefix: "none",
      suffix: "percent",
    },
  ],
  "timberwind-mark": [
    {
      sourceKey: "BaseWoodProduction",
      label: { en: "Wood Production", de: "Holzproduktion" },
      prefix: "plus",
      suffix: "none",
    },
    {
      sourceKey: "BaseDamagePercent",
      label: { en: "Damage", de: "Schaden" },
      prefix: "plus",
      suffix: "percent",
      offset: -100,
    },
  ],
  trinity: [
    {
      sourceKey: "BaseBeamDamagePercent",
      label: { en: "Beam Damage", de: "Strahlschaden" },
      prefix: "none",
      suffix: "percent",
    },
  ],
  "twin-feathers": [
    {
      sourceKey: "BaseDamagePercent",
      label: { en: "Burst Damage", de: "Schnellfeuerschaden" },
      prefix: "none",
      suffix: "percent",
    },
  ],
  vulnerability: [
    {
      sourceKey: "BaseWeaknessTime",
      label: { en: "Weakness Duration", de: "Schwächedauer" },
      prefix: "plus",
      suffix: "seconds",
    },
    {
      sourceKey: "BaseBlockReduction",
      label: { en: "Block", de: "Block" },
      prefix: "none",
      suffix: "percent",
    },
    {
      sourceKey: "BaseArmorPenetration",
      label: { en: "Armor", de: "Rüstung" },
      prefix: "none",
      suffix: "percent",
    },
  ],
  "wide-blast": [
    {
      sourceKey: "BaseAOE",
      label: { en: "Area of Effect", de: "Wirkungsbereich" },
      prefix: "plus",
      suffix: "percent",
      offset: -100,
    },
  ],
  "wrath-scattering": [
    {
      sourceKey: "BaseDamage",
      label: { en: "Shots", de: "Schüsse" },
      prefix: "none",
      suffix: "none",
    },
  ],
};

class BinaryReader {
  readonly #bytes: Uint8Array;
  readonly #view: DataView;
  #offset = 0;

  public constructor(bytes: readonly number[]) {
    this.#bytes = Uint8Array.from(bytes);
    this.#view = new DataView(this.#bytes.buffer);
  }

  public get offset(): number {
    return this.#offset;
  }

  public get done(): boolean {
    return this.#offset >= this.#bytes.length;
  }

  public skip(count: number): void {
    this.#assertAvailable(count);
    this.#offset += count;
  }

  public uint8(): number {
    this.#assertAvailable(1);
    return this.#view.getUint8(this.#offset++);
  }

  public int8(): number {
    this.#assertAvailable(1);
    return this.#view.getInt8(this.#offset++);
  }

  public int16(): number {
    this.#assertAvailable(2);
    const value = this.#view.getInt16(this.#offset, true);
    this.#offset += 2;
    return value;
  }

  public uint16(): number {
    this.#assertAvailable(2);
    const value = this.#view.getUint16(this.#offset, true);
    this.#offset += 2;
    return value;
  }

  public int32(): number {
    this.#assertAvailable(4);
    const value = this.#view.getInt32(this.#offset, true);
    this.#offset += 4;
    return value;
  }

  public uint32(): number {
    this.#assertAvailable(4);
    const value = this.#view.getUint32(this.#offset, true);
    this.#offset += 4;
    return value;
  }

  public int64(): number {
    this.#assertAvailable(8);
    const value = Number(this.#view.getBigInt64(this.#offset, true));
    this.#offset += 8;
    return value;
  }

  public uint64(): number {
    this.#assertAvailable(8);
    const value = Number(this.#view.getBigUint64(this.#offset, true));
    this.#offset += 8;
    return value;
  }

  public float32(): number {
    this.#assertAvailable(4);
    const value = this.#view.getFloat32(this.#offset, true);
    this.#offset += 4;
    return value;
  }

  public float64(): number {
    this.#assertAvailable(8);
    const value = this.#view.getFloat64(this.#offset, true);
    this.#offset += 8;
    return value;
  }

  public string(): string {
    const wide = this.uint8() !== 0;
    const length = this.int32();
    if (length < 0) {
      throw new Error(
        `Invalid Odin string length ${String(length)} at byte ${String(this.#offset)}.`,
      );
    }
    const byteLength = length * (wide ? 2 : 1);
    this.#assertAvailable(byteLength);
    const value = new TextDecoder(wide ? "utf-16le" : "latin1").decode(
      this.#bytes.subarray(this.#offset, this.#offset + byteLength),
    );
    this.#offset += byteLength;
    return value;
  }

  #assertAvailable(count: number): void {
    if (count < 0 || this.#offset + count > this.#bytes.length) {
      throw new Error(
        `Unexpected end of Odin data at byte ${String(this.#offset)} (wanted ${String(count)} bytes).`,
      );
    }
  }
}

function readType(reader: BinaryReader, types: Map<number, string>): string | null {
  const entryType = reader.uint8();
  if (entryType === 0x2f) {
    const id = reader.int32();
    const typeName = reader.string();
    types.set(id, typeName);
    return typeName;
  }
  if (entryType === 0x30) {
    const id = reader.int32();
    const typeName = types.get(id);
    if (typeName === undefined) {
      throw new Error(`Unknown Odin type ID ${String(id)}.`);
    }
    return typeName;
  }
  if (entryType === 0x2e) {
    return null;
  }
  throw new Error(`Unexpected Odin type marker 0x${entryType.toString(16)}.`);
}

export function decodeOdinEntries(bytes: readonly number[]): readonly OdinEntry[] {
  const reader = new BinaryReader(bytes);
  const entries: OdinEntry[] = [];
  const path: string[] = [];
  const types = new Map<number, string>();
  let anonymousNode = 0;

  while (!reader.done) {
    const offset = reader.offset;
    const entryType = reader.uint8();
    if (entryType === 0x31) {
      break;
    }
    const name = namedEntryTypes.has(entryType) ? reader.string() : null;

    if (entryType >= 0x01 && entryType <= 0x04) {
      const nodeType = readType(reader, types);
      if (entryType <= 0x02) {
        reader.int32();
      }
      entries.push({ offset, kind: "node", name, path: [...path], nodeType });
      path.push(name ?? `$node-${String(anonymousNode++)}`);
      continue;
    }
    if (entryType === 0x05) {
      if (path.pop() === undefined) {
        throw new Error(`Unexpected Odin end-of-node at byte ${String(offset)}.`);
      }
      continue;
    }
    if (entryType === 0x06) {
      const length = reader.int64();
      entries.push({ offset, kind: "array", name, path: [...path], value: length });
      path.push(`$array-${String(anonymousNode++)}`);
      continue;
    }
    if (entryType === 0x07) {
      if (path.pop() === undefined) {
        throw new Error(`Unexpected Odin end-of-array at byte ${String(offset)}.`);
      }
      continue;
    }

    let value: string | number | boolean | null;
    switch (entryType) {
      case 0x08: {
        const elements = reader.int32();
        const bytesPerElement = reader.int32();
        reader.skip(elements * bytesPerElement);
        value = `${String(elements)}x${String(bytesPerElement)}`;
        break;
      }
      case 0x09:
      case 0x0a:
      case 0x0b:
      case 0x0c:
      case 0x17:
      case 0x18:
        value = reader.int32();
        break;
      case 0x0d:
      case 0x0e:
      case 0x29:
      case 0x2a:
        reader.skip(16);
        value = null;
        break;
      case 0x0f:
      case 0x10:
        value = reader.int8();
        break;
      case 0x11:
      case 0x12:
        value = reader.uint8();
        break;
      case 0x13:
      case 0x14:
        value = reader.int16();
        break;
      case 0x15:
      case 0x16:
      case 0x25:
      case 0x26:
        value = reader.uint16();
        break;
      case 0x19:
      case 0x1a:
        value = reader.uint32();
        break;
      case 0x1b:
      case 0x1c:
        value = reader.int64();
        break;
      case 0x1d:
      case 0x1e:
        value = reader.uint64();
        break;
      case 0x1f:
      case 0x20:
        value = reader.float32();
        break;
      case 0x21:
      case 0x22:
        value = reader.float64();
        break;
      case 0x23:
      case 0x24:
        reader.skip(16);
        value = null;
        break;
      case 0x27:
      case 0x28:
      case 0x32:
      case 0x33:
        value = reader.string();
        break;
      case 0x2b:
      case 0x2c:
        value = reader.uint8() !== 0;
        break;
      case 0x2d:
      case 0x2e:
        value = null;
        break;
      default:
        throw new Error(
          `Unsupported Odin entry type 0x${entryType.toString(16)} at byte ${String(offset)}.`,
        );
    }
    entries.push({ offset, kind: "value", name, path: [...path], value });
  }

  if (path.length > 0) {
    throw new Error(`Unclosed Odin nodes: ${path.join(" > ")}.`);
  }
  return entries;
}

function normalizeFloat(value: number): number {
  if (!Number.isFinite(value)) {
    throw new Error(`Banner effect value '${String(value)}' is not finite.`);
  }
  return Number(value.toFixed(6));
}

function dictionaryValues(entries: readonly OdinEntry[], nodeName: string): Map<string, number> {
  const values = new Map<string, number>();
  let pendingKey: string | undefined;
  for (const entry of entries) {
    if (!entry.path.includes(nodeName)) {
      continue;
    }
    if (
      entry.name === "$k" &&
      (typeof entry.value === "string" || typeof entry.value === "number")
    ) {
      pendingKey = String(entry.value);
    } else if (entry.name === "$v" && typeof entry.value === "number" && pendingKey !== undefined) {
      values.set(pendingKey, normalizeFloat(entry.value));
      pendingKey = undefined;
    }
  }
  return values;
}

function rarityValues(
  entries: readonly OdinEntry[],
  nodeName: string,
  scale = 1,
  offset = 0,
): BannerRarityEffectValue["values"] {
  const values = dictionaryValues(entries, nodeName);
  const read = (key: string): number => {
    const value = values.get(key);
    if (value === undefined) {
      throw new Error(`Effect '${nodeName}' is missing CardRarity ${key}.`);
    }
    return normalizeFloat(value * scale + offset);
  };
  return { common: read("0"), rare: read("1"), legendary: read("2") };
}

function booleanField(entries: readonly OdinEntry[], name: string): boolean {
  return entries.find((entry) => entry.name === name)?.value === true;
}

function modernEffectValues(
  entries: readonly OdinEntry[],
  localize: LocalizationLookup,
): BannerRarityEffectValue[] {
  const starts = entries
    .map((entry, index) => ({ entry, index }))
    .filter(({ entry }) => entry.name === "VariableName" && typeof entry.value === "string");

  return starts.map(({ entry, index }, position) => {
    const end = starts[position + 1]?.index ?? entries.length;
    const group = entries.slice(index, end);
    const sourceKey = entry.value as string;
    const plus = booleanField(group, "AddPlus");
    const plusOrMinus = booleanField(group, "AddPlusOrMinus");
    const suffixes = [
      booleanField(group, "AddPercentage") ? "percent" : undefined,
      booleanField(group, "AddSecond") ? "seconds" : undefined,
      booleanField(group, "AddX") ? "multiplier" : undefined,
    ].filter((value): value is BannerEffectFormat["suffix"] => value !== undefined);
    if (plus && plusOrMinus) {
      throw new Error(`Effect '${sourceKey}' enables incompatible sign flags.`);
    }
    if (suffixes.length > 1) {
      throw new Error(`Effect '${sourceKey}' enables incompatible suffix flags.`);
    }
    const restrictionValues = group
      .filter(
        (candidate) =>
          candidate.path.includes("StricktionValues") && typeof candidate.value === "number",
      )
      .map((candidate) => candidate.value as number);
    const restricted = booleanField(group, "StrickToValue");
    const restrictionMinimum = restrictionValues[0];
    const restrictionMaximum = restrictionValues[1];
    if (
      restricted &&
      (restrictionValues.length !== 2 ||
        restrictionMinimum === undefined ||
        restrictionMaximum === undefined)
    ) {
      throw new Error(`Effect '${sourceKey}' has malformed restriction values.`);
    }

    return {
      sourceKey,
      label: {
        en: sanitizeGameText(localize(sourceKey).en),
        de: sanitizeGameText(localize(sourceKey).de),
      },
      values: rarityValues(group, "BaseValues"),
      format: {
        prefix: plus ? "plus" : plusOrMinus ? "plus-or-minus" : "none",
        suffix: suffixes[0] ?? "none",
        hideEqualValues: booleanField(group, "HideEqualValues"),
        restriction:
          restricted && restrictionMinimum !== undefined && restrictionMaximum !== undefined
            ? {
                minimum: normalizeFloat(restrictionMinimum),
                maximum: normalizeFloat(restrictionMaximum),
              }
            : null,
      },
    };
  });
}

function legacyEffectValues(
  entries: readonly OdinEntry[],
  bannerId: string,
): BannerRarityEffectValue[] {
  const definitions = legacyEffects[bannerId] ?? [];
  return definitions.map((definition) => ({
    sourceKey: definition.sourceKey,
    label: definition.label,
    values: rarityValues(entries, definition.sourceKey, definition.scale, definition.offset),
    format: {
      prefix: definition.prefix,
      suffix: definition.suffix,
      hideEqualValues: false,
      restriction: null,
    },
  }));
}

export function extractBannerEffectValues(
  bannerId: string,
  bytes: readonly number[],
  localize: LocalizationLookup,
): readonly BannerRarityEffectValue[] {
  const entries = decodeOdinEntries(bytes);
  const modern = modernEffectValues(entries, localize);
  return modern.length > 0 ? modern : legacyEffectValues(entries, bannerId);
}

export function sanitizeGameText(value: string): string {
  const withoutIcons = value.replace(/<icon=[^>]+>\s*/gu, "");
  const withoutMarkup = withoutIcons.replace(/<\/?(?:colorName|color|key)(?:=[^>]*)?>/gu, "");
  const normalized = withoutMarkup.replace(/[ \t]+/gu, " ").trim();
  if (/<[^>]+>/u.test(normalized)) {
    throw new Error(`Unsupported game markup in '${value}'.`);
  }
  return normalized;
}
