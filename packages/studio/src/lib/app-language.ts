import { ruInline } from "./ru-inline";

// The UI language can differ from the project's writing language.
// Keep the global value for non-React consumers (stores, errors and formatting).
export type AppLanguage = "zh" | "en" | "ru";
const UI_LANGUAGE_KEY = "inkos.studio.ui-language";
const listeners = new Set<() => void>();
const isLanguage = (value: string | null): value is AppLanguage =>
  value === "zh" || value === "en" || value === "ru";

let current: AppLanguage = "zh";

export function setAppLanguage(lang: AppLanguage): void {
  current = lang;
}

export function getAppLanguage(): AppLanguage {
  return current;
}

/** Per-browser UI preference. Null follows the existing project language. */
export function getPreferredUiLanguage(): AppLanguage | null {
  try {
    const value = globalThis.localStorage?.getItem(UI_LANGUAGE_KEY) ?? null;
    return isLanguage(value) ? value : null;
  } catch {
    return null;
  }
}

/** Do not confuse a book/project's writing language with the Studio interface. */
export function resolveUiLanguage(preferred: AppLanguage | null, projectLanguage?: string): AppLanguage {
  return preferred ?? (projectLanguage === "en" || projectLanguage === "ru" ? projectLanguage : "zh");
}

export function setPreferredUiLanguage(lang: AppLanguage | null): void {
  try {
    if (lang === null) globalThis.localStorage?.removeItem(UI_LANGUAGE_KEY);
    else globalThis.localStorage?.setItem(UI_LANGUAGE_KEY, lang);
  } catch {
    // Private browsing or blocked storage: the currently selected language still works.
  }
  if (lang !== null) setAppLanguage(lang);
  listeners.forEach((listener) => listener());
}

export function subscribeUiLanguage(listener: () => void): () => void {
  listeners.add(listener);
  // A second tab may change its browser preference while Studio is open.
  const onStorage = (event: StorageEvent) => {
    if (event.key === UI_LANGUAGE_KEY || event.key === null) listener();
  };
  globalThis.addEventListener?.("storage", onStorage);
  return () => {
    listeners.delete(listener);
    globalThis.removeEventListener?.("storage", onStorage);
  };
}

/** Inline copy: tr(Chinese, English, Russian). Untranslated Russian copy falls back to English. */
export function tr(zh: string, en: string, ru?: string): string {
  return current === "zh" ? zh : current === "ru" ? (ru ?? ruInline[en] ?? en) : en;
}
