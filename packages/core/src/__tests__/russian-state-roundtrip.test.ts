import { describe, expect, it } from "vitest";
import { mkdtemp, rm, readFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { StateManager } from "../state/manager.js";
import { loadWorkManifest, saveWorkManifest } from "../harness/work-store.js";

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
      await state.ensureControlDocuments(id);
      const control = await state.loadControlDocuments(id);
      expect(control.authorIntent).toContain("Авторский замысел");
      expect(control.currentFocus).toContain("Текущий фокус");
      const reloaded = await new StateManager(root).loadBookConfig(id);
      expect(reloaded.language).toBe("ru");
      expect(reloaded.title).toBe("Северный город");
      const originalWork = await loadWorkManifest(root, id);
      await saveWorkManifest(root, { ...originalWork, metadata: { ...originalWork.metadata, customTag: "важное" } });
      await state.saveBookConfig(id, {
        ...config,
        title: "Северный город — новая редакция",
        genre: "fantasy",
        platform: "royal-road",
        language: "en",
        updatedAt: "2026-10-24T01:00:00.000Z",
      });
      const reopened = new StateManager(root);
      const work = await loadWorkManifest(root, id);
      expect((await reopened.loadBookConfig(id)).language).toBe("en");
      expect(work.language).toBe("en");
      expect(work.title).toBe("Северный город — новая редакция");
      expect(work.id).toBe(originalWork.id);
      expect(work.createdAt).toBe(originalWork.createdAt);
      expect(work.profileId).toBe(originalWork.profileId);
      expect(work.metadata).toMatchObject({ genre: "fantasy", platform: "royal-road", customTag: "важное" });
      const raw = await readFile(join(state.bookDir(id), "book.json"), "utf8");
      expect(raw).toContain("Северный город");
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});
