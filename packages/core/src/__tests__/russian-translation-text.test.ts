import { describe, expect, it } from "vitest";
import { segmentTranslationText, splitTranslationChapters } from "../translation/text.js";

describe("Russian translation source", () => {
  it("recognizes Russian chapter headings with Cyrillic titles", () => {
    const chapters = splitTranslationChapters("# Глава 1. Ночь\n\nЁж вышел из дома.\n\n# Глава 2. Утро\n\nСнег закончился.");
    expect(chapters).toHaveLength(2);
    expect(chapters[0]?.title).toBe("Ночь");
    expect(chapters[1]?.content).toContain("Снег");
  });

  it("segments Russian sentences without dropping Cyrillic characters", () => {
    const input = "— Ты придёшь? — спросил Илья. Марина промолчала. Затем дверь открылась.";
    const segments = segmentTranslationText(input, 35);
    expect(segments.length).toBeGreaterThan(1);
    expect(segments.join(" ")).toContain("Марина");
    expect(segments.join(" ")).toContain("дверь");
  });
});
