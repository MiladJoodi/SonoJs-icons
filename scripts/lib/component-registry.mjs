/**
 * Global component-name registry across generate:* scripts (separate processes).
 * Preferred names never include source-pack labels.
 * Collisions get numeric suffixes: BrandIcon, Brand2Icon, …
 *
 * State is kept in memory and flushed once per generator (not per icon).
 */
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const REGISTRY_PATH = join(root, ".cache", "component-names.json");

/** @type {{ byId: Record<string, string>, byName: Record<string, string> } | null} */
let state = null;
let dirty = false;

/**
 * @returns {{ byId: Record<string, string>, byName: Record<string, string> }}
 */
function ensureLoaded() {
  if (state) return state;
  if (!existsSync(REGISTRY_PATH)) {
    state = { byId: {}, byName: {} };
    return state;
  }
  try {
    const raw = JSON.parse(readFileSync(REGISTRY_PATH, "utf8"));
    state = {
      byId: raw.byId ?? {},
      byName: raw.byName ?? {},
    };
  } catch {
    state = { byId: {}, byName: {} };
  }
  return state;
}

function markDirty() {
  dirty = true;
}

/** Persist in-memory claims (call at end of each generate:* script). */
export function flushComponentRegistry() {
  if (!state || !dirty) return;
  mkdirSync(dirname(REGISTRY_PATH), { recursive: true });
  writeFileSync(REGISTRY_PATH, JSON.stringify(state));
  dirty = false;
}

export function resetComponentRegistry() {
  state = { byId: {}, byName: {} };
  dirty = true;
  flushComponentRegistry();
}

/**
 * Drop prior claims for ids matching a predicate (re-run of one source).
 * @param {(id: string) => boolean} pred
 */
export function unregisterIds(pred) {
  const s = ensureLoaded();
  for (const [id, name] of Object.entries(s.byId)) {
    if (!pred(id)) continue;
    delete s.byId[id];
    if (s.byName[name] === id) delete s.byName[name];
    markDirty();
  }
}

/**
 * Ensure a valid JS identifier component name.
 * @param {string} name
 */
function asValidComponentName(name) {
  let n = name.endsWith("Icon") ? name : `${name}Icon`;
  if (!/^[A-Za-z_]/.test(n)) n = `N${n}`;
  return n;
}

/**
 * @param {string} preferred e.g. "ZarinpalIcon"
 * @param {string} iconId stable catalog id
 * @returns {string}
 */
export function claimComponentName(preferred, iconId) {
  const s = ensureLoaded();

  const existing = s.byId[iconId];
  if (existing) {
    // Drop stale / invalid JS identifiers (e.g. 40tikkeIcon) so we can rename.
    const valid = /^[A-Za-z_][\w$]*$/.test(existing);
    if (valid && s.byName[existing] === iconId) return existing;
    delete s.byId[iconId];
    if (s.byName[existing] === iconId) delete s.byName[existing];
    markDirty();
  }

  let name = asValidComponentName(preferred);
  const base = name.replace(/Icon$/i, "") || "Icon";

  if (!s.byName[name] || s.byName[name] === iconId) {
    s.byName[name] = iconId;
    s.byId[iconId] = name;
    markDirty();
    return name;
  }

  let n = 2;
  while (s.byName[`${base}${n}Icon`]) n += 1;
  name = `${base}${n}Icon`;
  s.byName[name] = iconId;
  s.byId[iconId] = name;
  markDirty();
  return name;
}

/**
 * PascalCase a kebab/snake slug → Digikala / BankMelli
 * @param {string} value
 */
export function pascalSlug(value) {
  return value
    .replace(/\.svg$/i, "")
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join("");
}

/**
 * Preferred export name from a brand slug (no source prefix).
 * @param {string} slug
 */
export function preferredIconName(slug) {
  return asValidComponentName(`${pascalSlug(slug)}Icon`);
}
