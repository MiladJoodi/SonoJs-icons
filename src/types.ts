import type { SVGProps } from "react";

/** Category ids for gallery grouping. Extend when new packs are generated. */
export type IconCategory = string;

export type VerificationStatus = "verified" | "needs-official-svg";

/** Artwork pack id (folder under assets/). */
export type IconSource = string;

export interface IconProps extends SVGProps<SVGSVGElement> {
  /**
   * Square box size (width and height). Artwork is centered with
   * `preserveAspectRatio="xMidYMid meet"`. Pass `width`/`height` to override.
   */
  size?: number | string;
  /**
   * Accessible name. When set, the icon is exposed to assistive tech.
   * When omitted, the icon is treated as decorative (`aria-hidden`).
   */
  title?: string;
}

export interface IconGlyphData {
  viewBox: string;
  width: number;
  height: number;
  body: string;
}

/** @deprecated Use IconGlyphData — kept as alias for older imports. */
export type IconVariantData = IconGlyphData;

export interface IconManifestEntry {
  id: string;
  nameFa: string;
  nameEn: string;
  componentName: string;
  category: IconCategory;
  source?: IconSource;
  sourceUrl: string;
  verificationStatus: VerificationStatus;
  notes?: string;
  /** Optional brand palette hex codes shown in the playground drawer. */
  brandColors?: string[];
  viewBox: string;
  aspectRatio: number;
}

export interface IconCategoryMeta {
  id: IconCategory;
  prefix: string;
  labelEn: string;
  labelFa: string;
  count: number;
}
