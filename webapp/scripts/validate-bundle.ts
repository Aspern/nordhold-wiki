import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { extname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { validateReleaseMetadata } from "../src/types/release.ts";

interface BundleManifest {
  readonly schemaVersion: string;
  readonly version: string;
  readonly buildDate: string;
  readonly commitSha: string;
  readonly validTowerRoute: string;
  readonly files: readonly { readonly path: string; readonly sha256: string }[];
}

interface TowerSpriteManifest {
  readonly publicationAuthorized: boolean;
  readonly files: readonly { readonly sha256: string }[];
}

async function listFiles(directory: string): Promise<readonly string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  return (
    await Promise.all(
      entries.map((entry) => {
        const path = resolve(directory, entry.name);
        return entry.isDirectory() ? listFiles(path) : Promise.resolve([path]);
      }),
    )
  ).flat();
}

function sha256(contents: Uint8Array): string {
  return createHash("sha256").update(contents).digest("hex");
}

function parseUnknownJson(value: string): unknown {
  return JSON.parse(value) as unknown;
}

async function main(): Promise<void> {
  const webappRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
  const distributionRoot = resolve(webappRoot, "dist");
  const issues: string[] = [];
  const [packageManifest, release, manifest, sprites, sourceContent] = await Promise.all([
    readFile(resolve(webappRoot, "package.json"), "utf8").then(
      (value) => JSON.parse(value) as { readonly version: string },
    ),
    readFile(resolve(distributionRoot, "release.json"), "utf8").then(parseUnknownJson),
    readFile(resolve(distributionRoot, "bundle-manifest.json"), "utf8").then(
      (value) => JSON.parse(value) as BundleManifest,
    ),
    readFile(
      resolve(webappRoot, "src/assets/entities/towers/extraction-manifest.json"),
      "utf8",
    ).then((value) => JSON.parse(value) as TowerSpriteManifest),
    readFile(resolve(webappRoot, "src/content/wiki-content.json")),
  ]);
  const validatedRelease = validateReleaseMetadata(release, packageManifest.version);
  if (
    manifest.schemaVersion !== "1.0.0" ||
    manifest.version !== validatedRelease.version ||
    manifest.buildDate !== validatedRelease.buildDate ||
    manifest.commitSha !== validatedRelease.commitSha
  ) {
    issues.push("Bundle manifest and release metadata differ.");
  }
  if (!/^\/towers\/[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(manifest.validTowerRoute)) {
    issues.push("Bundle manifest has no valid tower route.");
  }
  if (!sprites.publicationAuthorized) {
    issues.push("Tower sprite publication authorization is absent.");
  }

  const builtContent = await readFile(resolve(distributionRoot, "content/wiki-content.json"));
  if (!builtContent.equals(sourceContent)) {
    issues.push("Built wiki content differs from the validated source JSON.");
  }

  const approvedImageDigests = new Set(sprites.files.map((file) => file.sha256));
  const files = (await listFiles(distributionRoot)).filter(
    (path) => relative(distributionRoot, path).replaceAll("\\", "/") !== "bundle-manifest.json",
  );
  const actualByPath = new Map(
    await Promise.all(
      files.map(async (path) => {
        const bundlePath = relative(distributionRoot, path).replaceAll("\\", "/");
        return [bundlePath, sha256(await readFile(path))] as const;
      }),
    ),
  );
  const declaredByPath = new Map(manifest.files.map((file) => [file.path, file.sha256]));
  for (const [path, digest] of actualByPath) {
    if (declaredByPath.get(path) !== digest) {
      issues.push(`Manifest checksum is missing or incorrect for '${path}'.`);
    }
    const extension = extname(path).toLowerCase();
    if ([".map", ".tfstate", ".tfplan", ".zip", ".exe", ".dll"].includes(extension)) {
      issues.push(`Forbidden artifact '${path}' is present.`);
    }
    if (extension === ".png" && !approvedImageDigests.has(digest)) {
      issues.push(`Unapproved image '${path}' is present.`);
    }
    if ([".html", ".css", ".js", ".json"].includes(extension)) {
      const text = await readFile(resolve(distributionRoot, path), "utf8");
      if (/C:\\Users\\|\/Users\/|\/home\/|steamapps/iu.test(text)) {
        issues.push(`Artifact '${path}' exposes a local or raw extraction path.`);
      }
      if (
        /AKIA[0-9A-Z]{16}|BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY|aws_secret_access_key/iu.test(
          text,
        )
      ) {
        issues.push(`Artifact '${path}' resembles a committed secret.`);
      }
      if (/(?:<script[^>]+src|<link[^>]+href|@import|url\()[^\n)]*https?:\/\//iu.test(text)) {
        issues.push(`Artifact '${path}' references a remote script, font, or stylesheet.`);
      }
    }
  }
  for (const path of declaredByPath.keys()) {
    if (!actualByPath.has(path)) {
      issues.push(`Manifest declares missing artifact '${path}'.`);
    }
  }
  if (actualByPath.size !== declaredByPath.size) {
    issues.push("Bundle file count differs from the manifest.");
  }
  if (issues.length > 0) {
    throw new Error(`Bundle validation failed:\n- ${issues.sort().join("\n- ")}`);
  }
  const totalBytes = (
    await Promise.all(files.map(async (path) => (await readFile(path)).byteLength))
  ).reduce((total, size) => total + size, 0);
  console.log(
    `Bundle policy valid: ${String(files.length)} files, ${String(totalBytes)} bytes, release ${validatedRelease.version}.`,
  );
}

await main();
