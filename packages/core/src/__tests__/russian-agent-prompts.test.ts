import { describe, expect, it } from "vitest";
import { getPlannerMemoSystemPrompt, buildPlannerUserMessage } from "../agents/planner-prompts.js";
import { buildWriterSystemPrompt } from "../agents/writer-prompts.js";
import { buildLengthSpec } from "../utils/length-metrics.js";

describe("Russian agent prompts", () => {
  it("uses Russian planning directives and preserves the result tool contract", () => {
    const prompt = getPlannerMemoSystemPrompt("ru");
    expect(prompt).toContain("план одной главы");
    expect(prompt).toContain("инструмент");
    expect(prompt).not.toContain("把输入");
  });

  it("uses Russian writer directives with author authority and a word target", () => {
    const book = {
      id: "russian", title: "Зимний город", genre: "fiction", platform: "other",
      status: "outlining" as const, targetChapters: 5, chapterWordCount: 2000,
      language: "ru" as const, createdAt: "2026-10-24T00:00:00.000Z",
      updatedAt: "2026-10-24T00:00:00.000Z",
    };
    const prompt = buildWriterSystemPrompt(book as Parameters<typeof buildWriterSystemPrompt>[0],
      null, "Герой не лжёт.", "Короткие фразы.", "ru", buildLengthSpec(2000, "ru"));
    expect(prompt).toContain("по-русски");
    expect(prompt).toContain("Целевой объём: 2000 слов");
    expect(prompt).toContain("Указание автора");
    expect(prompt).toContain("Герой не лжёт.");
    expect(prompt).not.toContain("用户目标");
  });
});
