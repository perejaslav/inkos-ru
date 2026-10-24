import { describe, expect, it } from "vitest";
import { normalizeContentLanguage, normalizeUiLocale } from "../utils/language-code.js";

describe("content and interface language normalization", () => {
  it.each([
    ["ru", "ru"], ["ru-RU", "ru"], ["RU_ru", "ru"],
    ["en-US", "en"], ["zh-CN", "zh"],
  ] as const)("normalizes %s to %s", (source, target) => {
    expect(normalizeContentLanguage(source)).toBe(target);
  });

  it("keeps interface locale independent", () => {
    expect(normalizeUiLocale("ru")).toBe("ru-RU");
    expect(normalizeUiLocale("en-GB")).toBe("en");
    expect(normalizeUiLocale("zh-CN")).toBe("zh-CN");
  });

  it.each(["de", "fr-FR", "", "unknown", "ruX", "enough"])("rejects unsupported %s", (value) => {
    expect(() => normalizeContentLanguage(value)).toThrow(/Unsupported content language/);
  });
});
