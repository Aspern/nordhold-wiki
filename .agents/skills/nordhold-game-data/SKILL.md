---
name: nordhold-game-data
description: Extract structured tower, ability, banner, localization, and other gameplay facts from a local Nordhold Steam installation. Use for inspecting, inventorying, or refreshing game-derived wiki facts; do not use to copy media assets or modify the game installation.
metadata:
  author: nordhold-wiki
---

# Extract Nordhold Game Data

Recover structured facts from the installed game while preserving provenance and
keeping the game installation read-only. Use the bundled
`scripts/extract_game_data.py` instead of recreating the Unity parser.

## Authorization and Safety

- Reading the local game installation and Steam manifest is allowed when the
  user places them in scope.
- Never call UnityPy mutation APIs such as `patch()`, `save()`, or
  `set_raw_data()`.
- UnityPy and TypeTreeGeneratorAPI are third-party dependencies. If they are not
  already available, stop and obtain explicit approval before installing them.
- After approval, install dependencies only in a disposable virtual environment
  outside the repository. Record their resolved versions in the result.
- Keep raw dumps outside the repository. Do not extract or publish artwork,
  audio, binaries, or bulk copyrighted text.

## Workflow

1. Resolve the game root from the user's input. On the standard Windows Steam
   installation it is
   `C:\Program Files (x86)\Steam\steamapps\common\Nordhold`.
2. Confirm that `NordHold_Data/resources.assets`, `NordHold_Data/level2`,
   `GameAssembly.dll`, and
   `NordHold_Data/il2cpp_data/Metadata/global-metadata.dat` exist. Read
   `steamapps/appmanifest_3028310.acf` for the installed build ID.
3. Check whether the required modules are already importable. If not, request
   approval. A suitable approved setup is:

   ```powershell
   $workDir = Join-Path ([IO.Path]::GetTempPath()) ("nordhold-extract-" + [guid]::NewGuid())
   py -m venv (Join-Path $workDir "venv")
   & (Join-Path $workDir "venv\Scripts\python.exe") -m pip install UnityPy TypeTreeGeneratorAPI
   ```

4. Run the extractor from the repository root. It detects the Unity version and
   writes a build-specific JSON dump to the operating-system temp directory:

   ```powershell
   & $python .agents/skills/nordhold-game-data/scripts/extract_game_data.py `
     --game-root "C:\Program Files (x86)\Steam\steamapps\common\Nordhold"
   ```

   Set `$python` to the approved environment's Python executable. Use repeated
   `--source` or `--keyword` options only when the initial result shows they are
   needed. Run `--help` for details.

5. Use localization terms for display names and descriptions. Follow banner
   manager references in `level2` before declaring an asset active; raw assets
   include obsolete and duplicate definitions.
6. Report the build ID, Unity version, source asset, object path ID, internal
   key, localization language, tool versions, parse errors, and any uncertainty.

## Current Validation Baseline

Direct inspection of Steam build `23261523` found Unity `2023.1.22f1`, nine
towers, 57 normal banner titles, 36 fusion banner titles, and 3 generalist banner
titles. The nine tower display names are Arc Tower, Arrow Tower, Frost Tower,
Volcano Mortar, Shadow Tower, Runestone Tower, Tornado Tower, Raven Tower, and
Chaos Reaper. An obsolete `Thor's Wrath - Old` banner is present.

Use these values only as completeness diagnostics for that build. Re-run the
extraction after every build change and never reuse serialized offsets or path
IDs across builds. If the result differs, inspect parser errors and runtime
references instead of forcing it to match the baseline.

Before importing facts into `webapp/`, use the Spec Kit workflow to define the
wiki JSON schema and normalization rules. Publish independently worded summaries
unless copying source text has been explicitly authorized.
