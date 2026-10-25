import { generatedDisplayMeta } from "./generated/display-meta";
import type { IconManifestEntry } from "./types";

/**
 * Topical display groups for gallery / sidebar.
 */
export type DisplayGroupId = string;

export interface DisplayGroupMeta {
  id: DisplayGroupId;
  labelFa: string;
  labelEn: string;
}

export const FEATURED_ICON_ORDER = [] as const;
export const FEATURED_ICON_IDS = new Set<string>(FEATURED_ICON_ORDER);

function titleFromSlug(slug: string): string {
  return slug
    .split(/[-_]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/**
 * Sidebar order:
 * 1. Crypto (own pack)
 * 2. Dev (own pack)
 * 3. General topical categories from icon metadata
 */
export const displayGroups: DisplayGroupMeta[] = [
  ...(generatedDisplayMeta.cryptoCount > 0
    ? [{ id: "crypto", labelFa: "Crypto", labelEn: "Crypto" }]
    : []),
  ...(generatedDisplayMeta.devCount > 0
    ? [{ id: "dev", labelFa: "Dev", labelEn: "Dev" }]
    : []),
  ...generatedDisplayMeta.generalCategories.map((id) => ({
    id,
    labelFa: titleFromSlug(id),
    labelEn: titleFromSlug(id),
  })),
];

export function getDisplayGroupId(entry: IconManifestEntry): DisplayGroupId {
  if (entry.source === "crypto" || entry.category === "crypto") return "crypto";
  if (entry.source === "dev" || entry.category === "dev") return "dev";
  return entry.category || "uncategorized";
}

export function getDisplayGroupMeta(
  id: DisplayGroupId,
): DisplayGroupMeta | undefined {
  return displayGroups.find((g) => g.id === id);
}
