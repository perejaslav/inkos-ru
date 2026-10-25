import { describe, expect, it } from "vitest";
import { compareRussianMarketSnapshots, type MarketSnapshot } from "../agents/ru-market-trends.js";

const source = (count: number) => ({ source: "litmarket", status: "ok", items: [
  { source: "litmarket", metric: "published_books", genre: "Фэнтези", booksCount: count, url: "https://litmarket.ru/books/genres/fantasy" },
] });

describe("Russian market snapshot comparison", () => {
  it("compares genre supply only", () => {
    const before: MarketSnapshot = { timestamp: "2026-10-01", sources: [source(100)] };
    const after: MarketSnapshot = { timestamp: "2026-10-25", sources: [source(110)] };
    expect(compareRussianMarketSnapshots(before, after)).toEqual([{ genre: "Фэнтези", previous: 100, current: 110, delta: 10, percent: 10, url: "https://litmarket.ru/books/genres/fantasy" }]);
  });
  it("does not compare missing sources or unknown baselines", () => {
    expect(compareRussianMarketSnapshots({ timestamp: "a", sources: [] }, { timestamp: "b", sources: [source(10)] })).toEqual([]);
    expect(compareRussianMarketSnapshots({ timestamp: "a", sources: [source(0)] }, { timestamp: "b", sources: [source(10)] })[0].percent).toBeNull();
  });
});
