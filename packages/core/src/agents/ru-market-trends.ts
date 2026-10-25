import type { RussianMarketObservation } from "./ru-market-sources.js";

export interface MarketSnapshot {
  readonly timestamp: string;
  readonly sources: ReadonlyArray<{ readonly source: string; readonly status: string; readonly items: ReadonlyArray<unknown> }>;
}

export interface GenreChange {
  readonly genre: string;
  readonly previous: number;
  readonly current: number;
  readonly delta: number;
  readonly percent: number | null;
  readonly url: string;
}

/** Compare only identical supply metrics; ranked lists cannot be summed or treated as sales. */
export function compareRussianMarketSnapshots(previous: MarketSnapshot, current: MarketSnapshot): GenreChange[] {
  const getGenres = (snapshot: MarketSnapshot): Map<string, RussianMarketObservation> => {
    const source = snapshot.sources.find((entry) => entry.source === "litmarket" && entry.status === "ok");
    const map = new Map<string, RussianMarketObservation>();
    for (const item of source?.items ?? []) {
      if (!item || typeof item !== "object") continue;
      const value = item as Partial<RussianMarketObservation>;
      if (value.source !== "litmarket" || value.metric !== "published_books" || typeof value.genre !== "string" ||
        typeof value.booksCount !== "number" || !Number.isSafeInteger(value.booksCount) || value.booksCount < 0 ||
        typeof value.url !== "string") continue;
      map.set(value.genre, value as RussianMarketObservation);
    }
    return map;
  };
  const before = getGenres(previous);
  const after = getGenres(current);
  const changes: GenreChange[] = [];
  for (const [genre, value] of after) {
    const old = before.get(genre);
    if (!old) continue;
    const delta = value.booksCount - old.booksCount;
    changes.push({ genre, previous: old.booksCount, current: value.booksCount, delta,
      percent: old.booksCount === 0 ? null : Math.round(delta / old.booksCount * 10000) / 100,
      url: value.url });
  }
  return changes.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
}
