import { Resvg } from "@resvg/resvg-js";

const RENDER = 512;
const ALPHA_THRESHOLD = 10;
/** Padding as a fraction of the fitted content side (near-square marks). */
const PAD_RATIO = 0.04;
/**
 * Wordmarks (wide/tall) look tiny in a square if we only fit the long side.
 * Zoom in up to this factor so the short side fills more of the tile.
 * Ends may crop slightly — preferable to unreadable micro-text.
 */
const MAX_WORDMARK_ZOOM = 1.7;
/** Start boosting once content aspect exceeds this. */
const WORDMARK_ASPECT = 2.2;
/** Aim for the short content side to fill this fraction of the square. */
const TARGET_SHORT_FILL = 0.34;

/**
 * @param {string} svg
 * @returns {{ x: number, y: number, width: number, height: number } | null}
 */
function parseViewBoxAttr(svg) {
  const raw = svg.match(/viewBox=["']([^"']+)["']/i)?.[1]?.trim();
  if (!raw) return null;
  const parts = raw.split(/[ ,]+/).map(Number);
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) return null;
  return { x: parts[0], y: parts[1], width: parts[2], height: parts[3] };
}

/**
 * Ensure root <svg> has a usable viewBox (derive from width/height if needed).
 * @param {string} svg
 */
function ensureViewBox(svg) {
  if (parseViewBoxAttr(svg)) return svg;
  const w = Number(svg.match(/\bwidth=["']([0-9.]+)["']/i)?.[1]);
  const h = Number(svg.match(/\bheight=["']([0-9.]+)["']/i)?.[1]);
  if (!w || !h || Number.isNaN(w) || Number.isNaN(h)) return svg;
  return svg.replace(/<svg\b/i, `<svg viewBox="0 0 ${w} ${h}"`);
}

/**
 * @param {string} svg
 * @param {string} viewBox
 */
function setViewBox(svg, viewBox) {
  if (/viewBox=["'][^"']*["']/i.test(svg)) {
    return svg.replace(/viewBox=["'][^"']*["']/i, `viewBox="${viewBox}"`);
  }
  return svg.replace(/<svg\b/i, `<svg viewBox="${viewBox}"`);
}

/** @param {number} n */
function round(n) {
  return Math.round(n * 1000) / 1000;
}

/**
 * Measure ink bounds in SVG user units via alpha rasterization.
 * @param {string} svg
 * @param {{ x: number, y: number, width: number, height: number }} vb
 * @returns {{ x: number, y: number, width: number, height: number } | null}
 */
function measureInkBounds(svg, vb) {
  let rendered;
  try {
    const resvg = new Resvg(svg, {
      fitTo: { mode: "width", value: RENDER },
      font: { loadSystemFonts: false },
    });
    rendered = resvg.render();
  } catch {
    return null;
  }

  const { width: rw, height: rh, pixels } = rendered;
  if (!rw || !rh || !pixels?.length) return null;

  let minX = rw;
  let minY = rh;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < rh; y++) {
    const row = y * rw * 4;
    for (let x = 0; x < rw; x++) {
      if (pixels[row + x * 4 + 3] > ALPHA_THRESHOLD) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (maxX < minX || maxY < minY) return null;

  const sx = vb.width / rw;
  const sy = vb.height / rh;
  return {
    x: vb.x + minX * sx,
    y: vb.y + minY * sy,
    width: (maxX - minX + 1) * sx,
    height: (maxY - minY + 1) * sy,
  };
}

/**
 * Recompute viewBox from rendered alpha bounds and pad into a square.
 * Wide/tall wordmarks get a capped optical zoom so they don't look tiny in grids.
 *
 * @param {string} svg
 * @param {{ padRatio?: number, maxZoom?: number }} [options]
 * @returns {string}
 */
export function normalizeOpticalViewBox(svg, options = {}) {
  const padRatio = options.padRatio ?? PAD_RATIO;
  const maxZoom = options.maxZoom ?? MAX_WORDMARK_ZOOM;
  const input = ensureViewBox(svg);
  const vb = parseViewBoxAttr(input);
  if (!vb || vb.width <= 0 || vb.height <= 0) return input;

  const ink = measureInkBounds(input, vb) ?? {
    x: vb.x,
    y: vb.y,
    width: vb.width,
    height: vb.height,
  };

  return applySquareViewBox(
    input,
    ink.x,
    ink.y,
    ink.width,
    ink.height,
    padRatio,
    maxZoom,
  );
}

/**
 * @param {string} svg
 * @param {number} x
 * @param {number} y
 * @param {number} w
 * @param {number} h
 * @param {number} padRatio
 * @param {number} maxZoom
 */
function applySquareViewBox(svg, x, y, w, h, padRatio, maxZoom = MAX_WORDMARK_ZOOM) {
  const long = Math.max(w, h);
  const short = Math.min(w, h);
  if (long <= 0 || short <= 0) return svg;

  const aspect = long / short;
  // Fit the long side with padding (no crop for near-square marks).
  let box = long * (1 + 2 * padRatio);

  if (aspect > WORDMARK_ASPECT) {
    // Soft zoom curve: flatter logos get more boost, capped by maxZoom.
    const t = Math.min(1, (aspect - WORDMARK_ASPECT) / 4);
    const zoom = 1 + (maxZoom - 1) * Math.pow(t, 0.65);
    const zoomedBox = long / zoom;
    const targetBox = short / TARGET_SHORT_FILL;
    // Prefer target short-fill, but never zoom harder than maxZoom.
    box = Math.max(zoomedBox, Math.min(box, targetBox));
  }

  const ox = x + w / 2 - box / 2;
  const oy = y + h / 2 - box / 2;
  const viewBox = `${round(ox)} ${round(oy)} ${round(box)} ${round(box)}`;
  return setViewBox(svg, viewBox);
}
