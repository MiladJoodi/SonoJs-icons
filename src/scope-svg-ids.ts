/**
 * Scope SVG fragment ids AND CSS classes so gradients/clipPaths/Illustrator
 * `.st0` styles stay unique when many inline icons share one HTML document.
 */

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Collect class names from class="" / className="" attributes and from
 * simple `.foo` selectors inside <style> blocks.
 */
function collectClassNames(markup: string): string[] {
  const names = new Set<string>();
  for (const m of markup.matchAll(/\bclass(?:Name)?=(["'])([^"']*)\1/gi)) {
    for (const part of m[2].split(/\s+/)) {
      if (part) names.add(part);
    }
  }
  for (const style of markup.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)) {
    const css = style[1];
    for (const m of css.matchAll(/\.(-?[_a-zA-Z]+[_a-zA-Z0-9-]*)/g)) {
      names.add(m[1]);
    }
  }
  return [...names];
}

export function scopeSvgMarkup(markup: string, scope: string): string {
  if (!markup) return markup;
  const prefix = `${scope}-`;

  let out = markup;

  // 1) Scope id="…"
  out = out.replace(/\bid=(["'])([^"']+)\1/gi, (_m, q: string, id: string) => {
    if (id.startsWith(prefix)) return `id=${q}${id}${q}`;
    return `id=${q}${prefix}${id}${q}`;
  });

  // 2) Scope url(#…) everywhere (attributes + CSS inside <style>)
  out = out.replace(
    /url\((["']?)#([^)"']+)\1\)/gi,
    (_m, q: string, id: string) => {
      if (id.startsWith(prefix)) return `url(${q}#${id}${q})`;
      return `url(${q}#${prefix}${id}${q})`;
    },
  );

  // 3) Scope href="#…" / xlink:href="#…"
  out = out.replace(/\bhref=(["'])#([^"']+)\1/gi, (_m, q: string, id: string) => {
    if (id.startsWith(prefix)) return `href=${q}#${id}${q}`;
    return `href=${q}#${prefix}${id}${q}`;
  });
  out = out.replace(
    /\bxlink:href=(["'])#([^"']+)\1/gi,
    (_m, q: string, id: string) => {
      if (id.startsWith(prefix)) return `xlink:href=${q}#${id}${q}`;
      return `xlink:href=${q}#${prefix}${id}${q}`;
    },
  );

  // 4) Scope CSS class names (Illustrator .st0 collisions)
  const classes = collectClassNames(out);
  // Longest first so `st10` is not partially rewritten by `st1`
  classes.sort((a, b) => b.length - a.length);
  for (const name of classes) {
    if (!name || name.startsWith(prefix)) continue;
    const scoped = `${prefix}${name}`;
    out = out.replace(
      /\b(class(?:Name)?=)(["'])([^"']*)\2/gi,
      (_full, attr: string, q: string, value: string) => {
        const next = value
          .split(/\s+/)
          .map((part) => (part === name ? scoped : part))
          .join(" ");
        return `${attr}${q}${next}${q}`;
      },
    );
    const reSelector = new RegExp(`\\.${escapeRegExp(name)}(?![\\w-])`, "g");
    out = out.replace(reSelector, `.${scoped}`);
  }

  return out;
}

/** Sanitize React useId() / any string into a safe SVG id / CSS class prefix. */
export function svgIdScope(raw: string): string {
  let cleaned = raw
    .replace(/\+/g, "plus")
    .replace(/[^a-zA-Z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  if (!cleaned) cleaned = "i";
  // CSS selectors like `.0xbtc-st0` are invalid — force a leading letter.
  if (/^[0-9]/.test(cleaned)) cleaned = `i${cleaned}`;
  return cleaned;
}

/**
 * Force a colored brand SVG to follow `currentColor` (true mono / tintable).
 */
export function toMonoSvgMarkup(markup: string): string {
  if (!markup) return markup;
  let out = markup;

  // Drop Illustrator style blocks — they fight currentColor with hard-coded fills.
  out = out.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "");

  // Gradients / patterns can't be mono-tinted reliably; drop defs paints.
  out = out.replace(/<(linear|radial)Gradient\b[\s\S]*?<\/\1Gradient>/gi, "");
  out = out.replace(/<pattern\b[\s\S]*?<\/pattern>/gi, "");

  out = out.replace(/\sfill="url\([^"]*\)"/gi, ' fill="currentColor"');
  out = out.replace(/\sfill='url\([^']*\)'/gi, " fill='currentColor'");
  out = out.replace(/\sfill="(?!none\b)[^"]*"/gi, ' fill="currentColor"');
  out = out.replace(/\sfill='(?!none\b)[^']*'/gi, " fill='currentColor'");

  out = out.replace(/\sstroke="url\([^"]*\)"/gi, ' stroke="currentColor"');
  out = out.replace(/\sstroke='url\([^']*\)'/gi, " stroke='currentColor'");
  out = out.replace(/\sstroke="(?!none\b)#[^"]*"/gi, ' stroke="currentColor"');
  out = out.replace(/\sstroke='(?!none\b)#[^']*'/gi, " stroke='currentColor'");

  // If nothing paints with currentColor yet, wrap so paths inherit it.
  if (!/currentColor/i.test(out)) {
    out = `<g fill="currentColor">${out}</g>`;
  }

  return out;
}
