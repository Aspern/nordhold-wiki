import type { SupportedLocale } from "../types/content.ts";
import type { ReleaseMetadata } from "../types/release.ts";

export interface HeaderLabels {
  readonly title: string;
  readonly attribution: string;
  readonly version: string;
  readonly published: string;
}

export interface HeaderModel {
  readonly title: string;
  readonly attribution: string;
  readonly version: string;
  readonly published: string;
  readonly raw: ReleaseMetadata;
}

export function formatBuildDate(buildDate: string, locale: SupportedLocale): string {
  const date = new Date(`${buildDate}T00:00:00Z`);
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function createHeaderModel(
  metadata: ReleaseMetadata,
  locale: SupportedLocale,
  labels: HeaderLabels,
): HeaderModel {
  return {
    title: labels.title,
    attribution: labels.attribution,
    version: `${labels.version} ${metadata.version}`,
    published: `${labels.published} ${formatBuildDate(metadata.buildDate, locale)}`,
    raw: metadata,
  };
}
