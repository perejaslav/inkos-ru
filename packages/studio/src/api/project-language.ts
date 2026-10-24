import { normalizeContentLanguage, type ContentLanguage } from "@actalk/inkos-core";

/** Validate runtime JSON before it reaches inkos.json. Types are not runtime guards. */
export function parseStudioProjectLanguage(body: unknown): ContentLanguage {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new Error("Expected a JSON object with language");
  }
  const value = (body as Record<string, unknown>).language;
  if (typeof value !== "string") throw new Error("Expected language to be a string");
  return normalizeContentLanguage(value);
}

/** Validate an optional book-language update without silently defaulting to Chinese. */
export function parseStudioBookLanguageUpdate(value: unknown): ContentLanguage | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "string") throw new Error("Expected language to be a string");
  return normalizeContentLanguage(value);
}
