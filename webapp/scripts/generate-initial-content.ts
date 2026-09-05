import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  normalizeGameData,
  type NormalizationDecisions,
  type NormalizationEditorial,
  type RawExtraction,
} from "./normalize-game-data.ts";
import {
  cssVisualMotifs,
  type BannerClassification,
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

const bannerSummaries: Readonly<Record<string, RequiredLocalizedText>> = {
  "barrier-shatter": {
    en: "Boosts Chaos Reaper damage against health and barriers.",
    de: "Steigert den Schaden des Chaos Reapers gegen Leben und Barrieren.",
  },
  "critical-bleed": {
    en: "Converts part of Chaos Reaper critical damage into bleeding stacks.",
    de: "Wandelt einen Teil des kritischen Chaos-Reaper-Schadens in Blutungsstapel um.",
  },
  "bodkin-arrow": {
    en: "Raises the Arrow Tower's firing speed.",
    de: "Erhöht die Feuerrate des Arrow Towers.",
  },
  "chain-crits": {
    en: "Each critical hit builds additional critical chance.",
    de: "Jeder kritische Treffer baut zusätzliche kritische Chance auf.",
  },
  "chaos-storm": {
    en: "Periodically releases multiple barrier-burning strikes around the target.",
    de: "Entfesselt regelmäßig mehrere barriereverbrennende Schläge im Zielgebiet.",
  },
  "chill-explosion": {
    en: "Lets Frost Tower attacks occasionally freeze their targets.",
    de: "Lässt Angriffe des Frost Towers gelegentlich Ziele einfrieren.",
  },
  "cold-snap": {
    en: "Strengthens and extends the Frost Tower's slowing effect.",
    de: "Verstärkt und verlängert den Verlangsamungseffekt des Frost Towers.",
  },
  collapse: {
    en: "Provides stone each wave and improves Tornado Tower critical chance.",
    de: "Gewährt pro Welle Stein und erhöht die kritische Chance des Tornado Towers.",
  },
  "corpse-explosion-tower-specific": {
    en: "Gives Shadow Tower kills a chance to detonate the victim for area damage.",
    de: "Gibt Shadow-Tower-Kills eine Chance, das Opfer für Flächenschaden explodieren zu lassen.",
  },
  "crescendo-blast": {
    en: "Trades normal blast size for a greatly enlarged fourth explosion.",
    de: "Tauscht normale Explosionsgröße gegen eine stark vergrößerte vierte Explosion.",
  },
  "barbed-arrows": {
    en: "Arrow hits inflict a stacking bleeding effect.",
    de: "Pfeiltreffer verursachen einen stapelbaren Blutungseffekt.",
  },
  "deadly-presence": {
    en: "Improves critical damage for towers inside a Chaos Reaper's range.",
    de: "Erhöht den kritischen Schaden von Türmen im Radius eines Chaos Reapers.",
  },
  "critical-nexus": {
    en: "Critical Arc Tower hits release chain lightning.",
    de: "Kritische Treffer des Arc Towers lösen Kettenblitze aus.",
  },
  "dark-worship": {
    en: "Raises Chaos Reaper critical chance and global spell damage.",
    de: "Erhöht die kritische Chance des Chaos Reapers und den globalen Zauberschaden.",
  },
  darkness: {
    en: "Shadow Tower kills can mark victims to take more damage.",
    de: "Shadow-Tower-Kills können Opfer markieren, sodass sie mehr Schaden erleiden.",
  },
  "doom-blast": {
    en: "Killed enemies explode for damage based on their maximum health.",
    de: "Getötete Gegner explodieren mit Schaden abhängig von ihren maximalen Lebenspunkten.",
  },
  "double-strike": {
    en: "Adds a second Chaos Reaper hit worth part of the first strike.",
    de: "Fügt einen zweiten Chaos-Reaper-Treffer mit einem Anteil des ersten Hiebs hinzu.",
  },
  earthquake: {
    en: "Creates recurring damaging tremors around Tornado Towers that also stun.",
    de: "Erzeugt wiederkehrende Schadensbeben um Tornado Towers, die zusätzlich betäuben.",
  },
  "chain-echo": {
    en: "Allows Arc Tower lightning to reach more targets.",
    de: "Lässt die Blitze des Arc Towers mehr Ziele erreichen.",
  },
  "focus-rune": {
    en: "Repeated attacks on one enemy steadily gain damage.",
    de: "Wiederholte Angriffe auf denselben Gegner gewinnen fortlaufend Schaden.",
  },
  "frost-magician": {
    en: "Frost Novas periodically grant energy with a global cooldown.",
    de: "Frostnovas gewähren regelmäßig Energie mit globaler Abklingzeit.",
  },
  "ghost-raven": {
    en: "Summons a spectral raven that periodically fires a damaging vortex.",
    de: "Beschwört einen Geisterraben, der regelmäßig einen Schadenswirbel abfeuert.",
  },
  "glacial-nova": {
    en: "Frost Tower kills can unleash a powerful nova with extra freeze potential.",
    de: "Frost-Tower-Kills können eine mächtige Nova mit zusätzlichem Gefrierpotenzial entfesseln.",
  },
  "light-pillar": {
    en: "Kills can summon a sustained ray powered by Runestone Tower damage.",
    de: "Kills können einen anhaltenden Strahl auf Basis des Runestone-Tower-Schadens beschwören.",
  },
  "icy-death": {
    en: "Creates an area whose damage per second grows over time.",
    de: "Erzeugt einen Bereich, dessen Schaden pro Sekunde mit der Zeit wächst.",
  },
  insanity: {
    en: "Boosts Shadow Tower damage and adds projectiles at legendary rarity.",
    de: "Steigert Shadow-Tower-Schaden und fügt bei legendärer Seltenheit Projektile hinzu.",
  },
  "lightning-surge": {
    en: "Arc Tower hits can release an additional lightning surge.",
    de: "Treffer des Arc Towers können einen zusätzlichen Blitzschwall auslösen.",
  },
  "magical-charge": {
    en: "Adds a share of spell damage to Runestone Tower attacks.",
    de: "Fügt Runestone-Tower-Angriffen einen Anteil des Zauberschadens hinzu.",
  },
  "magma-field": {
    en: "Volcano Mortar explosions leave a stacking burning field.",
    de: "Explosionen des Volcano Mortars hinterlassen ein stapelbares Brandfeld.",
  },
  mastery: {
    en: "Increases Raven Tower damage for each of its banners.",
    de: "Erhöht den Schaden des Raven Towers für jedes seiner Banner.",
  },
  "critical-bond": {
    en: "Turns part of Arc Tower critical chance into critical damage.",
    de: "Wandelt einen Teil der kritischen Chance des Arc Towers in kritischen Schaden um.",
  },
  omnipotence: {
    en: "Improves the Raven Tower's critical damage.",
    de: "Verbessert den kritischen Schaden des Raven Towers.",
  },
  "opening-blitz": {
    en: "Deals extra Arc Tower damage to enemies above seventy percent health.",
    de: "Verursacht zusätzlichen Arc-Tower-Schaden an Gegnern über siebzig Prozent Leben.",
  },
  "outreach-first": {
    en: "Extends Volcano Mortar range while slightly reducing fire rate.",
    de: "Vergrößert die Reichweite des Volcano Mortars bei leicht verringerter Feuerrate.",
  },
  overdose: {
    en: "Carries excess Shadow Tower damage onward and raises critical damage.",
    de: "Überträgt überschüssigen Shadow-Tower-Schaden und erhöht den kritischen Schaden.",
  },
  overheating: {
    en: "Each kill adds Volcano Mortar and burn damage for the current wave.",
    de: "Jeder Kill erhöht Volcano-Mortar- und Brandschaden für die laufende Welle.",
  },
  "painful-cold": {
    en: "Exchanges part of the Frost Tower's slowing power for damage.",
    de: "Tauscht einen Teil der Verlangsamungsstärke des Frost Towers gegen Schaden.",
  },
  "lucky-shot": {
    en: "Raises Arrow Tower damage and can add another shot.",
    de: "Erhöht den Schaden des Arrow Towers und kann einen weiteren Schuss hinzufügen.",
  },
  prism: {
    en: "Transfers and amplifies damage between Runestone Towers.",
    de: "Überträgt und verstärkt Schaden zwischen Runestone Towers.",
  },
  "rapid-archer": {
    en: "Changes Arrow Tower attacks into three-shot bursts at a slower rate.",
    de: "Ändert Arrow-Tower-Angriffe in langsamere Dreiersalven.",
  },
  "runic-fire-aura": {
    en: "Runestone Towers accelerate nearby towers within their radius.",
    de: "Runestone Towers beschleunigen nahe Türme in ihrem Radius.",
  },
  rapture: {
    en: "Strengthens the weakness applied by Shadow Towers.",
    de: "Verstärkt die vom Shadow Tower verursachte Schwäche.",
  },
  "ring-of-death": {
    en: "Every tenth Shadow Tower kill triggers a damaging execution nova.",
    de: "Jeder zehnte Shadow-Tower-Kill löst eine schädigende Hinrichtungsnova aus.",
  },
  scraper: {
    en: "Tornado Tower damage rises as the target loses health.",
    de: "Der Schaden des Tornado Towers steigt, wenn das Ziel Leben verliert.",
  },
  "skyfall-arrows": {
    en: "Calls down an Arrow Rain at regular intervals.",
    de: "Ruft in regelmäßigen Abständen einen Pfeilregen herab.",
  },
  squall: {
    en: "Tornadoes begin stronger and gradually lose power.",
    de: "Tornados beginnen stärker und verlieren allmählich Kraft.",
  },
  stormbringer: {
    en: "Makes Tornado Tower vortices travel faster.",
    de: "Lässt die Wirbel des Tornado Towers schneller ziehen.",
  },
  supernova: {
    en: "Volcano Mortar attacks can trigger a large supernova.",
    de: "Angriffe des Volcano Mortars können eine große Supernova auslösen.",
  },
  "tempest-stopper": {
    en: "Adds a brief stun followed by temporary stun immunity.",
    de: "Fügt eine kurze Betäubung mit anschließender Betäubungsimmunität hinzu.",
  },
  "thor-s-wrath": {
    en: "Lets lightning revisit targets or concentrate unused jumps on one enemy.",
    de: "Lässt Blitze Ziele erneut treffen oder ungenutzte Sprünge auf einen Gegner bündeln.",
  },
  "timberwind-mark": {
    en: "Raises Arrow Tower damage and supplies wood for each Arrow Tower.",
    de: "Erhöht Arrow-Tower-Schaden und liefert Holz für jeden Arrow Tower.",
  },
  trinity: {
    en: "Splits Runestone Tower beams across several enemies at reduced damage.",
    de: "Verteilt Runestone-Tower-Strahlen mit geringerem Schaden auf mehrere Gegner.",
  },
  "twin-feathers": {
    en: "Adds another Raven Tower shot while reducing individual shot damage.",
    de: "Fügt einen weiteren Raven-Tower-Schuss hinzu und senkt den Einzelschaden.",
  },
  "volcanic-eruption": {
    en: "Greatly speeds up Volcano Mortar fire but removes manual control.",
    de: "Beschleunigt Volcano-Mortar-Feuer stark, entfernt aber die manuelle Steuerung.",
  },
  vulnerability: {
    en: "Extends weakness and makes it reduce defensive attributes.",
    de: "Verlängert Schwäche und lässt sie Verteidigungswerte senken.",
  },
  "wide-blast": {
    en: "Expands the Volcano Mortar's explosion area.",
    de: "Vergrößert den Explosionsbereich des Volcano Mortars.",
  },
  "wrath-scattering": {
    en: "Splits Raven Tower shots into several new projectiles.",
    de: "Teilt Raven-Tower-Schüsse in mehrere neue Projektile auf.",
  },
  "barrier-bane": {
    en: "Shares Barrier Shatter's bonus barrier damage with Tornado Towers.",
    de: "Überträgt den zusätzlichen Barrierschaden von Durchbruch auf Tornado Towers.",
  },
  "bloody-chain": {
    en: "Arc Tower jumps carry bleeding created by Arrow Towers.",
    de: "Sprünge des Arc Towers übertragen vom Arrow Tower verursachte Blutung.",
  },
  branding: {
    en: "Runestone beams add burn stacks derived from Magma Field.",
    de: "Runenstrahlen fügen aus Magmafeld abgeleitete Brandstapel hinzu.",
  },
  "celestial-jumps": {
    en: "Runestone Towers near Arc Towers can create their own chain jumps.",
    de: "Runestone Towers nahe Arc Towers können eigene Kettensprünge erzeugen.",
  },
  "chaos-bolts": {
    en: "Critical Arrow Tower hits apply bleeding scaled by Critical Bleed.",
    de: "Kritische Arrow-Tower-Treffer verursachen durch Kritische Blutung skalierte Blutung.",
  },
  "charged-arrows": {
    en: "Arrow Towers beside Arc Towers can launch empowered chain jumps.",
    de: "Arrow Towers neben Arc Towers können verstärkte Kettensprünge auslösen.",
  },
  "clinking-mastery": {
    en: "Passes a multiplied share of Raven mastery damage to Frost Towers.",
    de: "Überträgt einen multiplizierten Anteil des Raven-Meisterschaftsschadens auf Frost Towers.",
  },
  "corpse-explosion-fusion": {
    en: "Shadow Tower kills can explode and spread Arrow Tower bleeding.",
    de: "Shadow-Tower-Kills können explodieren und Blutung des Arrow Towers verteilen.",
  },
  "crimson-beak": {
    en: "Raven Tower shots consume bleeding stacks for multiplied damage.",
    de: "Raven-Tower-Schüsse verbrauchen Blutungsstapel für multiplizierten Schaden.",
  },
  "crippling-pain": {
    en: "Runestone Tower attacks apply a share of Frost Tower slowing.",
    de: "Runestone-Tower-Angriffe wenden einen Anteil der Frost-Tower-Verlangsamung an.",
  },
  "critical-breach": {
    en: "Arc Towers deal greater critical damage to slowed enemies.",
    de: "Arc Towers verursachen höheren kritischen Schaden an verlangsamten Gegnern.",
  },
  "critical-impact": {
    en: "Shares reduced Collapse and Omnipotence effects between both towers.",
    de: "Teilt abgeschwächte Einsturz- und Allmacht-Effekte zwischen beiden Türmen.",
  },
  "damnable-weak": {
    en: "Adds scaled Doom Blast damage to Shadow attacks against weakened enemies.",
    de: "Fügt Shadow-Angriffen gegen geschwächte Gegner skalierten Schicksalsschlag-Schaden hinzu.",
  },
  "destructive-strike": {
    en: "Lightning Surge leaves a strong burning field enhanced by Magma Field.",
    de: "Blitzschwall hinterlässt ein starkes, durch Magmafeld verbessertes Brandfeld.",
  },
  "doom-cold": {
    en: "Doom Blast can leave a slowing zone behind.",
    de: "Schicksalsschlag kann eine Verlangsamungszone hinterlassen.",
  },
  "doom-scattering": {
    en: "Tornado kills can trigger an empowered Wrath Scattering volley.",
    de: "Tornado-Kills können eine verstärkte Schicksalsstreuungs-Salve auslösen.",
  },
  "wings-of-chaos": {
    en: "Shares critical aura and Omnipotence bonuses between both towers.",
    de: "Teilt Boni von kritischer Aura und Allmacht zwischen beiden Türmen.",
  },
  "double-nova": {
    en: "Frost Tower attacks can release a second nova.",
    de: "Angriffe des Frost Towers können eine zweite Nova freisetzen.",
  },
  "fire-arrows": {
    en: "Arrow Tower shots add burn stacks scaled by Magma Field.",
    de: "Arrow-Tower-Schüsse fügen durch Magmafeld skalierte Brandstapel hinzu.",
  },
  "frost-scythe": {
    en: "Chaos Reapers deal multiplied damage to slowed enemies.",
    de: "Chaos Reaper verursachen multiplizierten Schaden an verlangsamten Gegnern.",
  },
  hydra: {
    en: "Applies Trinity to Volcano Mortars with slower fire and amplified transfer.",
    de: "Wendet Trinität mit langsamerem Feuer und verstärkter Übertragung auf Volcano Mortars an.",
  },
  "iced-target": {
    en: "Slowed enemies receive additional spell damage.",
    de: "Verlangsamte Gegner erleiden zusätzlichen Zauberschaden.",
  },
  lightstorm: {
    en: "Lightning Surge can burst through targets, strongly scaling with Magical Charge.",
    de: "Blitzschwall kann Ziele durchbrechen und stark mit Magischer Ladung skalieren.",
  },
  "mystic-winds": {
    en: "Transfers a share of Magical Charge damage into tornadoes.",
    de: "Überträgt einen Anteil des Schadens von Magischer Ladung auf Tornados.",
  },
  nightburst: {
    en: "Volcano Mortar explosions apply an amplified weakness effect.",
    de: "Explosionen des Volcano Mortars wenden einen verstärkten Schwächeeffekt an.",
  },
  "pact-of-dusk": {
    en: "Moves weakness to arrows and redirects Arrow damage bonuses to Shadow Towers.",
    de: "Verlagert Schwäche auf Pfeile und leitet Arrow-Schadensboni an Shadow Towers weiter.",
  },
  "precision-shots": {
    en: "Scales Volcano Mortar damage with additive Arrow Tower damage banners.",
    de: "Skaliert Volcano-Mortar-Schaden mit additiven Schadensbannern des Arrow Towers.",
  },
  scorching: {
    en: "Applies a share of Scraper's missing-health bonus to Runestone attacks.",
    de: "Wendet einen Anteil des Feger-Bonus gegen fehlendes Leben auf Runenangriffe an.",
  },
  "shadow-tornado": {
    en: "Nearby Tornado Towers let Shadow Towers summon longer, stronger tornadoes.",
    de: "Nahe Tornado Towers lassen Shadow Towers längere, stärkere Tornados beschwören.",
  },
  shockwave: {
    en: "Critical Arc Tower hits can emit area shockwaves scaled by Wide Blast.",
    de: "Kritische Arc-Tower-Treffer können durch Großexplosion skalierte Flächenschockwellen auslösen.",
  },
  soulflame: {
    en: "Makes weakness amplify burning damage more strongly.",
    de: "Lässt Schwäche den Brandschaden stärker erhöhen.",
  },
  "speedy-death": {
    en: "Focus Rune increases the damage growth granted by Icy Death.",
    de: "Fokusrune erhöht das von Eisiger Tod gewährte Schadenswachstum.",
  },
  "spinning-scythe": {
    en: "Adjacent Chaos Reapers can create bleed-only scythes based on their damage.",
    de: "Angrenzende Chaos Reaper können reine Blutungssensen anhand ihres Schadens erzeugen.",
  },
  "spiral-of-pain": {
    en: "Tornadoes multiply their damage against weakened enemies.",
    de: "Tornados multiplizieren ihren Schaden gegen geschwächte Gegner.",
  },
  sweeper: {
    en: "Applies a share of Scraper to Wrath Scattering projectiles.",
    de: "Wendet einen Anteil von Feger auf Projektile der Schicksalsstreuung an.",
  },
  "unchained-rage": {
    en: "Raven kills transfer capped Shadow overflow damage through Overdose.",
    de: "Raven-Kills übertragen begrenzten Shadow-Überschussschaden durch Exzess.",
  },
  "venomous-bleed": {
    en: "Bleeding from either tower also inflicts a special weakness.",
    de: "Blutung beider Türme verursacht zusätzlich eine besondere Schwäche.",
  },
  dispersion: {
    en: "Doubles banner choices while increasing tower and upgrade cost growth.",
    de: "Verdoppelt Bannerwahlen und erhöht dafür das Wachstum von Turm- und Upgradekosten.",
  },
  multitude: {
    en: "Creates separate common-only banner choices per tower and disables new uniques and fusions.",
    de: "Erzeugt getrennte, gewöhnliche Bannerwahlen pro Turm und deaktiviert neue Einzigartige und Fusionen.",
  },
  "power-rise": {
    en: "Multiplies the damage of every tower.",
    de: "Multipliziert den Schaden aller Türme.",
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
    if (!line.startsWith("| [ ] |") && !line.startsWith("| [x] |")) {
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
    "This review record maps every published stable identity to independently worded bilingual editorial content, deterministic visual metadata, runtime eligibility, and source provenance. It contains no copied game descriptions or banner artwork.",
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
    "| Done | Stable ID | English name | German name | Classification | Eligible towers | English summary | German summary | Visual | Authorship / license | Provenance |",
    "|---|---|---|---|---|---|---|---|---|---|---|",
  );
  for (const banner of content.banners) {
    const eligibleTowers = content.eligibility
      .filter((entry) => entry.bannerId === banner.id)
      .map((entry) => `\`${entry.towerId}\``)
      .join(", ");
    lines.push(
      `| [x] | \`${banner.id}\` | ${markdownCell(banner.name.en)} | ${markdownCell(banner.name.de ?? banner.name.en)} | \`${banner.classification}\` | ${eligibleTowers} | ${markdownCell(banner.effectSummary.en)} | ${markdownCell(banner.effectSummary.de)} | CSS \`${banner.visual.motif}\`, seed ${String(banner.visual.seed)} | Original CSS; \`${banner.visual.licenseReference}\` | ${sourceLabel(banner.provenanceRef)} |`,
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
      const effectSummary = bannerSummaries[banner.id];
      if (effectSummary === undefined) {
        throw new Error(`Banner '${banner.id}' lacks editorial data.`);
      }
      return [
        banner.id,
        {
          effectSummary,
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

await main();
