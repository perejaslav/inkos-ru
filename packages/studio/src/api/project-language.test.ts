import { describe, expect, it } from "vitest";
import { parseStudioProjectLanguage } from "./project-language";

describe("Studio project language validation", () => {
  it("accepts supported content languages and normalized aliases", () => {
    for (const language of ["zh", "en", "ru"] as const) {
      expect(parseStudioProjectLanguage({ language })).toBe(language);
    }
    expect(parseStudioProjectLanguage({ language: "ru-RU" })).toBe("ru");
  });

  it("rejects malformed bodies and unsupported language without mutating a project", () => {
    for (const body of [null, [], {}, { language: null }, { language: 3 }, { language: "de" }, { language: "" }]) {
      expect(() => parseStudioProjectLanguage(body)).toThrow();
    }
  });
});
