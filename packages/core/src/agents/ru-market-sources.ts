/** Russian book-market observations. Supply is not readership or sales. */
export interface RussianMarketObservation {
  readonly source: "litmarket";
  readonly genre: string;
  readonly booksCount: number;
  readonly metric: "published_books";
  readonly url: string;
  readonly collectedAt: string;
}

export interface RussianMarketRankedBook {
  readonly source: "litnet";
  readonly title: string;
  readonly author: string;
  readonly rank: number;
  readonly metric: "listing_position";
  readonly url: string;
  readonly collectedAt: string;
}

export interface AuthorTodayRankedBook {
  readonly source: "author-today";
  readonly title: string;
  readonly author: string;
  readonly rank: number;
  readonly metric: "listing_position";
  readonly period: "month";
  readonly url: string;
  readonly collectedAt: string;
}

export function parseAuthorTodayMonthly(html: string, collectedAt: string): AuthorTodayRankedBook[] {
  const blocks = html.split(/<div\s+class=["']book-row["'][^>]*>/i).slice(1);
  const results: AuthorTodayRankedBook[] = [];
  const seen = new Set<string>();
  for (const block of blocks) {
    const title = block.match(/<div\s+class=["']book-title["'][^>]*>\s*<a\b[^>]*href=["'](\/work\/\d+)["'][^>]*>([\s\S]*?)<\/a>/i);
    if (!title || seen.has(title[1])) continue;
    const authorBlock = block.match(/<div\s+class=["']book-author["'][^>]*>([\s\S]*?)<\/div>/i);
    const cleanTitle = decodeHtmlText(title[2]);
    if (!cleanTitle) continue;
    seen.add(title[1]);
    results.push({ source: "author-today", title: cleanTitle,
      author: authorBlock ? decodeHtmlText(authorBlock[1]).replace(/\s+,/g, ",") : "",
      rank: results.length + 1, metric: "listing_position", period: "month",
      url: `https://author.today${title[1]}`, collectedAt });
    if (results.length >= 50) break;
  }
  return results;
}

export async function fetchAuthorTodayMonthly(fetchImpl: typeof fetch = fetch): Promise<AuthorTodayRankedBook[]> {
  const response = await fetchImpl("https://author.today/work/genre/all?rp=month&eg=-&fnd=false&page=1", {
    headers: { Accept: "text/html" }, signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`Author.Today: HTTP ${response.status}`);
  const items = parseAuthorTodayMonthly(await response.text(), new Date().toISOString());
  if (!items.length) throw new Error("Author.Today: произведения не найдены или изменилась разметка");
  return items;
}

function decodeHtmlText(s: string): string {
  return s.replace(/<[^>]*>/g, " ").replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&").replace(/&quot;/gi, '"')
    .replace(/&#(\d+);/g, (_m, n: string) => String.fromCodePoint(Number(n)))
    .replace(/\s+/g, " ").trim();
}

export function parseLitnetPopular(html: string, collectedAt: string): RussianMarketRankedBook[] {
  const blocks = html.split(/<div\b[^>]*class=["'][^"']*\bbook-item\b[^"']*["'][^>]*>/i).slice(1);
  const result: RussianMarketRankedBook[] = [];
  const seen = new Set<string>();
  for (const block of blocks) {
    const title = block.match(/<h4\b[^>]*class=["'][^"']*\bbook-title\b[^"']*["'][^>]*>\s*<a\s+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/i);
    if (!title) continue;
    const url = new URL(title[1], "https://litnet.com");
    if (url.origin !== "https://litnet.com" || !/^\/ru\/book\/[^/]+-b\d+/.test(url.pathname) || seen.has(url.pathname)) continue;
    const author = block.match(/<a\b[^>]*class=["'][^"']*\bauthor\b[^"']*["'][^>]*>([\s\S]*?)<\/a>/i);
    const cleanTitle = decodeHtmlText(title[2]);
    if (!cleanTitle) continue;
    seen.add(url.pathname);
    result.push({ source: "litnet", title: cleanTitle, author: author ? decodeHtmlText(author[1]) : "",
      rank: result.length + 1, metric: "listing_position", url: url.href, collectedAt });
    if (result.length >= 50) break;
  }
  return result;
}

export async function fetchLitnetPopular(fetchImpl: typeof fetch = fetch): Promise<RussianMarketRankedBook[]> {
  const response = await fetchImpl("https://litnet.com/ru/popular", {
    headers: { Accept: "text/html" }, signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`Литнет: HTTP ${response.status}`);
  const items = parseLitnetPopular(await response.text(), new Date().toISOString());
  if (!items.length) throw new Error("Литнет: карточки книг недоступны или изменилась разметка");
  return items;
}

export function parseLitmarketGenres(html: string, collectedAt: string): RussianMarketObservation[] {
  const scripts = [...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  const observations: RussianMarketObservation[] = [];
  const seen = new Set<string>();
  for (const script of scripts) {
    let data: unknown;
    try { data = JSON.parse(script[1] ?? ""); } catch { continue; }
    if (!data || typeof data !== "object") continue;
    const object = data as Record<string, unknown>;
    if (object["@type"] !== "ItemList" || !Array.isArray(object.itemListElement)) continue;
    for (const element of object.itemListElement) {
      if (!element || typeof element !== "object") continue;
      const item = (element as { item?: unknown }).item;
      if (!item || typeof item !== "object") continue;
      const info = item as Record<string, unknown>;
      if (typeof info.name !== "string" || typeof info.url !== "string" || typeof info.description !== "string") continue;
      let url: URL;
      try { url = new URL(info.url); } catch { continue; }
      if (url.protocol !== "https:" || url.hostname !== "litmarket.ru" || !url.pathname.startsWith("/books/genres/")) continue;
      const count = info.description.match(/([\d\s\u00a0]+)\s+произведени[йя]/i);
      if (!count) continue;
      const booksCount = Number(count[1].replace(/\s/g, ""));
      if (!Number.isSafeInteger(booksCount) || booksCount < 0 || seen.has(url.href)) continue;
      seen.add(url.href);
      observations.push({ source: "litmarket", genre: info.name.trim(), booksCount, metric: "published_books", url: url.href, collectedAt });
    }
  }
  return observations;
}

export async function fetchLitmarketGenres(fetchImpl: typeof fetch = fetch): Promise<RussianMarketObservation[]> {
  const response = await fetchImpl("https://litmarket.ru/genres", {
    headers: { Accept: "text/html" },
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`Литмаркет: HTTP ${response.status}`);
  const observations = parseLitmarketGenres(await response.text(), new Date().toISOString());
  if (!observations.length) throw new Error("Литмаркет: данные о жанрах не найдены или изменился формат страницы");
  return observations;
}
