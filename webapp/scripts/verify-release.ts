import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { validateReleaseMetadata } from "../src/types/release.ts";

interface BundleManifest {
  readonly version: string;
  readonly buildDate: string;
  readonly commitSha: string;
  readonly validTowerRoute: string;
}

function requiredArgument(name: string): string {
  const index = process.argv.indexOf(name);
  const value = index < 0 ? undefined : process.argv[index + 1];
  if (value === undefined) {
    throw new Error(`Missing required argument ${name}.`);
  }
  return value;
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((accept) => setTimeout(accept, milliseconds));
}

async function fetchWithRetry(
  url: URL,
  redirect: "follow" | "manual" = "follow",
): Promise<Response> {
  let finalError: unknown;
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      const response = await fetch(url, {
        redirect,
        signal: AbortSignal.timeout(10_000),
      });
      if (response.ok || redirect === "manual") {
        return response;
      }
      finalError = new Error(`${url.href} returned HTTP ${String(response.status)}.`);
    } catch (error) {
      finalError = error;
    }
    if (attempt < 4) {
      await delay(attempt * 2_000);
    }
  }
  throw finalError instanceof Error ? finalError : new Error(`Request failed for ${url.href}.`);
}

function requireContentType(response: Response, expected: string): void {
  const actual = response.headers.get("content-type")?.toLowerCase() ?? "";
  if (!actual.includes(expected)) {
    throw new Error(
      `${response.url} returned content type '${actual || "missing"}', expected '${expected}'.`,
    );
  }
}

async function main(): Promise<void> {
  const baseUrl = new URL(requiredArgument("--base-url"));
  if (baseUrl.protocol !== "https:" || baseUrl.pathname !== "/") {
    throw new Error("--base-url must be a trusted HTTPS origin ending at its root path.");
  }
  const manifest = JSON.parse(
    await readFile(resolve(requiredArgument("--manifest")), "utf8"),
  ) as BundleManifest;
  const expectedRelease = validateReleaseMetadata(manifest);
  if (!/^\/towers\/[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(manifest.validTowerRoute)) {
    throw new Error("Bundle manifest does not provide a valid stable tower route.");
  }

  const rootResponse = await fetchWithRetry(baseUrl);
  requireContentType(rootResponse, "text/html");

  const releaseResponse = await fetchWithRetry(new URL("release.json", baseUrl));
  requireContentType(releaseResponse, "application/json");
  const actualRelease = validateReleaseMetadata(await releaseResponse.json());
  if (
    actualRelease.version !== expectedRelease.version ||
    actualRelease.commitSha !== expectedRelease.commitSha
  ) {
    throw new Error("Published release version or commit SHA differs from the promoted bundle.");
  }

  const towerResponse = await fetchWithRetry(new URL(manifest.validTowerRoute, baseUrl));
  requireContentType(towerResponse, "text/html");

  const httpUrl = new URL(baseUrl);
  httpUrl.protocol = "http:";
  const redirectResponse = await fetchWithRetry(httpUrl, "manual");
  if (![301, 302, 307, 308].includes(redirectResponse.status)) {
    throw new Error(
      `HTTP entry point did not redirect; status was ${String(redirectResponse.status)}.`,
    );
  }
  const location = redirectResponse.headers.get("location");
  if (location === null || new URL(location, httpUrl).protocol !== "https:") {
    throw new Error("HTTP entry point did not redirect to HTTPS.");
  }

  console.log(
    `Verified release ${actualRelease.version} (${actualRelease.commitSha}) at ${baseUrl.origin}.`,
  );
}

await main();
