import { test, expect } from "@playwright/test";

test("Russian market radar renders snapshot history and AI report", async ({ page }) => {
  await page.route("**/api/v1/radar/ru/history", route => route.fulfill({ json: { items: [{
    timestamp: "2026-10-25T12:00:00Z", sources: [{ source: "litmarket", status: "ok", items: [{ genre: "Фэнтези", booksCount: 100, metric: "published_books", url: "https://litmarket.ru/books/genres/fantasy" }], error: null }],
  }] } }));
  await page.route("**/api/v1/radar/ru/analyze", route => route.fulfill({ json: { report: "Проверенный аналитический отчёт", model: "deepseek-v4.1-flash" } }));
  await page.goto("/#/radar");
  await expect(page.getByRole("heading", { name: "Российский книжный рынок — сводка источников" })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText("История снимков", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "Подготовить аналитический отчёт ИИ" }).click();
  await expect(page.getByText("Проверенный аналитический отчёт")).toBeVisible();
  await expect(page.getByText("Отчёт ИИ (deepseek-v4.1-flash)")).toBeVisible();
});

test("Russian market radar reports an AI failure", async ({ page }) => {
  await page.route("**/api/v1/radar/ru/history", route => route.fulfill({ json: { items: [{ timestamp: "2026-10-25T12:00:00Z", sources: [] }] } }));
  await page.route("**/api/v1/radar/ru/analyze", route => route.fulfill({ status: 502, json: { error: "Провайдер недоступен" } }));
  await page.goto("/#/radar");
  await page.getByRole("button", { name: "Подготовить аналитический отчёт ИИ" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Провайдер недоступен" })).toBeVisible();
});

test("Russian market radar handles an empty history", async ({ page }) => {
  await page.route("**/api/v1/radar/ru/history", route => route.fulfill({ json: { items: [] } }));
  await page.goto("/#/radar");
  await expect(page.getByText("Сохранённых снимков пока нет", { exact: false })).toBeVisible();
  await expect(page.getByRole("button", { name: "Подготовить аналитический отчёт ИИ" })).toBeDisabled();
});

test("Russian market radar distinguishes a failed source from successful sources", async ({ page }) => {
  await page.route("**/api/v1/radar/ru/history", route => route.fulfill({ json: { items: [] } }));
  await page.route("**/api/v1/radar/ru/litmarket/genres", route => route.fulfill({ json: { items: [{ genre: "Фэнтези", booksCount: 50, collectedAt: "2026-10-25T12:00:00Z", url: "https://litmarket.ru/books/genres/fantasy" }] } }));
  await page.route("**/api/v1/radar/ru/litnet/popular", route => route.fulfill({ status: 502, json: { error: "Источник временно недоступен" } }));
  await page.route("**/api/v1/radar/ru/author-today/monthly", route => route.fulfill({ json: { items: [] } }));
  await page.goto("/#/radar");
  await page.getByRole("button", { name: "Собрать данные российского рынка" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Литмаркет: данные получены" })).toBeVisible();
  await expect(page.getByRole("status").filter({ hasText: "Литнет: недоступен" })).toBeVisible();
  await expect(page.getByText("50", { exact: true })).toBeVisible();
});
