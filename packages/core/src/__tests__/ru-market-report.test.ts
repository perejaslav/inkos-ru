import { describe, expect, it } from "vitest";
import { validateRussianMarketReport } from "../agents/ru-market-report.js";

const urls = new Set(["https://litmarket.ru/books/genres/fantasy", "https://author.today/work/123"]);

describe("Russian market AI report grounding", () => {
  it("accepts a cautious report with captured URLs", () => {
    const report = "Факты: опубликовано 100 книг. Это предложение, не продажи. Источник: https://litmarket.ru/books/genres/fantasy.";
    expect(validateRussianMarketReport(report, urls)).toBe(report);
  });
  it.each([null, "", "   ", 5])("rejects missing report %s", (report) => {
    expect(() => validateRussianMarketReport(report, urls)).toThrow();
  });
  it("rejects fabricated links, including same-domain links", () => {
    expect(() => validateRussianMarketReport("https://litmarket.ru/books/genres/unknown", urls)).toThrow("ссылку");
    expect(() => validateRussianMarketReport("https://evil.example/", urls)).toThrow("ссылку");
  });
  it.each(["Продажи составили 1000 единиц", "200 читателей", "Выручка: 50 000 рублей", "Спрос вырос на 12%", "Просмотры — 3000"]) (
    "rejects unsupported quantitative claims: %s", (report) => {
      expect(() => validateRussianMarketReport(report, urls)).toThrow("неподтверждённые");
    },
  );
  it("accepts hypotheses without invented numeric demand", () => {
    expect(validateRussianMarketReport("Гипотеза: спрос может быть выше. Доказательств нет.", urls)).toContain("Гипотеза");
  });
});
