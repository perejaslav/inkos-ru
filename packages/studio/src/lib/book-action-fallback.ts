/** Fallback only: preserve the API-provided error message whenever one exists. */
export function bookActionFallback(language: string | undefined, en: string, ru: string, zh: string): string {
  return language === "ru" ? ru : language === "zh" ? zh : en;
}