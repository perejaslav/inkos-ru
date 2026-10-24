import { describe, expect, it } from "vitest";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import JSZip from "jszip";
import { buildExportArtifact } from "../interaction/export-artifact.js";

describe("Russian book export", () => {
  it("preserves Cyrillic chapter and EPUB language metadata", async () => {
    const root = await mkdtemp(join(tmpdir(), "inkos-ru-epub-"));
    try {
      const dir = join(root, "chapters");
      await mkdir(dir, { recursive: true });
      await writeFile(join(dir, "0001_глава.md"), "# Глава 1. Ёж и зима\n\nЁж вышел из дома.", "utf8");
      const source = {
        bookDir: () => root,
        loadBookConfig: async () => ({ title: "Русская книга", language: "ru" }),
        loadChapterIndex: async () => [{ number: 1, title: "Ёж и зима", wordCount: 5 }],
      };
      const md = await buildExportArtifact(source, "ru-book", { format: "md" });
      expect(md.payload).toContain("# Глава 1. Ёж и зима");
      const epub = await buildExportArtifact(source, "ru-book", { format: "epub" });
      const zip = await JSZip.loadAsync(epub.payload);
      const texts = await Promise.all(Object.values(zip.files).filter((x) => !x.dir && /\.(?:opf|xhtml|html)$/i.test(x.name)).map((x) => x.async("string")));
      expect(texts.join(" ")).toContain("ru-RU");
      expect(texts.join(" ")).toContain("Ёж");
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});
