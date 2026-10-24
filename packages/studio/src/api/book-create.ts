import { PlatformSchema, defaultChapterLength, normalizeContentLanguage, type Platform } from "@actalk/inkos-core";
export { waitForStudioBookReady } from "../lib/book-ready.js";
export type { StudioBookDetail, WaitForStudioBookReadyOptions } from "../lib/book-ready.js";

export interface StudioCreateBookBody {
  readonly title: string;
  readonly genre: string;
  readonly language?: string;
  readonly platform?: string;
  readonly chapterWordCount?: number;
  readonly minChapterLength?: number;
  readonly maxChapterLength?: number;
  readonly targetChapters?: number;
  readonly blurb?: string;
}

export interface StudioBookConfigDraft {
  readonly id: string;
  readonly title: string;
  readonly platform: Platform;
  readonly genre: string;
  readonly status: "outlining";
  readonly targetChapters: number;
  readonly chapterWordCount: number;
  readonly minChapterLength?: number;
  readonly maxChapterLength?: number;
  readonly language: "zh" | "en" | "ru";
  readonly createdAt: string;
  readonly updatedAt: string;
}

export function normalizeStudioPlatform(platform?: string): Platform {
  return platform === undefined ? "other" : PlatformSchema.parse(platform);
}

function positiveInteger(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value <= 0) {
    throw new Error(`${field} must be a positive integer`);
  }
  return value;
}

export function buildStudioBookConfig(body: StudioCreateBookBody, now: string): StudioBookConfigDraft {
  if (typeof body.title !== "string" || !body.title.trim()) {
    throw new Error("Book title must be a nonempty string");
  }
  if (typeof body.genre !== "string" || !body.genre.trim()) {
    throw new Error("Book genre must be a nonempty string");
  }
  const language = normalizeContentLanguage(body.language ?? "zh");
  const chapterWordCount = positiveInteger(body.chapterWordCount === undefined ? defaultChapterLength(language) : body.chapterWordCount, "chapterWordCount");
  const targetChapters = positiveInteger(body.targetChapters === undefined ? 200 : body.targetChapters, "targetChapters");
  const minChapterLength = body.minChapterLength === undefined ? undefined : positiveInteger(body.minChapterLength, "minChapterLength");
  const maxChapterLength = body.maxChapterLength === undefined ? undefined : positiveInteger(body.maxChapterLength, "maxChapterLength");
  if (minChapterLength !== undefined && maxChapterLength !== undefined && minChapterLength > maxChapterLength) {
    throw new Error("minChapterLength cannot exceed maxChapterLength");
  }
  return {
    id: body.title
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fff\u0400-\u052f]/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 30),
    title: body.title,
    platform: normalizeStudioPlatform(body.platform),
    genre: body.genre,
    status: "outlining",
    targetChapters,
    chapterWordCount,
    ...(minChapterLength !== undefined ? { minChapterLength } : {}),
    ...(maxChapterLength !== undefined ? { maxChapterLength } : {}),
    language,
    createdAt: now,
    updatedAt: now,
  };
}
