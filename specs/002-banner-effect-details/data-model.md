# Data Model: Banner Effect Details

## Banner

Existing identity, classification, affinity, visual, and provenance fields remain unchanged.

| Field | Type | Rules |
|---|---|---|
| `effectDescription` | `RequiredLocalizedText` | Required English and German source description; 1–1,000 characters; no game markup or unresolved square-bracket placeholder |
| `effectValues` | `BannerEffectValue[]` | Required array, including an empty array only when the source defines no numeric effect; item shape must match banner classification |

`effectSummary` is removed from banners but remains unchanged for towers.

## BannerEffectValue

`BannerEffectValue` is the union of `BannerRarityEffectValue` and
`BannerFixedEffectValue`. Both shapes share the following fields:

| Field | Type | Rules |
|---|---|---|
| `sourceKey` | string | Stable, non-empty game-data key; unique within its banner |
| `label` | `RequiredLocalizedText` | Required sanitized English and German source label |
| `format` | `BannerEffectFormat` | Required strict presentation metadata |

The two shapes are mutually exclusive:

| Shape | Additional field | Classification rule |
|---|---|---|
| `BannerRarityEffectValue` | `values: BannerRarityValues` | Allowed only for `tower-specific` banners |
| `BannerFixedEffectValue` | `value: finite number` | Required for `generalist`, `unique`, and `fusion` banners |

## BannerRarityValues

| Field | Type | Source enum |
|---|---|---|
| `common` | finite number | `CardRarity` 0 |
| `rare` | finite number | `CardRarity` 1 |
| `legendary` | finite number | `CardRarity` 2 |

Values are normalized to remove floating-point serialization noise but are not otherwise rounded or translated. A source key 3 (`Unique`) may occur in the binary payload but is not published in this three-value comparison.

## Fixed value normalization

The extractor first reads all three serialized source slots. For a generalist,
unique, or fusion effect, generation requires
`common === rare === legendary` after serialization-noise normalization. The
single published `value` is that shared number. Any difference is a blocking
source-layout error.

## BannerEffectFormat

| Field | Type | Rules |
|---|---|---|
| `prefix` | `none \| plus \| plus-or-minus` | Derived from `AddPlus` and `AddPlusOrMinus`, or an explicit legacy adapter |
| `suffix` | `none \| percent \| seconds \| multiplier` | Derived from `AddPercentage`, `AddSecond`, and `AddX`, or an explicit legacy adapter |
| `hideEqualValues` | boolean | Retains the game flag for provenance; the wiki still shows all three positions |
| `restriction` | `null \| { minimum, maximum }` | Non-null only when the game enables value restriction; minimum must not exceed maximum |

Mutually incompatible prefix or suffix flags make extraction fail.

## Description transformation

The published description is a plain string, not HTML. Supported game tags preserve their inner visible text; icon-only tags are removed with adjacent whitespace normalized. Banner reference placeholders become localized banner titles. Numeric placeholders become source-derived compact text during generation. Any remaining `<...>` or `[...]` token is invalid.

## Relationships and validation

- Every banner references one existing provenance record as before.
- Every effect value belongs to exactly one banner and has a source key unique within that banner.
- Tower-specific effects contain `values` and never `value`; all other banner effects contain `value` and never `values`.
- Every active banner has exactly one English and German description.
- Modern value records correspond one-to-one with source `BannerVariable` items.
- Legacy value records correspond one-to-one with adapter-selected base value dictionaries.
- All objects reject unexpected properties.
- The application schema and active feature contract must be byte-identical.

Card-upgrade values are outside this model; there are no state transitions.
