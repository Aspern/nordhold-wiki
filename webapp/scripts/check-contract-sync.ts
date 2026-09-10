import { access, readdir, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(scriptDirectory, "../..");
const baselineContractDirectory = resolve(
  repositoryRoot,
  "specs/001-initial-wiki-platform/contracts",
);
const featureContractDirectory = resolve(
  repositoryRoot,
  "specs/002-banner-effect-details/contracts",
);
const schemaDirectory = resolve(scriptDirectory, "../src/content/schemas");

async function schemaNames(directory: string): Promise<string[]> {
  return (await readdir(directory))
    .filter((name) => name.endsWith(".schema.json"))
    .sort((left, right) => left.localeCompare(right, "en"));
}

export async function findContractDrift(): Promise<string[]> {
  const sourceNames = [
    ...new Set([
      ...(await schemaNames(baselineContractDirectory)),
      ...(await schemaNames(featureContractDirectory)),
    ]),
  ].sort((left, right) => left.localeCompare(right, "en"));
  const applicationNames = await schemaNames(schemaDirectory);
  const issues: string[] = [];

  if (sourceNames.join("\n") !== applicationNames.join("\n")) {
    issues.push(
      `Schema sets differ: contracts=[${sourceNames.join(", ")}], application=[${applicationNames.join(", ")}].`,
    );
  }

  for (const name of sourceNames) {
    if (!applicationNames.includes(name)) {
      continue;
    }

    const featureContract = resolve(featureContractDirectory, name);
    const featureContractExists = await access(featureContract)
      .then(() => true)
      .catch(() => false);
    const sourcePath = featureContractExists
      ? featureContract
      : resolve(baselineContractDirectory, name);
    const [source, application] = await Promise.all([
      readFile(sourcePath),
      readFile(resolve(schemaDirectory, name)),
    ]);

    if (!source.equals(application)) {
      issues.push(`${name} differs byte-for-byte from the accepted contract.`);
    }
  }

  return issues;
}

async function main(): Promise<void> {
  const issues = await findContractDrift();
  if (issues.length > 0) {
    for (const issue of issues) {
      console.error(issue);
    }
    process.exitCode = 1;
    return;
  }

  console.log("All application schemas match their accepted contracts byte-for-byte.");
}

const entryPoint = process.argv[1];
if (entryPoint !== undefined && resolve(entryPoint) === fileURLToPath(import.meta.url)) {
  await main();
}
