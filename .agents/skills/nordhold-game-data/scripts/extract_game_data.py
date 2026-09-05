#!/usr/bin/env python3
"""Read selected Nordhold MonoBehaviours into a provenance-rich JSON dump."""

from __future__ import annotations

import argparse
from datetime import datetime, timezone
from importlib import metadata
import json
from pathlib import Path
import re
import sys
import tempfile
from typing import Any


APP_ID = "3028310"
DEFAULT_GAME_ROOT = Path(
    r"C:\Program Files (x86)\Steam\steamapps\common\Nordhold"
)
DEFAULT_SOURCES = (
    Path("NordHold_Data/resources.assets"),
    Path("NordHold_Data/level2"),
)
DEFAULT_KEYWORDS = (
    "tower",
    "banner",
    "abilit",
    "skill",
    "rogue",
    # Current banner implementations are not consistently named *RogueData.
    # Several active tower, fusion, and generalist banner types use only a
    # domain-specific *Data suffix, so this broader selector is required for a
    # complete fact inventory. Raw output remains temporary and review-gated.
    "data",
    "localization",
    "languagesource",
)
EXCLUDED_UI_CLASSES = {
    "AllTowerFusionsInfo": "Fusion Matrix presentation helper; it is not a gameplay fact source",
}
REQUIRED_FILES = (
    Path("NordHold_Data/resources.assets"),
    Path("NordHold_Data/level2"),
    Path("GameAssembly.dll"),
    Path("NordHold_Data/il2cpp_data/Metadata/global-metadata.dat"),
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Extract relevant read-only MonoBehaviour records from a local "
            "Nordhold installation."
        )
    )
    parser.add_argument(
        "--game-root",
        type=Path,
        default=DEFAULT_GAME_ROOT,
        help=f"Nordhold installation directory (default: {DEFAULT_GAME_ROOT})",
    )
    parser.add_argument(
        "--source",
        action="append",
        type=Path,
        help=(
            "Asset path relative to the game root; repeat to override the "
            "default resources.assets and level2 sources"
        ),
    )
    parser.add_argument(
        "--keyword",
        action="append",
        help="Case-insensitive record filter; repeat to override defaults",
    )
    parser.add_argument(
        "--output",
        type=Path,
        help="Output JSON path; defaults to a build-specific file in TEMP",
    )
    return parser.parse_args()


def fail(message: str) -> None:
    raise SystemExit(f"error: {message}")


def is_within(path: Path, directory: Path) -> bool:
    try:
        path.relative_to(directory)
    except ValueError:
        return False
    return True


def find_repository_root(start: Path) -> Path | None:
    for candidate in (start, *start.parents):
        if (candidate / ".git").exists():
            return candidate
    return None


def read_build_id(game_root: Path) -> str:
    manifest = game_root.parent.parent / f"appmanifest_{APP_ID}.acf"
    if not manifest.is_file():
        return "unknown"

    match = re.search(
        r'"buildid"\s+"(?P<build_id>\d+)"',
        manifest.read_text(encoding="utf-8", errors="replace"),
    )
    return match.group("build_id") if match else "unknown"


def detect_unity_version(environments: list[tuple[Path, Any]]) -> str:
    versions = {
        version
        for _, environment in environments
        for obj in environment.objects
        if (version := getattr(obj.assets_file, "unity_version", None))
    }
    if not versions:
        fail("could not detect a Unity version from the selected assets")
    if len(versions) != 1:
        fail(f"selected assets report multiple Unity versions: {sorted(versions)}")
    return versions.pop()


def package_version(distribution: str) -> str:
    try:
        return metadata.version(distribution)
    except metadata.PackageNotFoundError:
        return "unknown"


def main() -> int:
    args = parse_args()
    game_root = args.game_root.resolve()
    if not game_root.is_dir():
        fail(f"game root does not exist: {game_root}")

    missing = [str(path) for path in REQUIRED_FILES if not (game_root / path).is_file()]
    if missing:
        fail(f"required game files are missing: {', '.join(missing)}")

    try:
        import UnityPy
        from UnityPy.helpers.TypeTreeGenerator import TypeTreeGenerator
    except ImportError:
        fail(
            "UnityPy and TypeTreeGeneratorAPI are required; obtain dependency "
            "approval before installing them"
        )

    relative_sources = tuple(args.source) if args.source else DEFAULT_SOURCES
    sources = [(game_root / source).resolve() for source in relative_sources]
    outside_root = [str(source) for source in sources if not is_within(source, game_root)]
    if outside_root:
        fail(f"source paths must remain inside the game root: {', '.join(outside_root)}")
    missing_sources = [str(source) for source in sources if not source.is_file()]
    if missing_sources:
        fail(f"source assets do not exist: {', '.join(missing_sources)}")

    environments = [(source, UnityPy.load(str(source))) for source in sources]
    unity_version = detect_unity_version(environments)
    build_id = read_build_id(game_root)
    keywords = tuple(keyword.lower() for keyword in (args.keyword or DEFAULT_KEYWORDS))

    generator = TypeTreeGenerator(unity_version, generator="AssetStudio")
    generator.load_local_game(str(game_root))

    records: list[dict[str, Any]] = []
    parse_errors: list[dict[str, Any]] = []
    excluded_records: list[dict[str, Any]] = []
    for source, environment in environments:
        relative_source = source.relative_to(game_root).as_posix()
        for obj in environment.objects:
            if obj.type.name != "MonoBehaviour":
                continue
            try:
                name = obj.peek_name()
                monobehaviour = obj.parse_monobehaviour_head()
                script = monobehaviour.m_Script.deref_parse_as_object()
                script_identity = " ".join(
                    (
                        script.m_AssemblyName,
                        script.m_Namespace,
                        script.m_ClassName,
                    )
                )
            except Exception as error:
                parse_errors.append(
                    {
                        "source": relative_source,
                        "path_id": (
                            str(path_id)
                            if (path_id := getattr(obj, "path_id", None)) is not None
                            else None
                        ),
                        "error_type": type(error).__name__,
                        "error": f"failed to inspect record name: {error}",
                    }
                )
                continue

            searchable_identity = script_identity.lower()
            if not any(keyword in searchable_identity for keyword in keywords):
                continue
            if script.m_ClassName in EXCLUDED_UI_CLASSES:
                excluded_records.append(
                    {
                        "source": relative_source,
                        "path_id": str(obj.path_id),
                        "name": name,
                        "script_class": script.m_ClassName,
                        "reason": EXCLUDED_UI_CLASSES[script.m_ClassName],
                    }
                )
                continue
            environment.typetree_generator = generator
            try:
                data = obj.parse_as_dict()
            except Exception as error:  # Preserve failures for completeness review.
                parse_errors.append(
                    {
                        "source": relative_source,
                        "path_id": (
                            str(path_id)
                            if (path_id := getattr(obj, "path_id", None)) is not None
                            else None
                        ),
                        "error_type": type(error).__name__,
                        "error": str(error),
                    }
                )
                continue
            finally:
                environment.typetree_generator = None

            records.append(
                {
                    "source": relative_source,
                    "path_id": (
                        str(path_id)
                        if (path_id := getattr(obj, "path_id", None)) is not None
                        else None
                    ),
                    "name": name,
                    "script": {
                        "assembly": script.m_AssemblyName,
                        "namespace": script.m_Namespace,
                        "class": script.m_ClassName,
                    },
                    "data": data,
                }
            )

    output = args.output or (
        Path(tempfile.gettempdir())
        / f"nordhold-monobehaviours-{build_id}.json"
    )
    output = output.resolve()
    repository_root = find_repository_root(Path(__file__).resolve())
    if is_within(output, game_root):
        fail("output must not be written inside the game installation")
    if repository_root and is_within(output, repository_root):
        fail("raw extraction output must remain outside the repository")
    if output.exists():
        fail(f"refusing to overwrite existing output: {output}")

    output.parent.mkdir(parents=True, exist_ok=True)
    result = {
        "provenance": {
            "steam_app_id": APP_ID,
            "steam_build_id": build_id,
            "unity_version": unity_version,
            "game_root": str(game_root),
            "sources": [source.relative_to(game_root).as_posix() for source in sources],
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "tool_versions": {
                "UnityPy": package_version("UnityPy"),
                "TypeTreeGeneratorAPI": package_version("TypeTreeGeneratorAPI"),
            },
            "python_version": ".".join(str(part) for part in sys.version_info[:3]),
            "keywords": list(keywords),
        },
        "record_count": len(records),
        "parse_error_count": len(parse_errors),
        "excluded_record_count": len(excluded_records),
        "records": records,
        "parse_errors": parse_errors,
        "excluded_records": excluded_records,
    }
    output.write_text(
        json.dumps(result, ensure_ascii=False, indent=2, default=str),
        encoding="utf-8",
    )
    print(output)
    return 0


if __name__ == "__main__":
    sys.exit(main())
