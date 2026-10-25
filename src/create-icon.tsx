import { forwardRef, useId, useMemo } from "react";
import type { ReactNode, Ref } from "react";
import { scopeSvgMarkup, svgIdScope } from "./scope-svg-ids";
import type { IconProps } from "./types";

function parseViewBox(viewBox: string): { width: number; height: number } {
  const parts = viewBox.trim().split(/[\s,]+/).map(Number);
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) {
    return { width: 24, height: 24 };
  }
  return { width: parts[2], height: parts[3] };
}

function resolveDimensions(
  props: IconProps,
  viewBox: string,
): { width: number | string; height: number | string } {
  const { width: vbW, height: vbH } = parseViewBox(viewBox);
  const ratio = vbW / vbH || 1;

  if (props.width != null && props.height != null) {
    return { width: props.width, height: props.height };
  }

  if (props.width != null) {
    const w =
      typeof props.width === "number" ? props.width : Number.parseFloat(String(props.width));
    if (!Number.isNaN(w)) {
      return { width: props.width, height: w / ratio };
    }
    return { width: props.width, height: props.height ?? props.size ?? vbH };
  }

  if (props.height != null) {
    const h =
      typeof props.height === "number"
        ? props.height
        : Number.parseFloat(String(props.height));
    if (!Number.isNaN(h)) {
      return { width: h * ratio, height: props.height };
    }
    return { width: props.width ?? props.size ?? vbW, height: props.height };
  }

  // `size` is a square box; artwork fits via preserveAspectRatio meet.
  const size = props.size ?? 24;
  return { width: size, height: size };
}

export interface CreateIconOptions {
  displayName: string;
  viewBox: string;
  /** React children drawn inside the SVG root. */
  children?: ReactNode;
  /**
   * Trusted, build-time SVG inner markup (from official/source SVGs).
   * Prefer this for complex brand artwork with gradients/defs.
   */
  markup?: string;
}

export function createIcon({
  displayName,
  viewBox,
  children,
  markup,
}: CreateIconOptions) {
  const Icon = forwardRef(function Icon(
    props: IconProps,
    ref: Ref<SVGSVGElement>,
  ) {
    const {
      size: _size,
      title,
      className,
      style,
      width: _width,
      height: _height,
      ...rest
    } = props;

    const { width, height } = resolveDimensions(props, viewBox);
    const isDecorative = title == null || title === "";
    const scope = svgIdScope(useId());
    const scopedMarkup = useMemo(
      () => (markup ? scopeSvgMarkup(markup, scope) : undefined),
      [markup, scope],
    );

    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        viewBox={viewBox}
        width={width}
        height={height}
        preserveAspectRatio="xMidYMid meet"
        className={className}
        style={style}
        role={isDecorative ? undefined : "img"}
        aria-label={isDecorative ? undefined : title}
        aria-hidden={isDecorative ? true : undefined}
        focusable="false"
        {...rest}
      >
        {title ? <title>{title}</title> : null}
        {scopedMarkup ? (
          <g dangerouslySetInnerHTML={{ __html: scopedMarkup }} />
        ) : (
          children
        )}
      </svg>
    );
  });

  Icon.displayName = displayName;
  return Icon;
}
