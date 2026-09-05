import idMap from "./id-map.json";
import provenance from "./provenance.json";
import wikiContent from "./wiki-content.json";
import { createContentRepository } from "./contentRepository.ts";
import type { ContentBundle } from "../types/content.ts";

export const wikiRepository = createContentRepository({
  content: wikiContent,
  provenance,
  idMap,
} as unknown as ContentBundle);
