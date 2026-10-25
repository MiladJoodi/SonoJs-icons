/**
 * Find crypto/dev icons that disappear or look bad on a dark gallery background.
 *
 * Rules (from user-flagged samples: xrp, dot, qnt, btu, ess, snm, xsn,
 * anthropic-icon, architect-icon, crystal):
 *  1. Paths with no fill → treated as black (SVG default)
 *  2. All paint colors very dark (L < 0.35) → flag
 *  3. Any near-black paint (L < 0.18) even alongside bright colors → flag
 *     (e.g. Polkadot: black discs + pink vanish partially)
 *
 * Scope: assets/crypto + assets/dev only (not general/Lucide).
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

/**
 * A color is "bad on dark UI" when it blends into ~#09090b tiles:
 * - near-black / charcoal (any hue but extremely dark), OR
 * - dark neutral / navy-ish with low chroma (not vivid brand red/blue).
 * Vivid #ed001b / #fc0016 stay visible → must NOT flag.
 */
const NEAR_BLACK_L = 0.1; // almost black regardless of hue
const NEUTRAL_DARK_L = 0.32; // dark gray / navy ceiling
const NEUTRAL_CHROMA = 0.28; // (max-min)/255 — below = grayish

/** @param {string} hex */
function parseHex(hex) {
  let h = hex.replace(/^#/, "").toLowerCase();
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  if (h.length === 8) h = h.slice(0, 6); // drop alpha
  if (h.length !== 6 || !/^[0-9a-f]+$/.test(h)) return null;
  const n = Number.parseInt(h, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255, hex: `#${h}` };
}

/** Relative luminance 0–1 */
function lum({ r, g, b }) {
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

/** 0 = gray, 1 = fully saturated channel spread */
function chroma({ r, g, b }) {
  return (Math.max(r, g, b) - Math.min(r, g, b)) / 255;
}

/** True if this paint vanishes / looks muddy on dark gallery tiles. */
function isBadOnDark(c) {
  const L = lum(c);
  const C = chroma(c);
  if (L < NEAR_BLACK_L) return true;
  if (L < NEUTRAL_DARK_L && C < NEUTRAL_CHROMA) return true;
  return false;
}

const NAMED = {
  black: { r: 0, g: 0, b: 0, hex: "#000000" },
  white: { r: 255, g: 255, b: 255, hex: "#ffffff" },
  none: null,
  transparent: null,
};

/**
 * Strip clipPath / mask inner markup so white clip rects don't pollute paints.
 * Keep linearGradient stop-colors (parsed separately).
 * @param {string} svg
 */
function stripNonPaintContainers(svg) {
  return svg
    .replace(/<clipPath\b[\s\S]*?<\/clipPath>/gi, "")
    .replace(/<mask\b[\s\S]*?<\/mask>/gi, "");
}

/**
 * Collect paint colors from SVG markup.
 * @param {string} svg
 */
function collectPaints(svg) {
  /** @type {Map<string, {r:number,g:number,b:number,hex:string}>} */
  const colors = new Map();
  let hasDefaultBlack = false;
  let hasCurrentColor = false;
  let hasUrlFill = false;
  let hasBrightGradient = false;

  const add = (c) => {
    if (!c) return;
    colors.set(c.hex, c);
  };

  // Gradient stops are real visible paints (e.g. Solana purple→green)
  for (const m of svg.matchAll(
    /stop-color\s*[:=]\s*#([0-9a-fA-F]{3,8})\b/gi,
  )) {
    const c = parseHex(m[1]);
    add(c);
    if (c && lum(c) >= NEUTRAL_DARK_L) hasBrightGradient = true;
  }
  for (const m of svg.matchAll(/stop-color\s*[:=]\s*(black|white)\b/gi)) {
    add(NAMED[m[1].toLowerCase()]);
  }

  const body = stripNonPaintContainers(svg);

  // style blocks: .st0{fill:#1E1E1E}
  for (const m of body.matchAll(
    /(?:fill|stroke)\s*:\s*#([0-9a-fA-F]{3,8})\b/gi,
  )) {
    add(parseHex(m[1]));
  }
  for (const m of body.matchAll(/(?:fill|stroke)\s*:\s*(black|white)\b/gi)) {
    add(NAMED[m[1].toLowerCase()]);
  }

  // attributes fill="#…" stroke="#…"
  for (const m of body.matchAll(
    /\b(?:fill|stroke)\s*=\s*["']#([0-9a-fA-F]{3,8})["']/gi,
  )) {
    add(parseHex(m[1]));
  }
  for (const m of body.matchAll(
    /\b(?:fill|stroke)\s*=\s*["'](black|white)["']/gi,
  )) {
    add(NAMED[m[1].toLowerCase()]);
  }

  if (
    /\b(?:fill|stroke)\s*=\s*["']currentColor["']/i.test(body) ||
    /(?:fill|stroke)\s*:\s*currentColor\b/i.test(body)
  ) {
    hasCurrentColor = true;
  }
  if (/\b(?:fill|stroke)\s*=\s*["']url\(/i.test(body)) {
    hasUrlFill = true;
  }
  if (/(?:fill|stroke)\s*:\s*url\(/i.test(body)) {
    hasUrlFill = true;
  }

  // Explicit CSS `color` on <svg> resolves currentColor (e.g. grok: color="#000").
  // Without this, currentColor-only icons are skipped and vanish on dark tiles.
  if (hasCurrentColor) {
    for (const m of svg.matchAll(/\bcolor\s*=\s*["']#([0-9a-fA-F]{3,8})["']/gi)) {
      add(parseHex(m[1]));
    }
    for (const m of svg.matchAll(/\bcolor\s*=\s*["'](black|white)["']/gi)) {
      add(NAMED[m[1].toLowerCase()]);
    }
    for (const m of svg.matchAll(/(?:^|[;{\s])color\s*:\s*#([0-9a-fA-F]{3,8})\b/gi)) {
      add(parseHex(m[1]));
    }
    for (const m of svg.matchAll(/(?:^|[;{\s])color\s*:\s*(black|white)\b/gi)) {
      add(NAMED[m[1].toLowerCase()]);
    }
  }

  const shapeRe =
    /<(path|circle|rect|polygon|ellipse|polyline)\b([^>]*)\/?>/gi;
  let shapeCount = 0;
  let unfilledCount = 0;
  for (const m of body.matchAll(shapeRe)) {
    shapeCount += 1;
    const attrs = m[2] ?? "";
    const hasFillAttr = /\bfill\s*=/i.test(attrs);
    const hasClass = /\bclass\s*=/i.test(attrs);
    const hasStyleFill = /\bstyle\s*=\s*["'][^"']*fill\s*:/i.test(attrs);
    if (!hasFillAttr && !hasClass && !hasStyleFill) {
      unfilledCount += 1;
    }
  }

  // Default black only when there is no other visible colorful paint / gradient
  const colorful = [...colors.values()].some((c) => !isBadOnDark(c));
  if (
    shapeCount > 0 &&
    colors.size === 0 &&
    !hasCurrentColor &&
    !hasUrlFill
  ) {
    hasDefaultBlack = true;
  }
  if (
    unfilledCount > 0 &&
    !hasCurrentColor &&
    !hasBrightGradient &&
    !colorful
  ) {
    // Unfilled shapes with only dark paints (or none) → default black
    if (colors.size === 0 || [...colors.values()].every((c) => isBadOnDark(c))) {
      hasDefaultBlack = true;
    }
  }

  // Generate pipeline strips root fill="currentColor" / color="…"; children
  // without their own fill then paint as SVG default black in the gallery
  // (e.g. aws-bedrock wordmark beside a gradient mark).
  if (hasCurrentColor && unfilledCount > 0) {
    hasDefaultBlack = true;
  }

  // Skip default-black when the ONLY paints are bright gradients and every
  // shape already has an explicit fill (no orphan unfilled paths).
  if (
    hasBrightGradient &&
    unfilledCount === 0 &&
    (hasUrlFill || colorful)
  ) {
    hasDefaultBlack = false;
  }

  if (hasDefaultBlack) {
    add(NAMED.black);
  }

  return {
    colors: [...colors.values()],
    hasDefaultBlack,
    hasCurrentColor,
    hasUrlFill,
    hasBrightGradient,
    shapeCount,
    unfilledCount,
  };
}

/**
 * @param {ReturnType<typeof collectPaints>} paints
 */
function classify(paints) {
  const { colors, hasDefaultBlack, hasCurrentColor, hasUrlFill } = paints;

  // currentColor with no resolved color attr → inherits gallery text (usually OK).
  if (hasCurrentColor && colors.length === 0) {
    return { flag: false, reason: "currentColor-inherits" };
  }

  if (colors.length === 0) {
    if (hasUrlFill) {
      return { flag: false, reason: "url-fill-only-skip" };
    }
    if (hasDefaultBlack) {
      return {
        flag: true,
        reason: "all-bad+default-black",
        maxL: 0,
        minL: 0,
        badCount: 1,
        paintCount: 1,
        samples: ["#000000(default)"],
      };
    }
    return { flag: false, reason: "no-paints" };
  }

  const ls = colors.map((c) => ({
    ...c,
    L: lum(c),
    C: chroma(c),
    bad: isBadOnDark(c),
  }));
  const minL = Math.min(...ls.map((c) => c.L));
  const maxL = Math.max(...ls.map((c) => c.L));
  const bad = ls.filter((c) => c.bad);
  const allBad = bad.length === ls.length;

  // Rule 2: every paint blends into dark UI
  if (allBad) {
    return {
      flag: true,
      reason: hasDefaultBlack ? "all-bad+default-black" : "all-bad",
      maxL,
      minL,
      badCount: bad.length,
      paintCount: ls.length,
      samples: ls
        .sort((a, b) => a.L - b.L)
        .slice(0, 5)
        .map(
          (c) =>
            `${c.hex}(L=${c.L.toFixed(2)},C=${c.C.toFixed(2)})`,
        ),
    };
  }

  // Rule 3: any near-black / charcoal component (partial vanish, e.g. dot)
  if (bad.length > 0) {
    return {
      flag: true,
      reason: "has-bad-dark",
      maxL,
      minL,
      badCount: bad.length,
      paintCount: ls.length,
      samples: bad
        .slice(0, 5)
        .map(
          (c) =>
            `${c.hex}(L=${c.L.toFixed(2)},C=${c.C.toFixed(2)})`,
        ),
    };
  }

  return {
    flag: false,
    reason: "ok",
    maxL,
    minL,
    badCount: 0,
    paintCount: ls.length,
  };
}

const knownBad = [
  "crypto/xrp",
  "crypto/dot",
  "crypto/qnt",
  "crypto/btu",
  "crypto/ess",
  "crypto/snm",
  "crypto/xsn",
  "dev/anthropic-icon",
  "dev/architect-icon",
  "dev/crystal",
  // Dev partial / currentColor samples
  "dev/google-gemini",
  "dev/adobe-firefly",
  "dev/aws-bedrock",
  "dev/fish-audio",
  "dev/grok",
  "dev/grok-icon",
  "dev/mcp-icon",
];

/** @type {Array<any>} */
const flagged = [];
/** @type {Array<any>} */
const knownMiss = [];

for (const pack of ["crypto", "dev"]) {
  const dir = join("assets", pack);
  const files = readdirSync(dir)
    .filter((f) => f.toLowerCase().endsWith(".svg"))
    .sort();
  for (const file of files) {
    const id = file.replace(/\.svg$/i, "").toLowerCase();
    const key = `${pack}/${id}`;
    const svg = readFileSync(join(dir, file), "utf8");
    const paints = collectPaints(svg);
    const result = classify(paints);
    if (result.flag) {
      flagged.push({
        key,
        pack,
        id,
        reason: result.reason,
        maxL: result.maxL,
        minL: result.minL,
        nearBlack: result.nearBlack,
        samples: result.samples,
        defaultBlack: paints.hasDefaultBlack,
        shapes: paints.shapeCount,
        unfilled: paints.unfilledCount,
      });
    } else if (knownBad.includes(key)) {
      knownMiss.push({ key, result, paints: paints.colors.map((c) => c.hex) });
    }
  }
}

// Group by reason
/** @type {Record<string, number>} */
const byReason = {};
for (const f of flagged) {
  byReason[f.reason] = (byReason[f.reason] ?? 0) + 1;
}

const knownHit = knownBad.filter((k) => flagged.some((f) => f.key === k));

const report = {
  thresholds: { NEAR_BLACK_L, NEUTRAL_DARK_L, NEUTRAL_CHROMA },
  totals: {
    flagged: flagged.length,
    crypto: flagged.filter((f) => f.pack === "crypto").length,
    dev: flagged.filter((f) => f.pack === "dev").length,
  },
  byReason,
  knownSamples: {
    expected: knownBad.length,
    hit: knownHit.length,
    hitList: knownHit,
    miss: knownMiss,
  },
  // Strictest subset: entire logo is bad-dark
  allBadOnly: flagged.filter((f) => String(f.reason).startsWith("all-bad")),
  // Partial: black/near-black + other colors (e.g. gemini, firefly)
  partialOnly: flagged.filter((f) => f.reason === "has-bad-dark"),
  flagged,
};

writeFileSync(
  "scripts/_dark-icons-report.json",
  JSON.stringify(report, null, 2),
);

const allBadKeys = report.allBadOnly.map((f) => f.key);
const partialKeys = report.partialOnly.map((f) => f.key);
/** Light-pad set = all-bad ∪ has-bad-dark */
const lightPadKeys = flagged.map((f) => f.key).sort();

writeFileSync("scripts/_dark-all-bad.txt", allBadKeys.join("\n") + "\n");
writeFileSync("scripts/_dark-partial.txt", partialKeys.join("\n") + "\n");
writeFileSync("scripts/_dark-light-pad.txt", lightPadKeys.join("\n") + "\n");
writeFileSync(
  "src/dark-on-dark.ts",
  `/**
 * Icons that vanish or look broken on dark gallery tiles (near-black fills,
 * default black, or currentColor + dark \`color\`).
 * Auto-generated by scripts/_scan-dark-icons.mjs (all-bad ∪ has-bad-dark).
 * Gallery fix: muted light pad behind the glyph in dark theme only.
 */
export const DARK_ON_DARK_KEYS = new Set<string>([
${lightPadKeys.map((k) => `  ${JSON.stringify(k)},`).join("\n")}
]);

export function needsLightPad(entry: {
  id: string;
  source?: string;
  category?: string;
}): boolean {
  const pack =
    entry.source === "crypto" || entry.category === "crypto"
      ? "crypto"
      : entry.source === "dev" || entry.category === "dev"
        ? "dev"
        : null;
  if (!pack) return false;
  return DARK_ON_DARK_KEYS.has(\`\${pack}/\${entry.id}\`);
}
`,
);

console.log("=== dark-on-dark scan (crypto + dev) ===");
console.log(
  `flagged: ${report.totals.flagged} (crypto ${report.totals.crypto}, dev ${report.totals.dev})`,
);
console.log(`  all-bad (whole logo): ${report.allBadOnly.length}`);
console.log(
  `  has-bad-dark (partial): ${flagged.length - report.allBadOnly.length}`,
);
console.log("by reason:", byReason);
console.log(
  `known samples: ${knownHit.length}/${knownBad.length} hit`,
  knownMiss.length ? `| MISS: ${knownMiss.map((m) => m.key).join(", ")}` : "",
);
console.log("\n--- ALL-BAD (strict) ---");
for (const f of report.allBadOnly) {
  const extra = f.samples ? ` ${f.samples.join(" ")}` : "";
  console.log(
    `${f.key}\t${f.reason}\tL=${f.minL?.toFixed?.(2) ?? "?"}-${f.maxL?.toFixed?.(2) ?? "?"}${extra}`,
  );
}
console.log("\n--- HAS-BAD-DARK (partial, e.g. black + brand color) ---");
for (const f of flagged.filter((x) => x.reason === "has-bad-dark")) {
  const extra = f.samples ? ` ${f.samples.join(" ")}` : "";
  console.log(
    `${f.key}\t${f.badCount}/${f.paintCount} bad\tL=${f.minL?.toFixed?.(2)}-${f.maxL?.toFixed?.(2)}${extra}`,
  );
}
console.log("\nWrote scripts/_dark-icons-report.json");
console.log(
  `Wrote _dark-all-bad.txt (${allBadKeys.length}), _dark-partial.txt (${partialKeys.length}), _dark-light-pad.txt + src/dark-on-dark.ts (${lightPadKeys.length})`,
);

if (knownMiss.length) {
  console.error("KNOWN SAMPLE MISS:", knownMiss.map((m) => m.key).join(", "));
  process.exitCode = 1;
}
