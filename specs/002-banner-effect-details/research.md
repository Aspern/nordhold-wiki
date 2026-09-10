# Research: Banner Effect Details

## Local extraction source

- **Decision**: Use the repository's read-only Nordhold extractor against the standard Steam installation and pin the published facts to build `23261523`.
- **Rationale**: The extractor completed with 1,164 records, zero parse errors, and the existing approved UnityPy/TypeTreeGeneratorAPI versions. It records the source assets and object path IDs already used by the wiki provenance model.
- **Alternatives considered**: Editorial summaries were rejected because they do not preserve source wording. Committing the raw dump was rejected because it is large, contains out-of-scope game data, and violates repository policy.

## Odin binary decoding

- **Decision**: Implement a narrow read-only decoder for the Odin `BinaryEntryType` stream used by banner `serializationData.SerializedBytes`, following the Apache-2.0 Team Sirenix format definition, then expose only the primitive nodes required for banner effects.
- **Rationale**: The installed build stores current `BannerVariable` collections and legacy `CardRarity` dictionaries in these payloads. A small decoder uses existing platform APIs and avoids an unapproved dependency.
- **Alternatives considered**: Adding an Odin package was rejected because it would require dependency approval and does not fit the JavaScript toolchain. Treating the bytes as text was rejected because it cannot reliably preserve node boundaries or numeric types.

## Modern and legacy value layouts

- **Decision**: Extract current `Variables` list items directly. For legacy banners, use an explicit adapter that selects each source `Base*` rarity dictionary, localized label term, and presentation format; ignore upgrade dictionaries because the requested sequence compares base Common, Rare, and Legendary banner rarities.
- **Rationale**: The build contains 94 current variables, while 22 active legacy banners keep their rarity facts in top-level dictionaries. Explicit adapters make unusual names and the historical `Ugprade*` typo reviewable and cause unknown layouts to fail.
- **Alternatives considered**: Inferring every legacy field from its English identifier was rejected because suffix semantics and percent scaling are not uniform. Publishing only modern variables was rejected as incomplete.

## Classification value semantics

- **Decision**: Retain common, rare, and legendary values only for tower-specific banners. Normalize each generalist, unique, and fusion effect to one fixed value after verifying that its three serialized source slots are identical.
- **Rationale**: Build `23261523` contains 60 effects across those three classifications and every one repeats the same number in all source slots. Publishing a slash sequence falsely implies rarity scaling that those banner types do not have.
- **Alternatives considered**: Collapsing identical values only in the view was rejected because the stored content model would continue to describe nonexistent rarity semantics. Selecting the common slot without comparing the other slots was rejected because a changed future layout could silently lose information.

## Description cleanup and placeholders

- **Decision**: Import the English and German `Description` localization terms, remove only supported `<colorName>`, `<color>`, `<key>`, and `<icon>` markup, resolve banner-name placeholders through localized active-banner titles, and resolve numeric placeholders from the matching extracted effect or rarity-specific source records. Generation fails if brackets or tags remain.
- **Rationale**: This preserves visible source wording and punctuation without rendering game markup as HTML. Rarity-specific records provide already-resolved evidence for the legacy templates that use `[Amount]`.
- **Alternatives considered**: `v-html` was rejected as unsafe. Regularly stripping bracket tokens was rejected because it destroys meaning. Retaining raw placeholders was rejected by the accepted specification.

## Published model

- **Decision**: Replace a banner's `effectSummary` with `effectDescription` and `effectValues`. Each value record stores a source key, bilingual label, common/rare/legendary numbers, and a strict formatting object.
- **Rationale**: Descriptions and machine-readable values have different lifecycles and rendering needs. Keeping numeric facts as numbers allows localization-independent compact formatting and schema checks.
- **Alternatives considered**: Pre-rendered colored HTML in JSON was rejected as unsafe and presentation-coupled. Storing three display strings was rejected because it loses numeric validation and formatting provenance.

## Value presentation and accessibility

- **Decision**: Render tower-specific effects as a no-wrap `common/rare/legendary` sequence with neutral, blue, and gold foreground tokens. Render generalist, unique, and fusion effects as one uncolored, no-wrap fixed value. Provide a visible rarity key and a complete localized `aria-label` on each rarity sequence while hiding duplicated visual text from assistive technology.
- **Rationale**: Each classification now communicates only its real value semantics, survives narrow cards, and does not encode rarity identity by color alone. The selected rarity foreground tokens meet WCAG 2.2 AA contrast on the banner-card background.
- **Alternatives considered**: Repeating fixed values three times was rejected because it implies nonexistent rarity scaling. Labels beside every rarity number were rejected as unnecessarily wide. Color alone was rejected as inaccessible. Allowing individual values to wrap was rejected because it obscures the comparison.

## Release version

- **Decision**: Set the package and lockfile version to `1.0.0`, then regenerate checked-in release metadata with the existing release script.
- **Rationale**: `package.json` is the application's version source and the existing build already propagates it to visible and public metadata.
- **Alternatives considered**: Editing generated metadata alone was rejected because the next build would revert it.
