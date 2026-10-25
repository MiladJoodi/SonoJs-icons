/**
 * Look up curated brandColors for catalog icon ids.
 * Maps: payments, apps, food, retail, mobility, media, org, utility, brands under scripts/data/
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const MAP_PATHS = [
  join(root, "scripts", "data", "brand-colors-finance.json"),
  join(root, "scripts", "data", "brand-colors-payments.json"),
  join(root, "scripts", "data", "brand-colors-apps.json"),
  join(root, "scripts", "data", "brand-colors-food.json"),
  join(root, "scripts", "data", "brand-colors-retail.json"),
  join(root, "scripts", "data", "brand-colors-mobility.json"),
  join(root, "scripts", "data", "brand-colors-media.json"),
  join(root, "scripts", "data", "brand-colors-org.json"),
  join(root, "scripts", "data", "brand-colors-utility.json"),
  join(root, "scripts", "data", "brand-colors-brands.json"),
];

/** @type {Record<string, string[]> | null} */
let cache = null;

function loadAll() {
  if (cache) return cache;
  const map = {};
  for (const path of MAP_PATHS) {
    if (!existsSync(path)) continue;
    const raw = JSON.parse(readFileSync(path, "utf8"));
    for (const [k, v] of Object.entries(raw)) {
      if (k.startsWith("_")) continue;
      if (Array.isArray(v) && v.length > 0) map[k] = v;
    }
  }
  cache = map;
  return cache;
}

/**
 * @param {string} iconId catalog id e.g. gateway-idpay
 * @returns {string[] | undefined}
 */
export function brandColorsFor(iconId) {
  const colors = loadAll()[iconId];
  return colors?.length ? colors : undefined;
}

/**
 * Spread into a catalog entry object when colors exist.
 * @param {string} iconId
 * @returns {{ brandColors: string[] } | Record<string, never>}
 */
export function brandColorsField(iconId) {
  const colors = brandColorsFor(iconId);
  return colors ? { brandColors: colors } : {};
}
