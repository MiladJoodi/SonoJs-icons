/** Normalize Persian/Arabic digits, letters, ZWNJ, and separators for search. */
export function normalizeSearch(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/ي/g, "ی")
    .replace(/ى/g, "ی") // alef maksura
    .replace(/ك/g, "ک")
    .replace(/ة/g, "ه")
    .replace(/ۀ/g, "ه")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ی")
    // ZWNJ / soft hyphen → space so «فارسی‌یوآی» keeps token «فارسی»
    .replace(/[\u200c\u00ad]/g, " ")
    .replace(/\u200d/g, "") // ZWJ
    .replace(/[_\-./\\:+،,]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Same as normalize, but with all spaces removed (دیجی کالا ≈ دیجیکالا). */
export function compactSearch(input: string): string {
  return normalizeSearch(input).replace(/\s+/g, "");
}

/** Split PascalCase / kebab / snake into searchable tokens. */
function splitIdentifiers(value: string): string[] {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .replace(/Icon$/i, "")
    .split(/[\s_\-/]+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
}

/**
 * Extra aliases so FA ↔ EN nicknames hit catalog names.
 * Values are matched against id / nameEn / nameFa / componentName.
 */
const ALIASES: Record<string, string[]> = {
  "دیجی کالا": ["digikala", "دیجیکالا"],
  دیجیکالا: ["digikala"],
  دیوار: ["divar"],
  اسنپ: ["snap", "snapp"],
  تپسی: ["tapsi"],
  آپارات: ["aparat"],
  فیلیمو: ["filimo"],
  نماوا: ["namava"],
  "زرین پال": ["zarinpal"],
  زرینپال: ["zarinpal"],
  شاپرک: ["shaparak"],
  "بانک ملی": ["melli", "bank-melli"],
  ملی: ["melli"],
  ملت: ["mellat"],
  سامان: ["saman"],
  پارسیان: ["parsian"],
  پاسارگاد: ["pasargad"],
  صادرات: ["saderat"],
  تجارت: ["tejarat"],
  مسکن: ["maskan"],
  رفاه: ["refah"],
  سپه: ["sepah"],
  کشاورزی: ["keshavarzi"],
  "کافه بازار": ["cafebazar", "bazar"],
  کافهبازار: ["cafebazar", "bazar"],
  مایکت: ["myket"],
  روبیکا: ["rubika"],
  ایتا: ["eitaa"],
  بله: ["bale"],
  علمی: ["shenakhti"],
  "مرکز شناختی": ["shenakhti"],
  "علم و صنعت": ["shenakhti"],
  shenakhti: ["shenakhti"],
  elmi: ["shenakhti"],
  "وایب فارسی": ["vibefarsi"],
  وایب: ["vibefarsi"],
  vibefarsi: ["vibefarsi"],
  vibe: ["vibefarsi"],
  "banana ai": ["banana-ai"],
  banana: ["banana-ai"],
  بنانا: ["banana-ai"],
  ویرگول: ["virgool"],
  virgool: ["virgool"],
  فارسی: ["vibefarsi"],
  pixevel: ["pixevel"],
  پیکسیول: ["pixevel"],
  پیکسی: ["pixevel"],
  gapgpt: ["gapgpt"],
  "gap gpt": ["gapgpt"],
  گپ: ["gapgpt"],
  "گپ جی پی تی": ["gapgpt"],
  گپجیپیتی: ["gapgpt"],
  easycandle: ["easycandle"],
  "easy candle": ["easycandle"],
  ایزیکندل: ["easycandle"],
  "ایزی کندل": ["easycandle"],
  claude: ["claude", "dev-claude"],
  کلود: ["claude", "dev-claude"],
  کلاود: ["claude", "dev-claude"],
  anthropic: ["claude"],
  vercel: ["vercel", "dev-vercel"],
  ورسل: ["vercel", "dev-vercel"],
  ویرسل: ["vercel", "dev-vercel"],

  تلگرام: ["telegram", "social-telegram", "dev-telegram"],
  واتساپ: ["whatsapp", "social-whatsapp", "dev-whatsapp"],
  اینستا: ["instagram", "social-instagram"],
  اینستاگرام: ["instagram", "social-instagram"],
  فیسبوک: ["facebook", "social-facebook"],
  فیس‌بوک: ["facebook", "social-facebook"],
  لینکدین: ["linkedin", "social-linkedin"],
  یوتیوب: ["youtube", "social-youtube", "dev-youtube"],
  تیک‌تاک: ["tiktok", "social-tiktok", "dev-tiktok"],
  تیکتاک: ["tiktok", "social-tiktok"],
  گیتهاب: ["github", "social-github", "dev-github"],
  "گیت هاب": ["github", "social-github", "dev-github"],
  جیمیل: ["gmail", "social-gmail"],
  گوگل: ["google", "social-google"],
  وایبر: ["viber", "social-viber"],
  اسکایپ: ["skype", "social-skype"],
  ری‌اکت: ["react", "dev-react"],
  ریکت: ["react", "dev-react"],
  نکست: ["nextjs", "dev-nextjs"],
  فیگما: ["figma", "dev-figma"],
  داکر: ["docker", "dev-docker"],
  دیسکورد: ["discord", "dev-discord"],
  انگولار: ["angular", "dev-angular"],
  کوبرنتیز: ["kubernetes", "dev-kubernetes"],
  k8s: ["kubernetes", "dev-kubernetes"],
  جاوا: ["java", "dev-java"],
  سی‌شارپ: ["c-sharp", "dev-c-sharp"],
  csharp: ["c-sharp", "dev-c-sharp"],
  وردپرس: ["wordpress", "dev-wordpress"],
  استرایپ: ["stripe", "dev-stripe"],
  شاپیفای: ["shopify", "dev-shopify"],
  کروم: ["chrome", "dev-chrome"],
  فایرفاکس: ["firefox", "dev-firefox"],
  یونیتی: ["unity", "dev-unity"],
  پای‌تورچ: ["pytorch", "dev-pytorch"],
  تنسورفلو: ["tensorflow", "dev-tensorflow"],
  جیرا: ["jira", "dev-jira"],
  جنکینز: ["jenkins", "dev-jenkins"],
  نتلی‌فای: ["netlify", "dev-netlify"],
  نتلیفای: ["netlify", "dev-netlify"],
  netlify: ["netlify", "dev-netlify"],
  کنوا: ["canva", "dev-canva"],
  اوبونتو: ["ubuntu", "dev-ubuntu"],
  پی‌پال: ["paypal", "dev-paypal"],
  "گوگل کلاد": ["google-cloud", "dev-google-cloud"],
  gcp: ["google-cloud", "dev-google-cloud"],
  aws: ["dev-aws"],
  ریداکس: ["redux", "dev-redux"],
  رداکس: ["redux", "dev-redux"],
  اسپرینگ: ["spring", "dev-spring"],
  روبی: ["ruby", "dev-ruby"],
  ریلز: ["rails", "dev-rails"],

  نوبیتکس: ["nobitex"],
  "اسنپ فود": ["snappfood", "snapp-food"],
  اسنپفود: ["snappfood"],
  ترب: ["torob"],
  شیپور: ["sheypoor"],
  "علی بابا": ["alibaba"],
  علیبابا: ["alibaba"],
  نشان: ["neshan"],
  بلد: ["balad"],
  ایرانسل: ["irancell"],
  "همراه اول": ["mci", "hamrah"],
  همراه: ["hamrah", "mci"],
  رایتل: ["rightel"],
  پست: ["post"],
  برق: ["electricity", "lps-electricity"],
  گاز: ["gas"],
  آب: ["water"],
  مخابرات: ["mokhaberat", "telecom"],
  پرسپولیس: ["perspolis", "persepolis"],
  استقلال: ["esteghlal"],
  سپاهان: ["sepahan"],
  تراکتور: ["tractor"],
  شریف: ["sharif"],
  تهران: ["tehran"],
  امیرکبیر: ["amirkabir", "akut"],

  بیتکوین: ["bitcoin", "btc", "crypto-btc"],
  "بیت کوین": ["bitcoin", "btc"],
  ethereum: ["eth", "crypto-eth"],
  اتریوم: ["ethereum", "eth"],
  تتر: ["tether", "usdt"],
};

type AliasEntry = { alias: string; aliasCompact: string; targets: string[] };

function buildAliasEntries(
  raw: Record<string, string[]>,
): AliasEntry[] {
  const map = new Map<string, Set<string>>();
  const add = (key: string, targets: string[]) => {
    const k = normalizeSearch(key);
    if (!k) return;
    let set = map.get(k);
    if (!set) {
      set = new Set();
      map.set(k, set);
    }
    for (const t of targets) {
      const nt = normalizeSearch(t);
      if (nt) set.add(nt);
    }
  };

  for (const [alias, targets] of Object.entries(raw)) {
    add(alias, targets);
    // Bidirectional for longer keys (avoid flooding short nicknames).
    if (normalizeSearch(alias).replace(/\s+/g, "").length >= 3) {
      for (const t of targets) {
        if (normalizeSearch(t).replace(/\s+/g, "").length >= 3) {
          add(t, [alias]);
        }
      }
    }
  }

  return [...map.entries()].map(([alias, targets]) => ({
    alias,
    aliasCompact: alias.replace(/\s+/g, ""),
    targets: [...targets],
  }));
}

const ALIAS_ENTRIES: AliasEntry[] = buildAliasEntries(ALIASES);

export type SearchableEntry = {
  id: string;
  nameFa: string;
  nameEn: string;
  componentName: string;
  category: string;
  source?: string;
};

type Haystack = {
  text: string;
  compact: string;
};

/**
 * Optional id prefixes from asset packs — stripped so pack names are not
 * searchable. Extend when you add new pack prefixes under assets/.
 * Longer prefixes first.
 */
const SOURCE_ID_PREFIXES: string[] = [];

/** Categories that are packaging buckets, not topical brands. */
const HIDDEN_SEARCH_CATEGORIES = new Set(["manual"]);

/** Strip source pack prefix from a catalog id for search/scoring. */
export function searchableId(id: string): string {
  const lower = id.toLowerCase();
  for (const prefix of SOURCE_ID_PREFIXES) {
    if (lower.startsWith(prefix)) return id.slice(prefix.length);
  }
  return id;
}

/** One-time haystack per catalog id (normalized). */
const haystackById = new Map<string, Haystack>();

function buildHaystack(entry: SearchableEntry): Haystack {
  const bareId = searchableId(entry.id);
  const idBits = splitIdentifiers(bareId);
  const nameBits = splitIdentifiers(entry.componentName);
  const parts = [
    bareId,
    entry.nameFa,
    entry.nameEn,
    entry.componentName,
    entry.componentName.replace(/Icon$/i, ""),
    // Topical categories only — skip packaging buckets.
    HIDDEN_SEARCH_CATEGORIES.has(entry.category) ? "" : entry.category,
    // Never index `source` pack ids.
    ...idBits,
    ...nameBits,
  ];
  const text = normalizeSearch(parts.join(" "));
  const compact = compactSearch(parts.join(" "));
  return { text, compact };
}

export function buildSearchIndex(entries: readonly SearchableEntry[]): void {
  haystackById.clear();
  for (const entry of entries) {
    haystackById.set(entry.id, buildHaystack(entry));
  }
}

function getHaystack(entry: SearchableEntry): Haystack {
  return haystackById.get(entry.id) ?? buildHaystack(entry);
}

export function expandQueryTerms(query: string): string[] {
  const n = normalizeSearch(query);
  if (!n) return [];
  const compact = n.replace(/\s+/g, "");
  const terms = new Set<string>([n, compact]);

  for (const word of n.split(" ").filter(Boolean)) {
    terms.add(word);
    terms.add(word.replace(/\s+/g, ""));
  }

  if (compact.length >= 2) {
    for (const { alias, aliasCompact, targets } of ALIAS_ENTRIES) {
      if (
        n.includes(alias) ||
        alias.includes(n) ||
        compact.includes(aliasCompact) ||
        aliasCompact.includes(compact)
      ) {
        for (const t of targets) {
          terms.add(t);
          terms.add(t.replace(/\s+/g, ""));
        }
      }
    }
  }

  return [...terms].filter(Boolean);
}

function termHitsHaystack(hay: Haystack, term: string): boolean {
  const n = normalizeSearch(term);
  if (!n) return false;
  const c = n.replace(/\s+/g, "");
  if (hay.text.includes(n) || hay.compact.includes(c)) return true;
  // Prefix token match: "meli" → "melli"
  if (c.length >= 2) {
    for (const tok of hay.text.split(" ")) {
      if (tok.startsWith(c) || compactSearch(tok).startsWith(c)) return true;
    }
  }
  return false;
}

/**
 * Single-token queries match via aliases / substring / prefix.
 * Multi-word queries require every word to hit (AND), so "بانک ملی"
 * stays precise while "gap gpt" still finds GapGPT.
 */
export function entryMatchesQuery(
  entry: SearchableEntry,
  query: string,
): boolean {
  const raw = normalizeSearch(query);
  if (!raw) return true;

  const hay = getHaystack(entry);
  if (termHitsHaystack(hay, raw)) return true;

  const words = raw.split(" ").filter((w) => w.length > 0);

  if (words.length === 1) {
    return expandQueryTerms(query).some((t) => termHitsHaystack(hay, t));
  }

  return words.every((w) =>
    expandQueryTerms(w).some((t) => termHitsHaystack(hay, t)),
  );
}

/** Lower is better. Used to rank search results. */
export function scoreEntry(entry: SearchableEntry, query: string): number {
  const q = normalizeSearch(query);
  if (!q) return 999;
  const qc = q.replace(/\s+/g, "");
  const id = normalizeSearch(searchableId(entry.id));
  const idc = id.replace(/\s+/g, "");
  const en = normalizeSearch(entry.nameEn);
  const fa = normalizeSearch(entry.nameFa);
  const enc = en.replace(/\s+/g, "");
  const fac = fa.replace(/\s+/g, "");

  if (id === q || idc === qc || en === q || fa === q || enc === qc || fac === qc)
    return 0;
  if (id.startsWith(q) || idc.startsWith(qc)) return 1;
  if (en.startsWith(q) || fa.startsWith(q) || enc.startsWith(qc) || fac.startsWith(qc))
    return 2;
  if (id.includes(q) || idc.includes(qc)) return 3;
  if (en.includes(q) || fa.includes(q) || enc.includes(qc) || fac.includes(qc))
    return 4;
  return 5;
}

/** Filter + rank catalog entries for a query. */
export function searchEntries<T extends SearchableEntry>(
  entries: readonly T[],
  query: string,
): T[] {
  // Rebuild when catalog grows/shrinks (HMR after generate:*).
  if (haystackById.size !== entries.length) {
    buildSearchIndex(entries);
  }
  if (!normalizeSearch(query)) return [...entries];
  return entries
    .filter((e) => entryMatchesQuery(e, query))
    .sort((a, b) => {
      const d = scoreEntry(a, query) - scoreEntry(b, query);
      if (d !== 0) return d;
      return a.nameEn.localeCompare(b.nameEn);
    });
}
