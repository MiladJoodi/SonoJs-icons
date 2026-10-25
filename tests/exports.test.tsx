import { createElement } from "react";
import { describe, expect, it } from "vitest";
import {
  LogoIcon,
  createBrandIcon,
  createIcon,
  displayGroups,
  getIconManifestEntry,
  iconCategories,
  iconManifest,
} from "@sonojs/icons";

describe("package exports", () => {
  it("ships crypto, dev, and general catalogs", () => {
    expect(iconManifest.length).toBeGreaterThan(1000);
    expect(iconCategories.some((c) => c.id === "crypto")).toBe(true);
    expect(iconCategories.some((c) => c.id === "dev")).toBe(true);
    expect(displayGroups.some((g) => g.id === "crypto")).toBe(true);
    expect(displayGroups.some((g) => g.id === "dev")).toBe(true);
    // General topical categories (from icon metadata)
    expect(displayGroups.some((g) => g.id === "arrows")).toBe(true);
    expect(getIconManifestEntry("aave")?.category).toBe("crypto");
  });

  it("exports LogoIcon helper", () => {
    expect(LogoIcon).toBeTruthy();
    const el = createElement(LogoIcon, { name: "aave", size: 24 });
    expect(el.type).toBe(LogoIcon);
  });

  it("exports icon factories", () => {
    expect(createIcon).toBeTypeOf("function");
    expect(createBrandIcon).toBeTypeOf("function");
  });
});
