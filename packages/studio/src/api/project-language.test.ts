import { describe, expect, it } from "vitest";
import { parseStudioProjectLanguage, parseStudioBookLanguageUpdate } from "./project-language";

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

describe("Studio book language update", () => {
  it("preserves language when omitted and accepts Russian locale alias", () => {
    expect(parseStudioBookLanguageUpdate(undefined)).toBeUndefined();
    expect(parseStudioBookLanguageUpdate("ru-RU")).toBe("ru");
  });
  it("rejects invalid language edits before persistence", () => {
    for (const value of [null, 42, "", "de", {}, []]) {
      expect(() => parseStudioBookLanguageUpdate(value)).toThrow();
    }
  });
});
