import {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import {
  LogoIcon,
  needsLightPad,
  type DisplayGroupId,
  type IconManifestEntry,
} from "@sonojs/icons";
import { useWindowRowVirtualizer } from "./use-window-row-virtualizer";

const GRID_GAP = 8;
/** Fixed gallery cell size (px). */
export const TILE_BOX = 56;
const HEADER_ROW_H = 44;

type HeaderRow = {
  kind: "header";
  groupId: DisplayGroupId;
  labelFa: string;
};

type IconsRow = {
  kind: "icons";
  icons: IconManifestEntry[];
};

export type GalleryRow = HeaderRow | IconsRow;

export type SectionModel = {
  id: DisplayGroupId;
  labelFa: string;
  icons: IconManifestEntry[];
};

type IconTileProps = {
  entry: IconManifestEntry;
  active: boolean;
  tileSize: number;
  onSelect: (id: string) => void;
};

const IconTile = memo(function IconTile({
  entry,
  active,
  tileSize,
  onSelect,
}: IconTileProps) {
  const lightPad = needsLightPad(entry);
  return (
    <button
      type="button"
      className={`tile ${active ? "active" : ""} ${lightPad ? "tile--light-pad" : ""}`}
      onClick={() => onSelect(entry.id)}
      aria-label={entry.nameEn}
      aria-pressed={active}
    >
      <span className="tile-icon">
        <LogoIcon name={entry.id} size={Math.min(tileSize, 40)} />
      </span>
      <span className="tile-tip">{entry.nameEn}</span>
    </button>
  );
}, (prev, next) =>
  prev.entry.id === next.entry.id &&
  prev.active === next.active &&
  prev.tileSize === next.tileSize &&
  prev.onSelect === next.onSelect,
);

function chunkIcons(
  icons: IconManifestEntry[],
  columns: number,
): IconManifestEntry[][] {
  if (columns < 1) return [icons];
  const rows: IconManifestEntry[][] = [];
  for (let i = 0; i < icons.length; i += columns) {
    rows.push(icons.slice(i, i + columns));
  }
  return rows;
}

function buildRows(
  sections: SectionModel[],
  flatIcons: IconManifestEntry[] | null,
  columns: number,
  searching: boolean,
): { rows: GalleryRow[]; groupRowIndex: Map<DisplayGroupId, number> } {
  const groupRowIndex = new Map<DisplayGroupId, number>();
  const rows: GalleryRow[] = [];

  if (searching) {
    for (const chunk of chunkIcons(flatIcons ?? [], columns)) {
      rows.push({ kind: "icons", icons: chunk });
    }
    return { rows, groupRowIndex };
  }

  for (const section of sections) {
    groupRowIndex.set(section.id, rows.length);
    rows.push({
      kind: "header",
      groupId: section.id,
      labelFa: section.labelFa,
    });
    for (const chunk of chunkIcons(section.icons, columns)) {
      rows.push({ kind: "icons", icons: chunk });
    }
  }
  return { rows, groupRowIndex };
}

export type VirtualIconGalleryProps = {
  sections: SectionModel[];
  filtered: IconManifestEntry[];
  isSearching: boolean;
  tileSize: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
  /** Sidebar jump target; bumped via scrollNonce in parent. */
  pendingScrollRef: React.MutableRefObject<DisplayGroupId | "all" | null>;
  scrollNonce: number;
  scrollingToRef: React.MutableRefObject<boolean>;
  onActiveGroup: (id: DisplayGroupId | "all") => void;
  listRef?: React.RefObject<HTMLDivElement | null>;
};

export function VirtualIconGallery({
  sections,
  filtered,
  isSearching,
  tileSize,
  selectedId,
  onSelect,
  pendingScrollRef,
  scrollNonce,
  scrollingToRef,
  onActiveGroup,
  listRef: listRefProp,
}: VirtualIconGalleryProps) {
  const localListRef = useRef<HTMLDivElement>(null);
  const listRef = listRefProp ?? localListRef;
  const [width, setWidth] = useState(800);
  const [scrollMargin, setScrollMargin] = useState(0);
  const [scrollPaddingStart, setScrollPaddingStart] = useState(72);

  const columns = Math.max(
    1,
    Math.floor((width + GRID_GAP) / (TILE_BOX + GRID_GAP)),
  );
  // Stretch inter-tile gap so full rows consume the gallery width (no trailing slack).
  const galleryGap =
    columns <= 1
      ? GRID_GAP
      : Math.max(GRID_GAP, (width - columns * TILE_BOX) / (columns - 1));

  const { rows, groupRowIndex } = useMemo(
    () =>
      buildRows(
        sections,
        isSearching ? filtered : null,
        columns,
        isSearching,
      ),
    [sections, filtered, columns, isSearching],
  );

  const estimateSize = useCallback(
    (index: number) => {
      const row = rows[index];
      if (!row) return TILE_BOX + GRID_GAP;
      if (row.kind === "header") return HEADER_ROW_H;
      return TILE_BOX + GRID_GAP;
    },
    [rows],
  );

  const measureChrome = useCallback(() => {
    const nav = document.querySelector(".site-nav") as HTMLElement | null;
    const sticky = document.querySelector(".sticky-bar") as HTMLElement | null;
    setScrollPaddingStart(
      (nav?.offsetHeight ?? 64) + (sticky?.offsetHeight ?? 0) + 8,
    );
    const el = listRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setScrollMargin(rect.top + window.scrollY);
    setWidth(el.clientWidth || 800);
  }, [listRef]);

  useLayoutEffect(() => {
    measureChrome();
  }, [measureChrome, tileSize, isSearching, rows.length]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => measureChrome());
    ro.observe(el);
    window.addEventListener("resize", measureChrome);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measureChrome);
    };
  }, [listRef, measureChrome]);

  const virtualizer = useWindowRowVirtualizer({
    count: rows.length,
    estimateSize,
    overscan: 3,
    scrollMargin,
    scrollPaddingStart,
  });

  const virtualItems = virtualizer.getVirtualItems();
  const visibleRangeKey = `${virtualItems[0]?.index ?? 0}-${virtualItems[virtualItems.length - 1]?.index ?? 0}`;

  // Sidebar / brand jump
  useEffect(() => {
    if (scrollNonce === 0) return;
    if (isSearching) return;
    const pending = pendingScrollRef.current;
    if (pending == null) return;
    pendingScrollRef.current = null;

    const run = () => {
      if (pending === "all") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        const idx = groupRowIndex.get(pending);
        if (idx != null) {
          virtualizer.scrollToIndex(idx, {
            align: "start",
            behavior: "smooth",
          });
        }
      }
      window.setTimeout(() => {
        scrollingToRef.current = false;
      }, 800);
    };
    requestAnimationFrame(run);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- scrollNonce is the trigger
  }, [scrollNonce]);

  // Active group from section headers. At page top → first category.
  useEffect(() => {
    if (isSearching || !listRef.current) return;
    const root = listRef.current;
    const nodes = [
      ...root.querySelectorAll<HTMLElement>("[data-group-section]"),
    ];
    if (!nodes.length) return;
    const firstId = sections[0]?.id;
    const TOP_EPS = 64;
    const stickyY = 120;
    let raf = 0;
    let lastId: string | null = null;

    const setActive = (id: DisplayGroupId) => {
      if (id === lastId) return;
      lastId = id;
      onActiveGroup(id);
    };

    const pick = () => {
      if (scrollingToRef.current) return;
      if (window.scrollY <= TOP_EPS) {
        if (firstId) setActive(firstId);
        return;
      }
      // Last header that has reached / passed the sticky band.
      let chosen: HTMLElement | null = null;
      for (const el of nodes) {
        if (el.getBoundingClientRect().top <= stickyY) chosen = el;
      }
      if (!chosen) chosen = nodes[0] ?? null;
      const id = chosen?.dataset.groupSection as DisplayGroupId | undefined;
      if (id) setActive(id);
    };

    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(pick);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    pick();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, [
    isSearching,
    listRef,
    onActiveGroup,
    scrollingToRef,
    visibleRangeKey,
    sections,
  ]);

  const handleSelect = useCallback(
    (id: string) => {
      onSelect(id);
    },
    [onSelect],
  );

  if (isSearching && filtered.length === 0) {
    return (
      <p className="empty" dir="ltr" lang="en">
        No icons match this search.
      </p>
    );
  }

  return (
    <div
      ref={listRef as React.RefObject<HTMLDivElement>}
      className="virtual-gallery"
      style={
        {
          height: virtualizer.getTotalSize(),
          position: "relative",
          width: "100%",
        } as CSSProperties
      }
    >
      {virtualItems.map((vRow) => {
        const row = rows[vRow.index];
        if (!row) return null;
        const style: CSSProperties = {
          position: "absolute",
          top: 0,
          insetInlineStart: 0,
          width: "100%",
          height: vRow.size,
          transform: `translateY(${vRow.start}px)`,
        };

        if (row.kind === "header") {
          return (
            <div
              key={`h-${row.groupId}`}
              className="virtual-row virtual-row-header"
              style={style}
              id={`group-${row.groupId}`}
              data-group-section={row.groupId}
            >
              <h2
                className="icon-section-title"
                dir="ltr"
                lang="en"
                id={`group-heading-${row.groupId}`}
              >
                {row.labelFa}
              </h2>
            </div>
          );
        }

        return (
          <div
            key={`r-${vRow.index}`}
            className="virtual-row virtual-row-icons"
            style={
              {
                ...style,
                "--gallery-gap": `${galleryGap}px`,
              } as CSSProperties
            }
          >
            {row.icons.map((entry) => (
              <IconTile
                key={entry.id}
                entry={entry}
                active={entry.id === selectedId}
                tileSize={tileSize}
                onSelect={handleSelect}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
}

/** Imperative helper for brand click → top. */
export function scrollGalleryToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}
