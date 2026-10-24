import { describe, it, expect } from "vitest";
import {
  buildLengthSpec,
  countChapterLength,
  defaultChapterLength,
} from "../utils/length-metrics.js";

describe("length metrics", () => {
  it("counts Chinese chapter length using zh_chars", () => {
    expect(countChapterLength("他抬头看天。", "zh_chars")).toBe(6);
  });

  it("counts Russian Cyrillic words and ignores Markdown metadata", () => {
    const prose = "---\ntitle: Пролог\n---\n# Глава первая\n\nМальчик медленно открыл дверь.";
    expect(countChapterLength(prose, "ru_words")).toBe(4);
    expect(countChapterLength("Ёж и ёжик. По-русски — 50-летний герой.", "ru_words")).toBe(6);
    expect(countChapterLength("Санкт-Петербург и New York", "ru_words")).toBe(4);
    expect(countChapterLength("из-за т. д. и 50-летний", "ru_words")).toBe(5);
  });

  it("resolves Russian word counting without changing zh/en", () => {
    expect(defaultChapterLength("ru")).toBe(2000);
    expect(buildLengthSpec(2300, "ru")).toEqual({ target: 2300, countingMode: "ru_words" });
    expect(countChapterLength("Мальчик медленно открыл дверь.", "en_words")).toBe(0);
  });

  it("counts English chapter length using en_words", () => {
    expect(countChapterLength("He looked at the sky.", "en_words")).toBe(5);
  });

  it("defaults chapter length to the language-native unit", () => {
    expect(defaultChapterLength("zh")).toBe(3000);
    expect(defaultChapterLength("en")).toBe(2000);
    expect(defaultChapterLength()).toBe(3000);
  });

  it("counts prose only for markdown-shaped Chinese chapters", () => {
    const markdownChapter = [
      "---",
      "title: 第1章 归来",
      "---",
      "",
      "# 第1章 归来",
      "",
      "陈风抬头看天。",
    ].join("\n");

    expect(countChapterLength(markdownChapter, "zh_chars")).toBe("陈风抬头看天。".length);
  });

  it("keeps only the user's target and language-native counting mode", () => {
    const spec = buildLengthSpec(2200, "zh");

    expect(spec).toEqual({
      target: 2200,
      countingMode: "zh_chars",
    });
    expect(buildLengthSpec(2200, "en")).toEqual({
      target: 2200,
      countingMode: "en_words",
    });
  });
});
