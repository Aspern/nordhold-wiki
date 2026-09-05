import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import Ajv2020 from "ajv/dist/2020.js";

import { validateReleaseMetadata, type ReleaseMetadata } from "../src/types/release.ts";

interface PackageManifest {
  readonly version?: unknown;
}

export interface GenerateReleaseOptions {
  readonly webappRoot: string;
  readonly buildDate: string;
  readonly commitSha: string;
}

async function writeAtomic(path: string, contents: string): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const temporaryPath = `${path}.${String(process.pid)}.tmp`;
  await writeFile(temporaryPath, contents, "utf8");
  await rename(temporaryPath, path);
}

function generatedModule(metadata: ReleaseMetadata): string {
  return `import type { ReleaseMetadata } from "../types/release.ts";\n\nexport const releaseMetadata = ${JSON.stringify(metadata, undefined, 2)} as const satisfies ReleaseMetadata;\n`;
}

export async function generateReleaseMetadata(
  options: GenerateReleaseOptions,
): Promise<ReleaseMetadata> {
  const packagePath = resolve(options.webappRoot, "package.json");
  const packageManifest = JSON.parse(await readFile(packagePath, "utf8")) as PackageManifest;
  if (typeof packageManifest.version !== "string") {
    throw new Error("package.json does not define a string version.");
  }

  const metadata = validateReleaseMetadata(
    {
      version: packageManifest.version,
      buildDate: options.buildDate,
      commitSha: options.commitSha,
    },
    packageManifest.version,
  );
  const schema = JSON.parse(
    await readFile(
      resolve(options.webappRoot, "src/content/schemas/release-metadata.schema.json"),
      "utf8",
    ),
  ) as object;
  const validateSchema = new Ajv2020({ allErrors: true, strict: true }).compile(schema);
  if (!validateSchema(metadata)) {
    throw new Error(
      `Release metadata violates its schema: ${JSON.stringify(validateSchema.errors)}`,
    );
  }

  await Promise.all([
    writeAtomic(resolve(options.webappRoot, "src/generated/release.ts"), generatedModule(metadata)),
    writeAtomic(
      resolve(options.webappRoot, "public/release.json"),
      `${JSON.stringify(metadata, undefined, 2)}\n`,
    ),
  ]);
  return metadata;
}

async function runCommandLine(): Promise<void> {
  const buildDate = process.env.NORDHOLD_BUILD_DATE;
  const commitSha = process.env.NORDHOLD_COMMIT_SHA;
  if (buildDate === undefined || commitSha === undefined) {
    throw new Error("NORDHOLD_BUILD_DATE and NORDHOLD_COMMIT_SHA are required.");
  }
  const scriptDirectory = dirname(fileURLToPath(import.meta.url));
  await generateReleaseMetadata({
    webappRoot: resolve(scriptDirectory, ".."),
    buildDate,
    commitSha,
  });
}

const commandPath = process.argv[1];
if (commandPath !== undefined && resolve(commandPath) === fileURLToPath(import.meta.url)) {
  await runCommandLine();
}
