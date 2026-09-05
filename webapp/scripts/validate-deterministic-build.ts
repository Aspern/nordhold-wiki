import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { build } from "vite";

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

async function snapshot(directory: string): Promise<ReadonlyMap<string, string>> {
  const files = await listFiles(directory);
  return new Map(
    await Promise.all(
      files.map(
        async (path) =>
          [
            relative(directory, path).replaceAll("\\", "/"),
            createHash("sha256")
              .update(await readFile(path))
              .digest("hex"),
          ] as const,
      ),
    ),
  );
}

async function main(): Promise<void> {
  if (
    process.env.NORDHOLD_BUILD_DATE === undefined ||
    process.env.NORDHOLD_COMMIT_SHA === undefined
  ) {
    throw new Error("NORDHOLD_BUILD_DATE and NORDHOLD_COMMIT_SHA are required.");
  }
  const webappRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
  const configFile = resolve(webappRoot, "vite.config.ts");
  const distributionRoot = resolve(webappRoot, "dist");

  await build({ configFile });
  const first = await snapshot(distributionRoot);
  await build({ configFile });
  const second = await snapshot(distributionRoot);

  const paths = new Set([...first.keys(), ...second.keys()]);
  const differences = [...paths].filter((path) => first.get(path) !== second.get(path)).sort();
  if (differences.length > 0) {
    throw new Error(`Production build is not deterministic:\n- ${differences.join("\n- ")}`);
  }

  const totalBytes = (
    await Promise.all(
      (await listFiles(distributionRoot)).map(async (path) => (await readFile(path)).byteLength),
    )
  ).reduce((total, size) => total + size, 0);
  console.log(
    `Deterministic build valid: ${String(first.size)} files and ${String(totalBytes)} output bytes.`,
  );
}

await main();
