import { z } from "zod";

/** Language of an authored work, independent from the Studio locale. */
export const ContentLanguageSchema = z.enum(["zh", "en", "ru"]);
export type ContentLanguage = z.infer<typeof ContentLanguageSchema>;

/** Locale for user interface copy, independent from the authored language. */
export const UiLocaleSchema = z.enum(["zh-CN", "en", "ru-RU"]);
export type UiLocale = z.infer<typeof UiLocaleSchema>;

/** Reject invalid content language explicitly rather than silently selecting Chinese. */
export function normalizeContentLanguage(value: string): ContentLanguage {
  const input = value.trim().toLowerCase().replaceAll("_", "-");
  const primary = input.split("-")[0];
  const result = ContentLanguageSchema.safeParse(primary);
  if (!result.success) throw new Error(`Unsupported content language: ${value}. Expected ru, en or zh.`);
  return result.data;
}

/** The UI locale does not determine the language stored in a Work. */
export function normalizeUiLocale(value: string): UiLocale {
  const language = normalizeContentLanguage(value);
  return language === "ru" ? "ru-RU" : language === "zh" ? "zh-CN" : "en";
}
