import {
  cryptoCategories,
  cryptoManifest,
} from "./generated/crypto/catalog";
import { devCategories, devManifest } from "./generated/dev/catalog";
import {
  generalCategories,
  generalManifest,
} from "./generated/general/catalog";
import type { IconCategoryMeta, IconManifestEntry } from "./types";

/**
 * Full catalog of icons shipped in this package.
 */
export const iconManifest: IconManifestEntry[] = [
  ...cryptoManifest,
  ...devManifest,
  ...generalManifest,
];

export const iconCategories: IconCategoryMeta[] = [
  ...cryptoCategories,
  ...devCategories,
  ...generalCategories,
];

export function getIconManifestEntry(
  idOrComponent: string,
): IconManifestEntry | undefined {
  return iconManifest.find(
    (entry) =>
      entry.id === idOrComponent || entry.componentName === idOrComponent,
  );
}

export function getCategoryMeta(
  id: string,
): IconCategoryMeta | undefined {
  return iconCategories.find((c) => c.id === id);
}
