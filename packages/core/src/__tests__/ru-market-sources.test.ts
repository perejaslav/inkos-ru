import { describe, expect, it, vi } from "vitest";
import { fetchLitmarketGenres, parseLitmarketGenres, parseLitnetPopular, fetchLitnetPopular, parseAuthorTodayMonthly, fetchAuthorTodayMonthly } from "../agents/ru-market-sources.js";

const fixture = `<script type="application/ld+json">{"@context":"https://schema.org","@type":"ItemList","itemListElement":[{"item":{"name":"Фэнтези","url":"https://litmarket.ru/books/genres/fantasy","description":"Книги в жанре Фэнтези — 50379 произведений"}},{"item":{"name":"Фэнтези","url":"https://litmarket.ru/books/genres/fantasy","description":"50379 произведений"}},{"item":{"name":"Подмена","url":"https://example.com/books/genres/foo","description":"999 произведений"}}]}</script>`;

describe("Russian market sources", () => {
  it("parses Author.Today monthly listing without inventing sales", () => {
    const html = `<div class="book-row"><div class="book-title"><a data-pjax href="/work/123">Тест</a></div><div class="book-author"><a href="/u/a">Автор</a></div></div>`;
    expect(parseAuthorTodayMonthly(html, "date")).toEqual([{ source: "author-today", title: "Тест", author: "Автор", rank: 1, metric: "listing_position", period: "month", url: "https://author.today/work/123", collectedAt: "date" }]);
  });
  it("rejects Author.Today pages without books", async () => {
    const mock = vi.fn().mockResolvedValue({ ok: true, text: async () => "<html></html>" });
    await expect(fetchAuthorTodayMonthly(mock as unknown as typeof fetch)).rejects.toThrow("произведения не найдены");
  });
  it("parses Litnet book cards into ranking position without inventing sales", () => {
    const html = `<div class="row book-item" data-bookItemId="123"><h4 class="book-title"><a href="/ru/book/test-b123"><span>Тестовая книга</span></a></h4><p><a class="author" href="/ru/example">Автор</a></p></div>`;
    expect(parseLitnetPopular(html, "date")).toEqual([{ source: "litnet", title: "Тестовая книга", author: "Автор", rank: 1, metric: "listing_position", url: "https://litnet.com/ru/book/test-b123", collectedAt: "date" }]);
  });
  it("rejects a Litnet page without ranking cards", async () => {
    const mock = vi.fn().mockResolvedValue({ ok: true, text: async () => "<html></html>" });
    await expect(fetchLitnetPopular(mock as unknown as typeof fetch)).rejects.toThrow("карточки книг недоступны");
  });
  it("reads public genre supply counts without duplicates or external links", () => {
    expect(parseLitmarketGenres(fixture, "2026-10-25T00:00:00Z")).toEqual([{
      source: "litmarket", genre: "Фэнтези", booksCount: 50379, metric: "published_books",
      url: "https://litmarket.ru/books/genres/fantasy", collectedAt: "2026-10-25T00:00:00Z",
    }]);
  });
  it("rejects missing structured data", () => {
    expect(parseLitmarketGenres("<html></html>", "now")).toEqual([]);
  });
  it("reports failures rather than inventing results", async () => {
    const mock = vi.fn().mockResolvedValue({ ok: true, text: async () => "<html></html>" });
    await expect(fetchLitmarketGenres(mock as unknown as typeof fetch)).rejects.toThrow("данные о жанрах не найдены");
  });
  it("reports HTTP failures for every source", async () => {
    const mock = vi.fn().mockResolvedValue({ ok: false, status: 503 });
    await expect(fetchLitmarketGenres(mock as unknown as typeof fetch)).rejects.toThrow("HTTP 503");
    await expect(fetchLitnetPopular(mock as unknown as typeof fetch)).rejects.toThrow("HTTP 503");
    await expect(fetchAuthorTodayMonthly(mock as unknown as typeof fetch)).rejects.toThrow("HTTP 503");
  });
  it("propagates network timeouts rather than returning invented data", async () => {
    const mock = vi.fn().mockRejectedValue(new DOMException("timeout", "TimeoutError"));
    await expect(fetchLitmarketGenres(mock as unknown as typeof fetch)).rejects.toThrow("timeout");
    await expect(fetchLitnetPopular(mock as unknown as typeof fetch)).rejects.toThrow("timeout");
    await expect(fetchAuthorTodayMonthly(mock as unknown as typeof fetch)).rejects.toThrow("timeout");
  });
});
