import { describe, expect, it } from "vitest";
import {
  buildForecastRepairPrompt,
  buildForecastSystemPrompt,
  buildForecastUserPrompt,
} from "../forecast/prompts.js";
import {
  buildShortFictionOutlineSystemPrompt,
  buildShortFictionWriterSystemPrompt,
  buildShortFictionWriterUserPrompt,
  buildShortFictionPackageSystemPrompt,
} from "../prompts/short-fiction.js";
import {
  formatShortFictionChapterHeading,
  measureShortFictionDraft,
  renderShortFictionDraftMarkdown,
  renderShortFictionSalesPackage,
} from "../agents/short-fiction.js";
import { buildStateReconciliationFeedback, unresolvedStateObservation } from "../pipeline/chapter-state-recovery.js";
import { buildSettlerSystemPrompt, buildSettlerUserPrompt } from "../agents/settler-prompts.js";
import { reviewChapterDraft } from "../pipeline/chapter-review.js";
import {
  renderCurrentStateProjection,
  renderChapterSummariesProjection,
  renderHooksProjection,
} from "../state/state-projections.js";
import { renderCompleteImportSource } from "../agents/import-context.js";
import { renderNarrativeSelectedContext } from "../utils/narrative-control.js";
import { renderScriptSpec } from "../agents/script-storyboard.js";
import { buildPlaySceneImagePrompt, buildPlayEntityImagePrompt } from "../play/play-image.js";
import { renderForecastComparisonMarkdown, renderSelectedBranchPlanMarkdown } from "../forecast/render.js";

describe("Russian production language does not silently fall back to Chinese", () => {
  it("produces Russian instructions for forecast and preserves English/Chinese branches", () => {
    const input = { contextMarkdown: "События", divergence: "Другой выбор", branchCount: 3, horizon: 5, baseChapter: 7 };
    expect(buildForecastSystemPrompt("ru")).toContain("русском языке");
    expect(buildForecastUserPrompt(input, "ru")).toContain("строго 3");
    expect(buildForecastUserPrompt(input, "ru")).toContain("главы 8");
    expect(buildForecastRepairPrompt("bad branch", "ru")).toContain("не прошёл проверку");
    expect(buildForecastSystemPrompt("en")).toContain("non-canonical futures");
    expect(buildForecastSystemPrompt("zh")).toContain("非正史");
  });

  it("requests Russian prose with word-based chapter counts and local headings", () => {
    const input = { direction: "Пиши детектив", chapterCount: 2, charsPerChapter: 650 };
    expect(buildShortFictionOutlineSystemPrompt("ru")).toContain("по-русски");
    expect(buildShortFictionWriterSystemPrompt("ru")).toContain("по-русски");
    const prompt = buildShortFictionWriterUserPrompt({ ...input, outlineMarkdown: "План" }, "ru");
    expect(prompt).toContain("650 words");
    expect(prompt).toContain("in Russian");
    expect(prompt).not.toContain("只写");
    expect(buildShortFictionPackageSystemPrompt("ru")).toContain("на русском языке");
    const draft = {
      storyTitle: "Зима",
      openingHook: "Первый снег",
      chapters: [{ number: 1, title: "Встреча", content: "Падает тихий снег.", charCount: 3 }],
      rawContent: "",
    };
    expect(measureShortFictionDraft(draft, "ru").unit).toBe("words");
    expect(measureShortFictionDraft(draft, "ru").chapterLengths[0]?.length).toBe(3);
    expect(formatShortFictionChapterHeading(1, "Встреча", "ru")).toBe("Глава 1. Встреча");
    expect(renderShortFictionDraftMarkdown(draft, "ru")).toContain("## Вступительная сцена");
    expect(renderShortFictionSalesPackage({
      title: "Зима", intro: "Аннотация", sellingPoints: ["Сюжет"], coverPrompt: "Обложка", rawContent: "",
    }, "ru")).toContain("## Аннотация");
    expect(formatShortFictionChapterHeading(1, "Encounter", "en")).toBe("Chapter 1: Encounter");
    expect(formatShortFictionChapterHeading(1, "相遇", "zh")).toBe("第1章 相遇");
  });

  it("reconciles and settles Russian chapter facts without Chinese notices", () => {
    expect(buildStateReconciliationFeedback([], "ru")).toContain("тексту главы");
    expect(buildStateReconciliationFeedback([{ code: "missing", summary: "Потеряна улика", evidence: [] }], "ru"))
      .toContain("Исправь следующие расхождения:");
    expect(unresolvedStateObservation("ru").summary).toContain("неразрешённые");
    const book = { title: "Зима", language: "ru" } as Parameters<typeof buildSettlerSystemPrompt>[0];
    expect(buildSettlerSystemPrompt(book, null, "ru")).toContain("Планы нельзя считать");
    const prompt = buildSettlerUserPrompt({
      chapterNumber: 2, title: "Снег", content: "Встреча состоялась.",
      governedControlBlock: "Факты", language: "ru",
    });
    expect(prompt).toContain("## Текст главы");
    expect(prompt).not.toContain("本章");
  });

  it("marks a failed Russian chapter review in Russian and retains ru for the auditor", async () => {
    let auditLanguage = "";
    const result = await reviewChapterDraft({
      book: { genre: "fiction" },
      bookDir: "dummy",
      chapterNumber: 1,
      output: { content: "Снег падает на город." },
      controlInput: { contextPackage: { selectedContext: [] } as never },
      lengthSpec: { target: 120, countingMode: "ru_words" } as never,
      initialUsage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
      auditor: { async auditChapter(_bookDir, _content, _chapterNumber, _genre, options) {
        auditLanguage = options.language;
        throw Error("offline");
      } },
      assertNotEmpty: (text) => expect(text).not.toBe(""),
      addUsage: (usage) => usage,
    });
    expect(auditLanguage).toBe("ru");
    expect(result.review.summary).toBe("Проверка главы недоступна");
    expect(result.review.observations[0]?.summary).toContain("Проверка главы недоступна");
  });

  it("renders Russian state, import, selected context, and script metadata", () => {
    expect(renderHooksProjection({ hooks: [] }, "ru")).toContain("# Незавершённые сюжетные линии");
    expect(renderChapterSummariesProjection({ rows: [] }, "ru")).toContain("| Глава | Название |");
    expect(renderCurrentStateProjection({ chapter: 2, facts: [] }, "ru")).toContain("Текущая глава: 2");
    expect(renderCompleteImportSource([{ title: "Начало", content: "Текст" }], "ru"))
      .toBe("Глава 1. Начало\n\nТекст");
    expect(renderNarrativeSelectedContext([{ source: "story", reason: "Причина", excerpt: "Описание", protection: "protected" }], "ru"))
      .toContain("### Источник 1");
    expect(renderScriptSpec({ title: "Встреча", targetFormat: "vertical_short_drama", language: "ru" }))
      .not.toContain("剧本创作规格");
  });

  it("makes Russian image prompts from a Russian Play world without changing Chinese output", () => {
    const ruWorld = { language: "ru" as const, premise: "Зимний двор", worldContract: "Ночь", visualContract: "Тихо" };
    expect(buildPlaySceneImagePrompt("Во дворе снег.", ruWorld)).toContain("Текущая сцена:");
    expect(buildPlaySceneImagePrompt("Во дворе снег.", ruWorld)).not.toContain("当前场景");
    expect(buildPlayEntityImagePrompt({ type: "actor", label: "Сторож" }, ruWorld)).toContain("Объект");
    expect(buildPlaySceneImagePrompt("院中下雪", { language: "zh", premise: "夜" })).toContain("当前场景");
  });

  it("renders Russian forecasts and preserves structured branch detail", () => {
    const branch = {
      branchId: "ветка-1", title: "Метель", premise: "Герой ушёл",
      risks: [{ kind: "continuity", description: "Противоречие" }],
      beats: [{ chapter: 4, summary: "Возвращение" }],
      characterDecisions: [{ character: "Иван", decision: "Искать" }],
      projectedChanges: { characters: [], relationships: [], world: [], hooks: [] },
      uncertainties: [], intentRationale: "Соответствует замыслу",
    };
    const forecast = {
      language: "ru", divergence: "Иной выбор", forecastId: "f1", bookId: "Зима",
      baseChapter: 3, horizon: 2, createdAt: "2026-10-24", branches: [branch],
    };
    const compare = renderForecastComparisonMarkdown(forecast as never);
    expect(compare).toContain("# Сравнение сюжетных прогнозов");
    expect(compare).toContain("Глава 4");
    expect(compare).not.toContain("未来章节");
    const selected = renderSelectedBranchPlanMarkdown({
      forecast: forecast as never, branch: branch as never, selectedAt: "2026-10-24", stale: true,
    });
    expect(selected).toContain("# План выбранного варианта");
    expect(selected).toContain("Прогноз устарел");
  });
});
