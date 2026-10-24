import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getAppLanguage,
  getPreferredUiLanguage,
  resolveUiLanguage,
  setAppLanguage,
  setPreferredUiLanguage,
  subscribeUiLanguage,
  tr,
} from "./app-language";
import { ruStrings } from "../hooks/ru-strings";

describe("Studio interface language", () => {
  const storage = new Map<string, string>();
  beforeEach(() => {
    storage.clear();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => { storage.set(key, value); },
      removeItem: (key: string) => { storage.delete(key); },
    });
    setAppLanguage("zh");
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    setAppLanguage("zh");
  });

  it("uses the project language until an explicit UI preference is chosen", () => {
    expect(resolveUiLanguage(null, "zh")).toBe("zh");
    expect(resolveUiLanguage(null, "en")).toBe("en");
    expect(resolveUiLanguage(null, "ru")).toBe("ru");
    setPreferredUiLanguage("ru");
    expect(getPreferredUiLanguage()).toBe("ru");
    expect(resolveUiLanguage(getPreferredUiLanguage(), "zh")).toBe("ru");
    expect(resolveUiLanguage(getPreferredUiLanguage(), "en")).toBe("ru");
    expect(getAppLanguage()).toBe("ru");
    setPreferredUiLanguage(null);
    expect(getPreferredUiLanguage()).toBeNull();
    expect(resolveUiLanguage(null, "en")).toBe("en");
  });

  it("notifies subscribed UI views immediately without changing writing settings", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeUiLanguage(listener);
    setPreferredUiLanguage("ru");
    setPreferredUiLanguage("en");
    expect(listener).toHaveBeenCalledTimes(2);
    unsubscribe();
    setPreferredUiLanguage("zh");
    expect(listener).toHaveBeenCalledTimes(2);
    expect(storage.get("inkos.studio.ui-language")).toBe("zh");
  });

  it("keeps both existing languages and uses Russian copy where available", () => {
    setAppLanguage("zh");
    expect(tr("中文", "English", "Русский")).toBe("中文");
    setAppLanguage("en");
    expect(tr("中文", "English", "Русский")).toBe("English");
    setAppLanguage("ru");
    expect(tr("中文", "English", "Русский")).toBe("Русский");
    expect(tr("中文", "English")).toBe("English");
    expect(ruStrings["nav.newBook"]).toBe("Новая книга");
    expect(ruStrings["create.language"]).toBe("Язык книги");
  });

  it("ignores invalid or inaccessible browser storage", () => {
    storage.set("inkos.studio.ui-language", "fr");
    expect(getPreferredUiLanguage()).toBeNull();
    vi.stubGlobal("localStorage", {
      getItem: () => { throw new Error("storage disabled"); },
      setItem: () => { throw new Error("storage disabled"); },
    });
    expect(getPreferredUiLanguage()).toBeNull();
    expect(() => setPreferredUiLanguage("ru")).not.toThrow();
  });
});
