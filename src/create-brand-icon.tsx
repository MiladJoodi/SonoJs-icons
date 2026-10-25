import { createIcon } from "./create-icon";
import type { IconGlyphData } from "./types";

/**
 * Factory for a brand icon from a single glyph (original artwork colors / strokes).
 */
export function createBrandIcon(
  id: string,
  displayName: string,
  glyph: IconGlyphData,
) {
  if (!glyph?.body) {
    throw new Error(`Invalid icon data: ${id}`);
  }

  return createIcon({
    displayName,
    viewBox: glyph.viewBox,
    markup: glyph.body,
  });
}
