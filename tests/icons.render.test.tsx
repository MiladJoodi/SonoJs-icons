import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { createBrandIcon } from "@sonojs/icons";

const SampleIcon = createBrandIcon("sample", "SampleIcon", {
  viewBox: "0 0 24 24",
  width: 24,
  height: 24,
  body: '<circle cx="12" cy="12" r="10" fill="#2563eb" />',
});

describe("icon rendering", () => {
  it("renders with accessible title", () => {
    const { container } = render(
      <SampleIcon size={32} title="Sample" className="brand-icon" />,
    );
    const svg = container.querySelector("svg");
    expect(svg).toBeTruthy();
    expect(svg?.getAttribute("role")).toBe("img");
    expect(svg?.getAttribute("aria-label")).toBe("Sample");
    expect(svg?.getAttribute("class")).toBe("brand-icon");
    expect(svg?.getAttribute("height")).toBe("32");
    expect(screen.getByTitle("Sample")).toBeTruthy();
  });

  it("marks decorative icons with aria-hidden", () => {
    const { container } = render(<SampleIcon size={24} />);
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("aria-hidden")).toBe("true");
    expect(svg?.getAttribute("role")).toBeNull();
  });

  it("uses a square box for size", () => {
    const { container } = render(<SampleIcon size={30} />);
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("width")).toBe("30");
    expect(svg?.getAttribute("height")).toBe("30");
    expect(svg?.getAttribute("preserveAspectRatio")).toBe("xMidYMid meet");
  });
});
