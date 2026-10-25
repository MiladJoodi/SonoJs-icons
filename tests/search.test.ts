import { describe, expect, it } from "vitest";
import {
  buildSearchIndex,
  compactSearch,
  entryMatchesQuery,
  normalizeSearch,
  searchEntries,
  type SearchableEntry,
} from "../playground/src/search";

const catalog: SearchableEntry[] = [
  {
    id: "bank-melli",
    nameFa: "بانک ملی",
    nameEn: "Bank Melli",
    componentName: "BankMelliIcon",
    category: "banks",
  },
  {
    id: "shop-example",
    nameFa: "فروشگاه نمونه",
    nameEn: "Example Shop",
    componentName: "ExampleShopIcon",
    category: "retail",
    source: "manual",
  },
  {
    id: "gapgpt",
    nameFa: "گپ‌جی‌پی‌تی",
    nameEn: "GapGPT",
    componentName: "GapGPTIcon",
    category: "manual",
    source: "manual",
  },
  {
    id: "easycandle",
    nameFa: "ایزی‌کندل",
    nameEn: "EasyCandle",
    componentName: "EasycandleIcon",
    category: "manual",
  },
  {
    id: "social-telegram",
    nameFa: "تلگرام",
    nameEn: "Telegram",
    componentName: "TelegramIcon",
    category: "social",
  },
];

buildSearchIndex(catalog);

describe("normalizeSearch", () => {
  it("unifies arabic yeh/kaf and digits", () => {
    expect(normalizeSearch("ديجي‌كالا ۱۲")).toBe("دیجی کالا 12");
  });

  it("compacts zwnj and spaces the same way", () => {
    expect(compactSearch("دیجی‌کالا")).toBe(compactSearch("دیجی کالا"));
  });
});

describe("entryMatchesQuery FA/EN", () => {
  it("finds shop via English and Persian forms", () => {
    const shop = catalog[1]!;
    expect(entryMatchesQuery(shop, "example shop")).toBe(true);
    expect(entryMatchesQuery(shop, "فروشگاه")).toBe(true);
  });

  it("does not match packaging source against every manual icon", () => {
    const shop = catalog[1]!;
    expect(entryMatchesQuery(shop, "manual")).toBe(false);
    expect(entryMatchesQuery(shop, "example")).toBe(true);
  });

  it("finds bank melli via FA and EN", () => {
    const melli = catalog[0]!;
    expect(entryMatchesQuery(melli, "melli")).toBe(true);
    expect(entryMatchesQuery(melli, "بانک ملی")).toBe(true);
    expect(entryMatchesQuery(melli, "ملی")).toBe(true);
    expect(entryMatchesQuery(melli, "Bank Melli")).toBe(true);
  });

  it("finds gapgpt via FA nicknames and spaced EN", () => {
    const gap = catalog[2]!;
    expect(entryMatchesQuery(gap, "gapgpt")).toBe(true);
    expect(entryMatchesQuery(gap, "gap gpt")).toBe(true);
    expect(entryMatchesQuery(gap, "گپ")).toBe(true);
  });

  it("finds easycandle despite zwnj in nameFa", () => {
    const easy = catalog[3]!;
    expect(entryMatchesQuery(easy, "ایزی کندل")).toBe(true);
    expect(entryMatchesQuery(easy, "easycandle")).toBe(true);
  });

  it("finds telegram via Persian alias", () => {
    expect(entryMatchesQuery(catalog[4]!, "تلگرام")).toBe(true);
  });
});

describe("searchEntries ranking", () => {
  it("ranks exact id ahead of weaker hits", () => {
    const wider: SearchableEntry[] = [
      ...catalog,
      {
        id: "melli-extra",
        nameFa: "ملی تست",
        nameEn: "Melli Extra",
        componentName: "MelliExtraIcon",
        category: "banks",
      },
    ];
    buildSearchIndex(wider);
    const hits = searchEntries(wider, "bank-melli");
    expect(hits[0]?.id).toBe("bank-melli");
  });
});
