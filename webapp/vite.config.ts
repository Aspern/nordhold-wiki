import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { relative, resolve } from "node:path";
import { fileURLToPath, URL } from "node:url";

import vue from "@vitejs/plugin-vue";
import { defineConfig, type Plugin } from "vite";
import vuetify from "vite-plugin-vuetify";

import { generateReleaseMetadata } from "./scripts/generate-release-metadata.ts";
import type { ReleaseMetadata } from "./src/types/release.ts";

const webappRoot = fileURLToPath(new URL(".", import.meta.url));

async function listFiles(directory: string): Promise<readonly string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => {
      const path = resolve(directory, entry.name);
      return entry.isDirectory() ? listFiles(path) : Promise.resolve([path]);
    }),
  );
  return nested.flat();
}

function currentCommitSha(): string {
  return execFileSync("git", ["rev-parse", "HEAD"], {
    cwd: resolve(webappRoot, ".."),
    encoding: "utf8",
  }).trim();
}

function releaseInputs(command: "build" | "serve"): {
  readonly buildDate: string;
  readonly commitSha: string;
} {
  const buildDate = process.env.NORDHOLD_BUILD_DATE;
  const commitSha = process.env.NORDHOLD_COMMIT_SHA;
  if (command === "build" && (buildDate === undefined || commitSha === undefined)) {
    throw new Error("Production builds require NORDHOLD_BUILD_DATE and NORDHOLD_COMMIT_SHA.");
  }

  return {
    buildDate: buildDate ?? new Date().toISOString().slice(0, 10),
    commitSha: commitSha ?? currentCommitSha(),
  };
}

function releaseArtifactPlugin(metadata: ReleaseMetadata): Plugin {
  const outputDirectory = resolve(webappRoot, "dist");
  return {
    name: "nordhold-release-artifact",
    apply: "build",
    async generateBundle() {
      const content = await readFile(resolve(webappRoot, "src/content/wiki-content.json"), "utf8");
      this.emitFile({ type: "asset", fileName: "content/wiki-content.json", source: content });
    },
    async writeBundle() {
      const content = JSON.parse(
        await readFile(resolve(webappRoot, "src/content/wiki-content.json"), "utf8"),
      ) as { readonly towers?: readonly { readonly id?: unknown }[] };
      const firstTowerId = content.towers?.[0]?.id;
      if (typeof firstTowerId !== "string") {
        throw new Error("The built content has no stable tower route for the bundle manifest.");
      }
      const files = (await listFiles(outputDirectory))
        .filter((path) => !path.endsWith("bundle-manifest.json"))
        .sort((left, right) => left.localeCompare(right, "en"));
      const checksums = await Promise.all(
        files.map(async (path) => ({
          path: relative(outputDirectory, path).replaceAll("\\", "/"),
          sha256: createHash("sha256")
            .update(await readFile(path))
            .digest("hex"),
        })),
      );
      const manifest = {
        schemaVersion: "1.0.0",
        ...metadata,
        validTowerRoute: `/towers/${firstTowerId}`,
        files: checksums,
      };
      await writeFile(
        resolve(outputDirectory, "bundle-manifest.json"),
        `${JSON.stringify(manifest, undefined, 2)}\n`,
        "utf8",
      );
    },
  };
}

export default defineConfig(async ({ command }) => {
  const inputs = releaseInputs(command);
  const metadata = await generateReleaseMetadata({ webappRoot, ...inputs });

  return {
    plugins: [
      vue(),
      vuetify({
        autoImport: true,
      }),
      releaseArtifactPlugin(metadata),
    ],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    build: {
      sourcemap: false,
      assetsInlineLimit: 0,
    },
  };
});
