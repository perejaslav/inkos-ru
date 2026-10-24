import { test, expect } from "@playwright/test";

test("Russian book form is reachable and independent from UI locale", async ({ page }) => {
  // This test intentionally does not submit: /books/create may invoke a real LLM.
  await page.goto("/#/book/new");
  const language = page.getByRole("combobox", { name: /Book language|Язык книги|作品语言/ });
  await expect(language).toBeVisible({ timeout: 20_000 });
  await language.selectOption("ru");
  await expect(language).toHaveValue("ru");
  await expect(page.getByRole("option", { name: "Русский" })).toHaveCount(1);
  await expect(page.getByRole("button", { name: /Create book|Создать книгу|创建书籍/ })).toBeDisabled();
  await page.getByRole("textbox", { name: /Title|Название книги|书名/ }).fill("Зимний город");
  await page.getByRole("textbox", { name: /Genre|Жанр|题材/ }).fill("Фантастика");
  await page.getByRole("textbox", { name: /Story brief|Сюжет и основные идеи|故事简介/ }).fill("Героиня исследует заброшенную станцию.");
  await expect(page.getByRole("button", { name: /Create book|Создать книгу|创建书籍/ })).toBeEnabled();
});
