/**
 * Curated Persian display names by catalog icon id.
 * Maps: apps, food, retail, mobility, media, org, brands under scripts/data/
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const MAP_PATHS = [
  join(root, "scripts", "data", "name-fa-apps.json"),
  join(root, "scripts", "data", "name-fa-food.json"),
  join(root, "scripts", "data", "name-fa-retail.json"),
  join(root, "scripts", "data", "name-fa-mobility.json"),
  join(root, "scripts", "data", "name-fa-media.json"),
  join(root, "scripts", "data", "name-fa-org.json"),
  join(root, "scripts", "data", "name-fa-brands.json"),
  join(root, "scripts", "data", "name-fa-finance.json"),
];

/** @type {Record<string, string> | null} */
let cache = null;

function loadAll() {
  if (cache) return cache;
  const map = {};
  for (const path of MAP_PATHS) {
    if (!existsSync(path)) continue;
    const raw = JSON.parse(readFileSync(path, "utf8"));
    for (const [k, v] of Object.entries(raw)) {
      if (k.startsWith("_")) continue;
      if (typeof v === "string" && v.trim()) map[k] = v.trim();
    }
  }
  cache = map;
  return cache;
}

/**
 * @param {string} iconId catalog id e.g. website-alibaba
 * @returns {string | undefined}
 */
export function nameFaForId(iconId) {
  const name = loadAll()[iconId];
  return name || undefined;
}
