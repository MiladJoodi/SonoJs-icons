import { describe, expect, it } from "vitest";
import { renderIconTsx } from "../cli/render-icon-tsx.mjs";

describe("renderIconTsx", () => {
  it("builds a self-contained component from registry JSON", () => {
    const payload = {
      id: "sample",
      nameEn: "Sample",
      nameFa: "نمونه",
      componentName: "SampleIcon",
      category: "manual",
      color: {
        viewBox: "0 0 24 24",
        body: '<circle cx="12" cy="12" r="10" fill="#2563eb" />',
      },
    };

    const tsx = renderIconTsx(payload);
    expect(tsx).toContain(`export const ${payload.componentName}`);
    expect(tsx).toContain("dangerouslySetInnerHTML");
    expect(tsx).toContain("@sonojs/icons");
    expect(tsx).not.toMatch(/variant/);
    expect(tsx).not.toMatch(/from ["']@sonojs\/icons["']/);
  });
});
