import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import {
  LogoIcon,
  FEATURED_ICON_ORDER,
  displayGroups,
  getDisplayGroupId,
  iconManifest,
  needsLightPad,
  packPopularityRank,
  type DisplayGroupId,
  type IconManifestEntry,
} from "@sonojs/icons";
import { GuidePage } from "./GuidePage";
import { PackagesPage } from "./PackagesPage";
import { buildSearchIndex, searchEntries } from "./search";
import { VirtualIconGallery } from "./VirtualIconGallery";

buildSearchIndex(iconManifest);

type PageId = "icons" | "guide" | "packages";

const PREVIEW_SIZES = [16, 24, 32, 48] as const;
/** Drawer stage size in px; `48` fills this box completely. */
const PREVIEW_FRAME_PX = 128;

/** Fallback brand palettes if catalog omits brandColors. */
const BRAND_COLORS: Record<string, string[]> = {
  easycandle: ["#0B2A4A", "#FFC400", "#FF7A00"],
  vibefarsi: ["#E39A8E", "#cf5c49"],
  pixevel: ["#111111", "#FCFCFA", "#F8A8B8"],
  "banana-ai": ["#000000", "#FE8301"],
  shenakhti: ["#009FE3"],
  zarinpal: ["#FFD60A", "#0A33FF"],
  alamto: ["#FFC10A", "#FD5722"],
  "bank-sepah": ["#484848", "#E86018"],
};

const CUSTOMIZER_DEFAULTS = {
  /** Icon glyph size inside the fixed 56×56 cell (max ~40). */
  size: 36,
};

/** Delay gallery filter while typing so fast input stays smooth. */
const SEARCH_DEBOUNCE_MS = 200;
const INSTALL_CMD = "npx @sonojs/icons add my-icon";

function readStoredCustomizer(): typeof CUSTOMIZER_DEFAULTS {
  try {
    const raw = window.localStorage.getItem("sonojs-icons-customizer");
    if (!raw) return { ...CUSTOMIZER_DEFAULTS };
    const parsed = JSON.parse(raw) as Partial<typeof CUSTOMIZER_DEFAULTS>;
    return {
      size:
        typeof parsed.size === "number" && parsed.size >= 16 && parsed.size <= 40
          ? parsed.size
          : CUSTOMIZER_DEFAULTS.size,
    };
  } catch {
    return { ...CUSTOMIZER_DEFAULTS };
  }
}

const ICON_ID_SET = new Set(iconManifest.map((e) => e.id));

type RouteState = { page: PageId; iconId: string | null };

/** `#guide` | `#packages` | `#icons` | `#icons/<id>` */
function parseHash(hash = window.location.hash): RouteState {
  const raw = hash.replace(/^#\/?/, "").trim();
  if (!raw) return { page: "icons", iconId: null };

  let segments: string[];
  try {
    segments = raw.split("/").map((s) => decodeURIComponent(s));
  } catch {
    return { page: "icons", iconId: null };
  }

  const head = (segments[0] ?? "").toLowerCase();
  if (head === "guide" || head === "packages") {
    return { page: head, iconId: null };
  }

  // `#icons` or `#icons/<id>` (id may contain `/` — join remainder)
  if (head === "icons") {
    const rest = segments.slice(1).join("/");
    return { page: "icons", iconId: rest || null };
  }

  return { page: "icons", iconId: null };
}

function hashFor(page: PageId, iconId: string | null): string {
  if (page === "guide") return "#guide";
  if (page === "packages") return "#packages";
  if (iconId) return `#icons/${encodeURIComponent(iconId)}`;
  return "#icons";
}

function resolveIconId(raw: string | null): string | null {
  if (!raw) return null;
  if (ICON_ID_SET.has(raw)) return raw;
  const lower = raw.toLowerCase();
  if (lower !== raw && ICON_ID_SET.has(lower)) return lower;
  return null;
}

function writeHash(page: PageId, iconId: string | null, mode: "push" | "replace") {
  const next = hashFor(page, iconId);
  if (window.location.hash === next) return;
  if (mode === "replace") window.history.replaceState(null, "", next);
  else window.history.pushState(null, "", next);
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/** Stars + GitHub button → main SonoJS repo (same as sonojs.com header). */
const SONO_GITHUB_URL = "https://github.com/MiladJoodi/SonoJS";
const SONO_GITHUB_API = "https://api.github.com/repos/MiladJoodi/SonoJS";
/** Issues / suggest-an-icon → this icons repo. */
const ICONS_REPO_URL = "https://github.com/MiladJoodi/SonoJs-icons";
const SONO_ORIGIN = "https://sonojs.com";

/** Same order/labels as sonojs.com site header. */
const SITE_NAV = [
  { href: `${SONO_ORIGIN}/docs`, label: "Docs" },
  { href: `${SONO_ORIGIN}/docs/components`, label: "Components" },
  { href: `${SONO_ORIGIN}/blocks`, label: "Blocks" },
  { href: `${SONO_ORIGIN}/charts`, label: "Charts" },
  { href: `${SONO_ORIGIN}/tools`, label: "Tools" },
  { href: "#icons", label: "Icons", current: true as const },
] as const;

function formatGithubStars(count: number): string {
  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(count);
}

function GitHubIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2C6.477 2 2 6.486 2 12.021c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.009-.866-.013-1.7-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.467-1.11-1.467-.908-.621.069-.608.069-.608 1.004.071 1.532 1.032 1.532 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.339-2.22-.253-4.555-1.113-4.555-4.952 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.56 9.56 0 0 1 12 6.844a9.56 9.56 0 0 1 2.504.337c1.909-1.296 2.747-1.026 2.747-1.026.546 1.378.203 2.397.1 2.65.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.944.359.31.678.92.678 1.855 0 1.338-.012 2.419-.012 2.749 0 .268.18.58.688.481A10.02 10.02 0 0 0 22 12.021C22 6.486 17.523 2 12 2Z" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <path
        d="M20 20l-3.5-3.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg
      className="nav-theme-icon"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.4 5.4l1.55 1.55M17.05 17.05l1.55 1.55M5.4 18.6l1.55-1.55M17.05 6.95l1.55-1.55"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      className="nav-theme-icon"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <path
        d="M20.2 14.1A7.8 7.8 0 0 1 9.9 3.8 8.4 8.4 0 1 0 20.2 14.1Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 7h16M4 12h16M4 17h16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SearchClearIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 6l12 12M18 6L6 18"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CategoriesIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DrawerCloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M18 6 6 18M6 6l12 12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PlusCircleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="8.25" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M12 8.5v7M8.5 12h7"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect
        x="9"
        y="9"
        width="13"
        height="13"
        rx="2"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M20 6 9 17l-5-5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ResetIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3 3v5h5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ExternalLinkIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M14 4h6v6M20 4 10 14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Persian/Arabic script → show FA title + EN subtitle; else EN only. */
function hasPersianScript(value: string): boolean {
  return /[\u0600-\u06FF]/.test(value);
}

export function App() {
  const initialRoute = (() => {
    const parsed = parseHash();
    const iconId = resolveIconId(parsed.iconId);
    return {
      page: parsed.page,
      iconId: parsed.page === "icons" ? iconId : null,
      needsNormalize:
        !window.location.hash ||
        (parsed.iconId != null && iconId == null) ||
        (parsed.page !== "icons" && parsed.iconId != null) ||
        hashFor(
          parsed.page,
          parsed.page === "icons" ? iconId : null,
        ) !== window.location.hash,
    };
  })();

  const [page, setPage] = useState<PageId>(() => initialRoute.page);
  const [query, setQuery] = useState("");
  /** Debounced copy of `query` — drives filtering / virtual gallery. */
  const [debouncedQuery, setDebouncedQuery] = useState("");
  /** Highlights sidebar + scroll target; does not filter the grid. */
  const [activeGroup, setActiveGroup] = useState<DisplayGroupId | "all">(
    () => displayGroups[0]?.id ?? "all",
  );
  const [customizer, setCustomizer] = useState(readStoredCustomizer);
  const tileSize = customizer.size;
  const [previewSize, setPreviewSize] =
    useState<(typeof PREVIEW_SIZES)[number]>(48);
  const previewRenderPx = Math.round(
    (previewSize / 48) * PREVIEW_FRAME_PX,
  );
  const [selectedId, setSelectedId] = useState<string | null>(
    () => initialRoute.iconId,
  );
  const [navOpen, setNavOpen] = useState(false);
  const [catDrawerOpen, setCatDrawerOpen] = useState(false);
  const [, setReady] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    const saved = window.localStorage.getItem("sonojs-icons-theme");
    return saved === "light" || saved === "dark" ? saved : "dark";
  });
  const [copiedKind, setCopiedKind] = useState<
    "svg" | "jsx" | "import" | "cli" | null
  >(null);
  const [installCopied, setInstallCopied] = useState(false);
  const [copiedColor, setCopiedColor] = useState<string | null>(null);
  const [starCount, setStarCount] = useState<number | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);
  const copyTimer = useRef<number | null>(null);
  const scrollingToRef = useRef(false);
  const pendingScrollRef = useRef<DisplayGroupId | "all" | null>(null);
  const [scrollNonce, setScrollNonce] = useState(0);
  /** Skip echoing URL→state when we just wrote the hash ourselves. */
  const urlWriteLock = useRef(false);

  const applyRoute = useCallback((route: RouteState, mode: "push" | "replace") => {
    const iconId =
      route.page === "icons" ? resolveIconId(route.iconId) : null;
    setPage(route.page);
    setSelectedId(iconId);
    urlWriteLock.current = true;
    writeHash(route.page, iconId, mode);
    queueMicrotask(() => {
      urlWriteLock.current = false;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setCopiedKind(null);
    applyRoute({ page: "icons", iconId: null }, "push");
  }, [applyRoute]);

  const go = (next: PageId) => {
    setNavOpen(false);
    setCatDrawerOpen(false);
    setCopiedKind(null);
    applyRoute({ page: next, iconId: null }, "push");
  };

  useEffect(() => {
    if (initialRoute.needsNormalize) {
      writeHash(initialRoute.page, initialRoute.iconId, "replace");
    }

    const syncFromUrl = () => {
      if (urlWriteLock.current) return;
      const parsed = parseHash();
      const iconId =
        parsed.page === "icons" ? resolveIconId(parsed.iconId) : null;
      if (parsed.iconId && !iconId) {
        writeHash(parsed.page, null, "replace");
        setPage(parsed.page);
        setSelectedId(null);
        return;
      }
      setPage(parsed.page);
      setSelectedId(iconId);
    };

    window.addEventListener("hashchange", syncFromUrl);
    window.addEventListener("popstate", syncFromUrl);
    return () => {
      window.removeEventListener("hashchange", syncFromUrl);
      window.removeEventListener("popstate", syncFromUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only URL bootstrap
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(SONO_GITHUB_API, {
          headers: {
            Accept: "application/vnd.github+json",
            "User-Agent": "SonoJS-icons-gallery",
          },
        });
        if (!res.ok) return;
        const data = (await res.json()) as { stargazers_count?: number };
        if (!cancelled && typeof data.stargazers_count === "number") {
          setStarCount(data.stargazers_count);
        }
      } catch {
        /* ignore network errors */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    // Clear results immediately when the box is emptied.
    if (!query.trim()) {
      setDebouncedQuery("");
      return;
    }
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query);
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [query]);

  // Search collapses the long gallery — jump to top so the sticky field
  // stays on screen (especially on mobile after scrolling deep).
  useEffect(() => {
    if (!debouncedQuery.trim()) return;
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [debouncedQuery]);

  const filtered = useMemo(() => {
    return searchEntries(iconManifest, debouncedQuery);
  }, [debouncedQuery]);

  const sections = useMemo(() => {
    // Browse mode groups the full catalog; search uses the flat filtered list.
    const source = debouncedQuery.trim() ? filtered : iconManifest;
    const byGroup = new Map<DisplayGroupId, IconManifestEntry[]>();
    for (const entry of source) {
      const gid = getDisplayGroupId(entry);
      const list = byGroup.get(gid);
      if (list) list.push(entry);
      else byGroup.set(gid, [entry]);
    }
    const featuredRank = new Map<string, number>(
      FEATURED_ICON_ORDER.map((id, i) => [id, i]),
    );
    return displayGroups
      .map((g) => {
        const icons = [...(byGroup.get(g.id) ?? [])].sort((a, b) => {
          if (g.id === "featured") {
            const ra = featuredRank.get(a.id) ?? Number.MAX_SAFE_INTEGER;
            const rb = featuredRank.get(b.id) ?? Number.MAX_SAFE_INTEGER;
            if (ra !== rb) return ra - rb;
          }
          if (g.id === "crypto" || g.id === "dev") {
            const ra = packPopularityRank(g.id, a.id);
            const rb = packPopularityRank(g.id, b.id);
            if (ra !== rb) return ra - rb;
          }
          return (
            a.nameFa.localeCompare(b.nameFa, "fa") ||
            a.nameEn.localeCompare(b.nameEn, "en") ||
            a.id.localeCompare(b.id)
          );
        });
        return {
          id: g.id,
          labelFa: g.labelFa,
          icons,
        };
      })
      .filter((s) => s.icons.length > 0);
  }, [filtered, debouncedQuery]);

  const groupCounts = useMemo(() => {
    const counts = new Map<DisplayGroupId, number>();
    for (const entry of iconManifest) {
      const gid = getDisplayGroupId(entry);
      counts.set(gid, (counts.get(gid) ?? 0) + 1);
    }
    return counts;
  }, []);

  const visibleGroups = useMemo(() => {
    return displayGroups.filter((g) => (groupCounts.get(g.id) ?? 0) > 0);
  }, [groupCounts]);

  const totalVisible = iconManifest.length;

  const isSearching = debouncedQuery.trim().length > 0;

  const isCustomized = customizer.size !== CUSTOMIZER_DEFAULTS.size;

  const selected: IconManifestEntry | undefined = selectedId
    ? iconManifest.find((e) => e.id === selectedId)
    : undefined;

  const selectedBrandColors =
    selected?.brandColors ??
    (selected ? BRAND_COLORS[selected.id] : undefined);

  const flashCopied = (kind: "svg" | "jsx" | "import" | "cli") => {
    if (copyTimer.current != null) {
      window.clearTimeout(copyTimer.current);
    }
    setCopiedKind(kind);
    copyTimer.current = window.setTimeout(() => setCopiedKind(null), 1200);
  };

  function scrollToGroup(id: DisplayGroupId | "all") {
    // Clear search so section anchors exist again.
    if (query.trim()) setQuery("");
    // «همه» only scrolls to top; highlight stays on the first category.
    setActiveGroup(id === "all" ? (visibleGroups[0]?.id ?? "all") : id);
    scrollingToRef.current = true;
    pendingScrollRef.current = id;
    setScrollNonce((n) => n + 1);
    setCatDrawerOpen(false);
  }

  function updateCustomizer(patch: Partial<typeof CUSTOMIZER_DEFAULTS>) {
    setCustomizer((prev) => ({ ...prev, ...patch }));
  }

  function resetCustomizer() {
    setCustomizer({ ...CUSTOMIZER_DEFAULTS });
  }

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      window.localStorage.setItem("sonojs-icons-theme", theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  // Tab discard / bfcache restore can remount without re-running the HTML boot script.
  useEffect(() => {
    const syncTheme = () => {
      try {
        const saved = window.localStorage.getItem("sonojs-icons-theme");
        if (saved === "light" || saved === "dark") {
          setTheme((prev) => (prev === saved ? prev : saved));
          document.documentElement.dataset.theme = saved;
        }
      } catch {
        /* ignore */
      }
    };
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) syncTheme();
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") syncTheme();
    };
    window.addEventListener("pageshow", onPageShow);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("pageshow", onPageShow);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        "sonojs-icons-customizer",
        JSON.stringify(customizer),
      );
    } catch {
      /* ignore */
    }
  }, [customizer]);

  useEffect(() => {
    return () => {
      if (copyTimer.current != null) {
        window.clearTimeout(copyTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    if (page !== "icons") return;
    setReady(true);
  }, [page]);

  const selectedIdRef = useRef(selectedId);
  selectedIdRef.current = selectedId;

  const onSelectIcon = useCallback(
    (id: string) => {
      setCopiedKind(null);
      const next = selectedIdRef.current === id ? null : id;
      applyRoute({ page: "icons", iconId: next }, "push");
    },
    [applyRoute],
  );

  useEffect(() => {
    const base = "SonoJS Icons";
    if (!selectedId) {
      document.title = base;
      return;
    }
    const entry = iconManifest.find((e) => e.id === selectedId);
    document.title = entry ? `${entry.nameEn} · ${base}` : base;
  }, [selectedId]);

  const onActiveGroup = useCallback((id: DisplayGroupId | "all") => {
    setActiveGroup(id);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        if (page !== "icons") return;
        e.preventDefault();
        window.setTimeout(() => searchRef.current?.focus(), 0);
      }
      if (e.key === "Escape") {
        if (selectedId) clearSelection();
        setNavOpen(false);
        setCatDrawerOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [page, selectedId, clearSelection]);

  useEffect(() => {
    if (!catDrawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [catDrawerOpen]);

  const cliLine = selected
    ? `npx @sonojs/icons add ${selected.id}`
    : "";
  const importLine = selected
    ? `import { ${selected.componentName} } from "@/components/icons/${selected.componentName}";`
    : "";
  const jsxLine = selected
    ? `<${selected.componentName} size={${previewSize}} />`
    : "";

  const showFaTitle =
    !!selected &&
    hasPersianScript(selected.nameFa) &&
    selected.nameFa.trim() !== selected.nameEn.trim();
  const drawerTitle = selected ? selected.nameEn : "";
  const drawerSubtitle =
    showFaTitle && selected ? selected.nameFa : null;

  const copySvg = async () => {
    const svg = previewRef.current?.querySelector("svg");
    if (!svg) return;
    const clone = svg.cloneNode(true) as SVGElement;
    clone.setAttribute("width", String(previewSize));
    clone.setAttribute("height", String(previewSize));
    const ok = await copyText(clone.outerHTML);
    if (ok) flashCopied("svg");
  };

  const copyJsx = async () => {
    const ok = await copyText(jsxLine);
    if (ok) flashCopied("jsx");
  };

  const copyCli = async () => {
    const ok = await copyText(cliLine);
    if (ok) flashCopied("cli");
  };

  const copyImport = async () => {
    const ok = await copyText(importLine);
    if (ok) flashCopied("import");
  };

  return (
    <div className="app">
      <header
        className={`site-nav ${navOpen ? "is-open" : ""}`}
        dir="ltr"
        lang="en"
      >
        <div className="site-nav-inner">
          <a
            className="nav-brand"
            href="https://sonojs.com/"
            aria-label="Sono"
          >
            <img
              className="nav-brand-logo"
              src="/images/logos/logo.svg"
              alt=""
              aria-hidden
              width={20}
              height={22}
            />
            <span className="nav-brand-text">Sono</span>
          </a>

          <nav className="nav-links" aria-label="Main">
            {SITE_NAV.map((item) =>
              "current" in item && item.current ? (
                <a
                  key={item.label}
                  className={`nav-ext ${page === "icons" ? "is-active" : ""}`}
                  href="#icons"
                  aria-current={page === "icons" ? "page" : undefined}
                  onClick={(e) => {
                    e.preventDefault();
                    go("icons");
                    setQuery("");
                    setActiveGroup("all");
                    scrollingToRef.current = false;
                    pendingScrollRef.current = null;
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                >
                  {item.label}
                </a>
              ) : (
                <a
                  key={item.label}
                  className="nav-ext"
                  href={item.href}
                >
                  {item.label}
                </a>
              ),
            )}
            <a
              className="nav-contribute"
              href={`${ICONS_REPO_URL}/issues/new`}
              target="_blank"
              rel="noopener noreferrer nofollow"
            >
              <PlusCircleIcon />
              <span>Suggest an icon</span>
            </a>
          </nav>

          <div className="nav-controls">
            <button
              type="button"
              className="install-chip"
              dir="ltr"
              lang="en"
              aria-label="Copy install command"
              title={installCopied ? "Copied" : "Copy install command"}
              onClick={async () => {
                const ok = await copyText(INSTALL_CMD);
                if (ok) {
                  setInstallCopied(true);
                  window.setTimeout(() => setInstallCopied(false), 1200);
                }
              }}
            >
              <code>{INSTALL_CMD}</code>
              {installCopied ? <CheckIcon /> : <CopyIcon />}
            </button>

            <a
              className="nav-star-btn"
              href={SONO_GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={
                starCount != null
                  ? `GitHub repository, ${formatGithubStars(starCount)} stars`
                  : "GitHub repository"
              }
            >
              <GitHubIcon />
              {starCount != null ? (
                <span className="nav-star-count" dir="ltr" lang="en">
                  {formatGithubStars(starCount)}
                </span>
              ) : null}
            </a>

            <button
              type="button"
              className="nav-icon-btn"
              aria-label={theme === "dark" ? "Light mode" : "Dark mode"}
              onClick={() =>
                setTheme((t) => (t === "dark" ? "light" : "dark"))
              }
            >
              {theme === "dark" ? <SunIcon /> : <MoonIcon />}
            </button>

            <button
              type="button"
              className={`nav-icon-btn hamburger ${navOpen ? "open" : ""}`}
              aria-label="Menu"
              aria-expanded={navOpen}
              onClick={() => setNavOpen((v) => !v)}
            >
              <MenuIcon />
            </button>
          </div>
        </div>

        {navOpen ? (
          <div className="mobile-nav" role="menu">
            <button
              type="button"
              className="mobile-install"
              dir="ltr"
              lang="en"
              role="menuitem"
              onClick={async () => {
                const ok = await copyText(INSTALL_CMD);
                if (ok) {
                  setInstallCopied(true);
                  window.setTimeout(() => setInstallCopied(false), 1200);
                }
                setNavOpen(false);
              }}
            >
              <code>{INSTALL_CMD}</code>
              {installCopied ? <CheckIcon /> : <CopyIcon />}
            </button>
            {SITE_NAV.map((item) =>
              "current" in item && item.current ? (
                <a
                  key={item.label}
                  className={`nav-ext ${page === "icons" ? "is-active" : ""}`}
                  href="#icons"
                  role="menuitem"
                  aria-current={page === "icons" ? "page" : undefined}
                  onClick={(e) => {
                    e.preventDefault();
                    go("icons");
                    setQuery("");
                    setActiveGroup("all");
                    setNavOpen(false);
                  }}
                >
                  {item.label}
                </a>
              ) : (
                <a
                  key={item.label}
                  className="nav-ext"
                  href={item.href}
                  role="menuitem"
                  onClick={() => setNavOpen(false)}
                >
                  {item.label}
                </a>
              ),
            )}
            <a
              className="nav-ext"
              href={`${ICONS_REPO_URL}/issues/new`}
              target="_blank"
              rel="noopener noreferrer nofollow"
              role="menuitem"
              onClick={() => setNavOpen(false)}
            >
              <PlusCircleIcon />
              <span>Suggest an icon</span>
            </a>
          </div>
        ) : null}
      </header>

      {page === "guide" ? (
        <div className="page doc-shell">
          <GuidePage />
        </div>
      ) : null}

      {page === "packages" ? (
        <div className="page doc-shell">
          <PackagesPage />
        </div>
      ) : null}

      {page === "icons" ? (
        <div className="page page-with-sidebar">
          <div
            className="gallery"
            ref={galleryRef}
            style={
              {
                "--icon-size": `${tileSize}px`,
              } as CSSProperties
            }
          >
            <div className="sticky-bar">
              <label className="search" dir="ltr" lang="en">
                <SearchIcon />
                <span className="search-field">
                  <input
                    ref={searchRef}
                    type="search"
                    dir="ltr"
                    lang="en"
                    placeholder="Search icons"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => {
                      if (window.scrollY > 0) {
                        window.scrollTo({ top: 0, behavior: "auto" });
                      }
                    }}
                    aria-label="Search icons"
                  />
                  {query.trim() ? (
                    <button
                      type="button"
                      className="search-clear"
                      aria-label="Clear search"
                      title="Clear"
                      onClick={(e) => {
                        e.preventDefault();
                        setQuery("");
                        window.setTimeout(() => searchRef.current?.focus(), 0);
                      }}
                    >
                      <SearchClearIcon />
                    </button>
                  ) : null}
                </span>
                <span className="kbd">Ctrl+K</span>
              </label>
              <button
                type="button"
                className="cat-menu-btn"
                aria-label="Categories"
                aria-expanded={catDrawerOpen}
                aria-controls="cat-sidebar"
                title="Categories"
                onClick={() => setCatDrawerOpen(true)}
              >
                <CategoriesIcon />
              </button>
            </div>

            <div className="grid-wrap">
              <VirtualIconGallery
                sections={sections}
                filtered={filtered}
                isSearching={isSearching}
                tileSize={tileSize}
                selectedId={selectedId}
                onSelect={onSelectIcon}
                pendingScrollRef={pendingScrollRef}
                scrollNonce={scrollNonce}
                scrollingToRef={scrollingToRef}
                onActiveGroup={onActiveGroup}
              />
            </div>
          </div>

          {catDrawerOpen ? (
            <button
              type="button"
              className="cat-drawer-backdrop"
              aria-label="Close categories"
              onClick={() => setCatDrawerOpen(false)}
            />
          ) : null}

          <aside
            id="cat-sidebar"
            className={`cat-sidebar ${catDrawerOpen ? "is-open" : ""}`}
            aria-label="Categories"
            dir="ltr"
            lang="en"
          >
            <div className="cat-sidebar-head">
              <h2 className="cat-sidebar-title">SonoJS Icons</h2>
              <button
                type="button"
                className="cat-sidebar-close"
                aria-label="Close"
                onClick={() => setCatDrawerOpen(false)}
              >
                <DrawerCloseIcon />
              </button>
            </div>
            <div
              className={`customizer-card ${isCustomized ? "customized" : ""}`}
              dir="ltr"
              lang="en"
            >
              <div className="customizer-header">
                <h2 className="customizer-title">Display</h2>
                <button
                  type="button"
                  className="customizer-reset"
                  disabled={!isCustomized}
                  onClick={resetCustomizer}
                  aria-label="Reset"
                >
                  <ResetIcon />
                </button>
              </div>

              <div className="customizer-size-row">
                <input
                  type="range"
                  className="customizer-size-slider"
                  min={16}
                  max={40}
                  step={1}
                  value={tileSize}
                  onChange={(e) =>
                    updateCustomizer({ size: Number(e.target.value) })
                  }
                  aria-label="Icon size"
                />
                <span className="customizer-value" dir="ltr" lang="en">
                  {tileSize}px
                </span>
              </div>

            </div>

            <div
              className="cat-list"
              role="listbox"
              aria-label="Icon categories"
            >
              <button
                type="button"
                className="cat-row"
                role="option"
                aria-selected={false}
                onClick={() => scrollToGroup("all")}
              >
                <span className="cat-row-label">
                  <span className="cat-fa">All categories</span>
                </span>
                <span className="cat-count" dir="ltr" lang="en">
                  {totalVisible}
                </span>
              </button>

              {visibleGroups.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  className={`cat-row ${activeGroup === g.id && !isSearching ? "active" : ""}`}
                  role="option"
                  aria-selected={activeGroup === g.id}
                  onClick={() => scrollToGroup(g.id)}
                >
                  <span className="cat-row-label">
                    <span className="cat-fa">{g.labelFa}</span>
                  </span>
                  <span className="cat-count" dir="ltr" lang="en">
                    {groupCounts.get(g.id) ?? 0}
                  </span>
                </button>
              ))}
            </div>
          </aside>
        </div>
      ) : null}

      {page === "icons" && selected ? (
        <>
          <button
            type="button"
            className="drawer-backdrop"
            aria-label="Close details"
            onClick={clearSelection}
          />
          <section className="drawer" aria-label={`${drawerTitle} details`}>
            <div className="drawer-preview-col">
              <div
                ref={previewRef}
                className={`drawer-preview ${needsLightPad(selected) ? "drawer-preview--light-pad" : ""}`}
              >
                <LogoIcon
                  name={selected.id}
                  size={previewRenderPx}
                  title={drawerTitle}
                />
              </div>
              <div
                className="size-chips"
                role="group"
                aria-label="Export size"
                dir="ltr"
                lang="en"
              >
                {PREVIEW_SIZES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={`size-chip ${previewSize === s ? "active" : ""}`}
                    onClick={() => setPreviewSize(s)}
                    aria-pressed={previewSize === s}
                    aria-label={`${s} pixels`}
                    title={`${s}px`}
                  >
                    {s}
                  </button>
                ))}
                <span className="size-chips-unit" aria-hidden="true">
                  px
                </span>
              </div>
              <button
                type="button"
                className={`copy-svg-btn confetti-btn ${copiedKind === "svg" ? "animate" : ""}`}
                data-confetti-text="Copied"
                onClick={copySvg}
              >
                Copy SVG
              </button>
            </div>

            <div className="drawer-body">
              <div className="drawer-head">
                <div className="drawer-titles">
                  <div className="drawer-title-row">
                    <h2 className="drawer-title" dir="ltr" lang="en">
                      {drawerTitle}
                    </h2>
                  </div>
                  {drawerSubtitle ? (
                    <p className="drawer-en" dir="rtl" lang="fa">
                      {drawerSubtitle}
                    </p>
                  ) : null}
                </div>
                <div className="drawer-head-actions">
                  {selected.sourceUrl ? (
                    <a
                      className="drawer-source-link"
                      href={selected.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      title={selected.sourceUrl}
                      aria-label="Source"
                    >
                      <ExternalLinkIcon />
                    </a>
                  ) : null}
                  <button
                    type="button"
                    className="drawer-close"
                    aria-label="Close"
                    onClick={clearSelection}
                  >
                    ×
                  </button>
                </div>
              </div>

              {selectedBrandColors && selectedBrandColors.length > 0 ? (
                <div
                  className="brand-colors"
                  dir="ltr"
                  lang="en"
                  aria-label="Brand colors"
                >
                  {selectedBrandColors.map((hex) => (
                    <button
                      key={hex}
                      type="button"
                      className={`brand-swatch confetti-btn ${copiedColor === hex ? "animate" : ""}`}
                      style={{ ["--swatch" as string]: hex }}
                      data-confetti-text="Copied"
                      title={
                        copiedColor === hex ? "Copied" : `Copy ${hex}`
                      }
                      aria-label={`Copy color ${hex}`}
                      onClick={async () => {
                        const ok = await copyText(hex);
                        if (ok) {
                          setCopiedColor(hex);
                          window.setTimeout(
                            () => setCopiedColor(null),
                            1200,
                          );
                        }
                      }}
                    >
                      <span className="brand-swatch-chip" />
                      <span className="brand-swatch-hex">{hex}</span>
                    </button>
                  ))}
                </div>
              ) : null}

              <div className="import-block">
                <button
                  type="button"
                  className={`import-copy confetti-btn ${copiedKind === "cli" ? "animate" : ""}`}
                  data-confetti-text="Copied"
                  onClick={copyCli}
                  aria-label={
                    copiedKind === "cli" ? "Copied" : "Copy CLI command"
                  }
                  title={copiedKind === "cli" ? "Copied" : "Copy"}
                >
                  {copiedKind === "cli" ? <CheckIcon /> : <CopyIcon />}
                </button>
                <pre className="import-code" aria-label="CLI add command" dir="ltr">
                  <code>
                    <span className="tok-kw">npx</span>{" "}
                    <span className="tok-id">@sonojs/icons</span>{" "}
                    <span className="tok-kw">add</span>{" "}
                    <span className="tok-str">{selected.id}</span>
                  </code>
                </pre>
              </div>

              <div className="import-block">
                <button
                  type="button"
                  className={`import-copy confetti-btn ${copiedKind === "import" ? "animate" : ""}`}
                  data-confetti-text="Copied"
                  onClick={copyImport}
                  aria-label={
                    copiedKind === "import" ? "Copied" : "Copy local import"
                  }
                  title={copiedKind === "import" ? "Copied" : "Copy"}
                >
                  {copiedKind === "import" ? <CheckIcon /> : <CopyIcon />}
                </button>
                <pre className="import-code" aria-label="Local import statement">
                  <code>
                    <span className="tok-kw">import</span>
                    <span className="tok-punc"> {"{"} </span>
                    <span className="tok-id">{selected.componentName}</span>
                    <span className="tok-punc"> {"}"} </span>
                    <span className="tok-kw">from</span>{" "}
                    <span className="tok-str">
                      {`"@/components/icons/${selected.componentName}"`}
                    </span>
                    <span className="tok-punc">;</span>
                  </code>
                </pre>
              </div>

              <div className="import-block">
                <button
                  type="button"
                  className={`import-copy confetti-btn ${copiedKind === "jsx" ? "animate" : ""}`}
                  data-confetti-text="Copied"
                  onClick={copyJsx}
                  aria-label={
                    copiedKind === "jsx" ? "Copied" : "Copy JSX"
                  }
                  title={copiedKind === "jsx" ? "Copied" : "Copy"}
                >
                  {copiedKind === "jsx" ? <CheckIcon /> : <CopyIcon />}
                </button>
                <pre
                  className="import-code"
                  aria-label="JSX usage"
                  dir="ltr"
                >
                  <code>
                    <span className="tok-punc">&lt;</span>
                    <span className="tok-id">{selected.componentName}</span>{" "}
                    <span className="tok-kw">size</span>
                    <span className="tok-punc">={"{"}</span>
                    <span className="tok-num">{previewSize}</span>
                    <span className="tok-punc">{"}"}</span>{" "}
                    <span className="tok-punc">/&gt;</span>
                  </code>
                </pre>
              </div>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
