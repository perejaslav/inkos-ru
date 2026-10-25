import { describe, expect, it } from "vitest";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { executeEditTransaction } from "../interaction/edit-controller.js";
import { countChapterLength } from "../utils/length-metrics.js";

describe("Russian chapter edits", () => {
  it("stores the word count rather than the character count after a patch", async () => {
    const root = await mkdtemp(join(tmpdir(), "inkos-ru-edit-count-"));
    let index: any[] = [{ number: 1, title: "Глава", wordCount: 4800, observations: [] }];
    const before = "# Глава 1. Тест\n\nГерой смотрел на объект.\n";
    try {
      await mkdir(join(root, "chapters"), { recursive: true });
      await writeFile(join(root, "chapters", "0001_Тест.md"), before);
      await executeEditTransaction({
        bookDir: () => root,
        loadBookLanguage: async () => "ru",
        loadChapterIndex: async () => index as never,
        saveChapterIndex: async (_bookId, next) => { index = [...next]; },
      }, { kind: "chapter-local-edit", bookId: "book", chapterNumber: 1,
        instruction: "Уточнить действие", targetText: "Герой смотрел", replacementText: "Герой внимательно смотрел" });
      expect(index[0]?.wordCount).toBe(countChapterLength(before.replace("Герой смотрел", "Герой внимательно смотрел"), "ru_words"));
      expect(index[0]?.wordCount).toBeLessThan(30);
    } finally { await rm(root, { recursive: true, force: true }); }
  });
});