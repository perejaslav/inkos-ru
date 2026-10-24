import { describe, expect, it } from "vitest";
import { BookConfigSchema } from "../models/book.js";
import { ProjectConfigSchema } from "../models/project.js";
import { RuntimeStateLanguageSchema } from "../models/runtime-state.js";
import { chapterDocumentHeading, renderChapterDocument, chapterDocumentBody } from "../utils/chapter-document.js";

describe("Russian content contracts", () => {
  it("allows ru in book and runtime schemas without changing zh/en", () => {
    const book = {
      id: "ru-novel", title: "Зимний город", genre: "fiction", platform: "other",
      status: "outlining", targetChapters: 5, chapterWordCount: 2000,
      language: "ru", createdAt: "2026-10-24T00:00:00.000Z",
      updatedAt: "2026-10-24T00:00:00.000Z",
    };
    expect(BookConfigSchema.parse(book).language).toBe("ru");
    expect(RuntimeStateLanguageSchema.parse("ru")).toBe("ru");
    expect(RuntimeStateLanguageSchema.parse("en")).toBe("en");
    expect(RuntimeStateLanguageSchema.parse("zh")).toBe("zh");
    expect(() => RuntimeStateLanguageSchema.parse("de")).toThrow();
  });

  it("accepts the project-language field for Russian", () => {
    expect(ProjectConfigSchema.shape.language.parse("ru")).toBe("ru");
    expect(ProjectConfigSchema.shape.language.parse(undefined)).toBe("zh");
  });

  it("wraps Russian prose with a Russian chapter heading", () => {
    const title = "Первый снег";
    const body = "Мальчик медленно открыл дверь.";
    const chapter = renderChapterDocument(2, title, body, "ru");
    expect(chapter).toContain("# Глава 2. Первый снег");
    expect(chapterDocumentBody(chapter, 2, title, "ru")).toBe(body);
    expect(chapterDocumentHeading(2, title, "en")).toBe("# Chapter 2: Первый снег");
  });
});
