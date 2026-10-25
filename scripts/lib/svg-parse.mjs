/**
 * Minimal SVG helpers for the generate pipeline.
 */

/** @param {string} svg */
export function extractSvg(svg) {
  const text = String(svg)
    .replace(/^\uFEFF/, "")
    .replace(/<\?xml[\s\S]*?\?>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .trim();

  const open = text.match(/<svg\b([^>]*)>/i);
  if (!open) {
    return { viewBox: "0 0 24 24", body: text, attrs: {} };
  }

  const attrText = open[1] ?? "";
  /** @type {Record<string, string>} */
  const attrs = {};
  for (const m of attrText.matchAll(/([:@A-Za-z_][\w:.-]*)\s*=\s*("([^"]*)"|'([^']*)')/g)) {
    attrs[m[1].toLowerCase()] = m[3] ?? m[4] ?? "";
  }

  let viewBox = attrs.viewbox || "";
  if (!viewBox && attrs.width && attrs.height) {
    const w = Number.parseFloat(attrs.width);
    const h = Number.parseFloat(attrs.height);
    if (!Number.isNaN(w) && !Number.isNaN(h)) viewBox = `0 0 ${w} ${h}`;
  }
  if (!viewBox) viewBox = "0 0 24 24";

  const start = open.index + open[0].length;
  const end = text.toLowerCase().lastIndexOf("</svg>");
  const body = (end > start ? text.slice(start, end) : text.slice(start)).trim();

  return { viewBox, body, attrs };
}

/** Default stroke weight for general/Lucide icons (2 looked too heavy at gallery sizes). */
export const STROKE_WIDTH = 1.5;

/** @param {string} body */
export function wrapStrokeBody(body) {
  return `<g fill="none" stroke="currentColor" stroke-width="${STROKE_WIDTH}" stroke-linecap="round" stroke-linejoin="round">${body}</g>`;
}

/** @param {string} slug */
export function toPascal(slug) {
  return slug
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join("");
}

/** @param {string} name */
export function toComponentName(name) {
  let base = toPascal(name);
  if (!base) base = "Icon";
  // Avoid AdobeIconIcon when the file is already named adobe-icon.svg
  if (base.endsWith("Icon")) base = base.slice(0, -4);
  if (!base) base = "Icon";
  if (/^\d/.test(base)) base = `N${base}`;
  return `${base}Icon`;
}

/** @param {string} fileName */
export function slugFromFile(fileName) {
  return fileName.replace(/\.svg$/i, "").toLowerCase();
}

/** @param {string} value */
function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Scope ids + CSS classes at build time so the gallery does not pay this cost
 * on every scroll frame.
 * @param {string} markup
 * @param {string} scope  safe prefix (e.g. icon id)
 */
export function scopeSvgMarkup(markup, scope) {
  if (!markup) return markup;
  const prefix = `${scope}-`;
  let out = markup;

  out = out.replace(/\bid=(["'])([^"']+)\1/gi, (_m, q, id) => {
    if (String(id).startsWith(prefix)) return `id=${q}${id}${q}`;
    return `id=${q}${prefix}${id}${q}`;
  });

  out = out.replace(/url\((["']?)#([^)"']+)\1\)/gi, (_m, q, id) => {
    if (String(id).startsWith(prefix)) return `url(${q}#${id}${q})`;
    return `url(${q}#${prefix}${id}${q})`;
  });

  out = out.replace(/\bhref=(["'])#([^"']+)\1/gi, (_m, q, id) => {
    if (String(id).startsWith(prefix)) return `href=${q}#${id}${q}`;
    return `href=${q}#${prefix}${id}${q}`;
  });

  out = out.replace(/\bxlink:href=(["'])#([^"']+)\1/gi, (_m, q, id) => {
    if (String(id).startsWith(prefix)) return `xlink:href=${q}#${id}${q}`;
    return `xlink:href=${q}#${prefix}${id}${q}`;
  });

  /** @type {Set<string>} */
  const names = new Set();
  for (const m of out.matchAll(/\bclass(?:Name)?=(["'])([^"']*)\1/gi)) {
    for (const part of m[2].split(/\s+/)) if (part) names.add(part);
  }
  for (const style of out.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)) {
    for (const m of style[1].matchAll(/\.(-?[_a-zA-Z]+[_a-zA-Z0-9-]*)/g)) {
      names.add(m[1]);
    }
  }

  const classes = [...names].sort((a, b) => b.length - a.length);
  for (const name of classes) {
    if (!name || name.startsWith(prefix)) continue;
    const scoped = `${prefix}${name}`;
    out = out.replace(
      /\b(class(?:Name)?=)(["'])([^"']*)\2/gi,
      (_full, attr, q, value) => {
        const next = value
          .split(/\s+/)
          .map((part) => (part === name ? scoped : part))
          .join(" ");
        return `${attr}${q}${next}${q}`;
      },
    );
    out = out.replace(
      new RegExp(`\\.${escapeRegExp(name)}(?![\\w-])`, "g"),
      `.${scoped}`,
    );
  }

  return out;
}

/** @param {string} id */
export function safeScope(id) {
  // CSS class selectors cannot start with a digit (e.g. `.0xbtc-st0` is ignored
  // → paths fall back to black fill). Always prefix with a letter.
  // Also map special chars (btc++ → btcplusplus) so scopes stay unique.
  let cleaned = String(id)
    .replace(/\+/g, "plus")
    .replace(/[^a-zA-Z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  if (!cleaned) cleaned = "i";
  if (/^[0-9]/.test(cleaned)) cleaned = `i${cleaned}`;
  return cleaned;
}
