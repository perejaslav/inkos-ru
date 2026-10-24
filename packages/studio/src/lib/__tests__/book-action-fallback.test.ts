import { describe, expect, it } from "vitest";
import { bookActionFallback } from "../book-action-fallback";

describe("book action fallback language", () => {
  it("chooses Russian, English and Chinese from book language", () => {
    expect(bookActionFallback("ru", "Delete failed", "Не удалось удалить книгу", "删除书籍失败")).toBe("Не удалось удалить книгу");
    expect(bookActionFallback("en", "Delete failed", "Не удалось удалить книгу", "删除书籍失败")).toBe("Delete failed");
    expect(bookActionFallback("zh", "Delete failed", "Не удалось удалить книгу", "删除书籍失败")).toBe("删除书籍失败");
    expect(bookActionFallback(undefined, "Delete failed", "Не удалось удалить книгу", "删除书籍失败")).toBe("Delete failed");
  });
});
