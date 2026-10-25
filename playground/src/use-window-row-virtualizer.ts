import { useCallback, useEffect, useMemo, useState } from "react";

export type VirtualRow = {
  index: number;
  start: number;
  size: number;
  end: number;
  key: number;
};

type Options = {
  count: number;
  estimateSize: (index: number) => number;
  overscan?: number;
  /** Offset of the list from the document top. */
  scrollMargin?: number;
  /** Sticky header height so rows align under nav/search. */
  scrollPaddingStart?: number;
};

/**
 * Minimal window scroller virtualizer (row list).
 * Drop-in for the playground gallery when @tanstack/react-virtual is unavailable.
 */
export function useWindowRowVirtualizer({
  count,
  estimateSize,
  overscan = 6,
  scrollMargin = 0,
  scrollPaddingStart = 0,
}: Options) {
  const [scrollY, setScrollY] = useState(
    () => (typeof window !== "undefined" ? window.scrollY : 0),
  );
  const [viewportH, setViewportH] = useState(
    () => (typeof window !== "undefined" ? window.innerHeight : 800),
  );

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setScrollY(window.scrollY));
    };
    const onResize = () => setViewportH(window.innerHeight);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    onScroll();
    onResize();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  const { offsets, totalSize } = useMemo(() => {
    const next = new Array<number>(count + 1);
    next[0] = 0;
    for (let i = 0; i < count; i++) {
      next[i + 1] = next[i]! + estimateSize(i);
    }
    return { offsets: next, totalSize: next[count] ?? 0 };
  }, [count, estimateSize]);

  const findIndex = useCallback(
    (offset: number) => {
      let lo = 0;
      let hi = count;
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if ((offsets[mid + 1] ?? 0) <= offset) lo = mid + 1;
        else hi = mid;
      }
      return Math.min(Math.max(lo, 0), Math.max(count - 1, 0));
    },
    [count, offsets],
  );

  const virtualItems = useMemo((): VirtualRow[] => {
    if (count === 0) return [];
    const localTop = Math.max(0, scrollY + scrollPaddingStart - scrollMargin);
    const localBottom = Math.max(
      localTop,
      scrollY + viewportH - scrollMargin,
    );
    let startIdx = findIndex(localTop);
    let endIdx = findIndex(localBottom);
    startIdx = Math.max(0, startIdx - overscan);
    endIdx = Math.min(count - 1, endIdx + overscan);
    const items: VirtualRow[] = [];
    for (let i = startIdx; i <= endIdx; i++) {
      const start = offsets[i] ?? 0;
      const end = offsets[i + 1] ?? start;
      items.push({
        index: i,
        start,
        size: end - start,
        end,
        key: i,
      });
    }
    return items;
  }, [
    count,
    findIndex,
    offsets,
    overscan,
    scrollMargin,
    scrollPaddingStart,
    scrollY,
    viewportH,
  ]);

  const scrollToIndex = useCallback(
    (
      index: number,
      opts?: { align?: "start" | "center" | "end"; behavior?: ScrollBehavior },
    ) => {
      const i = Math.min(Math.max(index, 0), Math.max(count - 1, 0));
      const rowStart = offsets[i] ?? 0;
      const rowSize = (offsets[i + 1] ?? rowStart) - rowStart;
      const align = opts?.align ?? "start";
      let target = scrollMargin + rowStart - scrollPaddingStart;
      if (align === "center") {
        target =
          scrollMargin + rowStart + rowSize / 2 - viewportH / 2;
      } else if (align === "end") {
        target =
          scrollMargin + rowStart + rowSize - viewportH + scrollPaddingStart;
      }
      window.scrollTo({
        top: Math.max(0, target),
        behavior: opts?.behavior ?? "smooth",
      });
    },
    [count, offsets, scrollMargin, scrollPaddingStart, viewportH],
  );

  const getTotalSize = useCallback(() => totalSize, [totalSize]);
  const getVirtualItems = useCallback(() => virtualItems, [virtualItems]);
  const getOffsetForIndex = useCallback(
    (index: number) => offsets[index] ?? 0,
    [offsets],
  );

  return {
    getTotalSize,
    getVirtualItems,
    scrollToIndex,
    getOffsetForIndex,
  };
}
