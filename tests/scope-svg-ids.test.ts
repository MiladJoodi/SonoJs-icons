import { describe, expect, it } from "vitest";
import {
  scopeSvgMarkup,
  svgIdScope,
  toMonoSvgMarkup,
} from "../src/scope-svg-ids";

describe("scopeSvgMarkup", () => {
  it("prefixes gradient ids and url() refs", () => {
    const input =
      '<defs><linearGradient id="a"><stop stop-color="#f00"/></linearGradient></defs><path fill="url(#a)" clip-path="url(#a)"/>';
    const out = scopeSvgMarkup(input, "r0");
    expect(out).toContain('id="r0-a"');
    expect(out).toContain('fill="url(#r0-a)"');
    expect(out).toContain('clip-path="url(#r0-a)"');
    expect(out).not.toContain('id="a"');
  });

  it("scopes Illustrator style classes so .st0 does not bleed", () => {
    const input =
      '<style type="text/css">.st0{fill:url(#SVGID_1_);}.st1{fill:#FFFFFF;}</style>' +
      '<linearGradient id="SVGID_1_"><stop stop-color="#f00"/></linearGradient>' +
      '<circle class="st0"/><path class="st1"/>';
    const out = scopeSvgMarkup(input, "ico");
    expect(out).toContain(".ico-st0");
    expect(out).toContain(".ico-st1");
    expect(out).toContain('class="ico-st0"');
    expect(out).toContain('class="ico-st1"');
    expect(out).toContain("url(#ico-SVGID_1_)");
    expect(out).not.toMatch(/(^|[^-])\.st0\b/);
  });

  it("leaves plain path markup without classes unchanged", () => {
    const input = '<path fill="currentColor" d="M0 0h10v10H0z"/>';
    expect(scopeSvgMarkup(input, "x")).toBe(input);
  });
});

describe("toMonoSvgMarkup", () => {
  it("converts hard-coded fills to currentColor", () => {
    const out = toMonoSvgMarkup(
      '<path fill="#8B4FBA" d="M0 0h10v10H0z"/><path fill="none" d="M1 1"/>',
    );
    expect(out).toContain('fill="currentColor"');
    expect(out).toContain('fill="none"');
    expect(out).not.toContain("#8B4FBA");
  });
});

describe("svgIdScope", () => {
  it("strips React useId colons", () => {
    expect(svgIdScope(":r1:")).toBe("r1");
  });
});
