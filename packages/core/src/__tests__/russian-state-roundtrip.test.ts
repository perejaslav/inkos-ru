import { describe, expect, it } from "vitest";
import { mkdtemp, rm, readFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { StateManager } from "../state/manager.js";

describe("Russian state round trip", () => {
  it("persists Russian book language and retains Unicode titles", async () => {
    const root = await mkdtemp(join(tmpdir(), "inkos-ru-state-"));
    try {
      const state = new StateManager(root);
      const id = "северный-город";
      const config = {
        id, title: "Северный город", genre: "fiction",
        platform: "other", status: "outlining" as const,
        targetChapters: 3, chapterWordCount: 2000,
        language: "ru" as const,
        createdAt: "2026-10-24T00:00:00.000Z",
        updatedAt: "2026-10-24T00:00:00.000Z",
      };
      await state.saveBookConfig(id, config);
      const reloaded = await new StateManager(root).loadBookConfig(id);
      expect(reloaded.language).toBe("ru");
      expect(reloaded.title).toBe("Северный город");
      const raw = await readFile(join(state.bookDir(id), "book.json"), "utf8");
      expect(raw).toContain("Северный город");
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});
