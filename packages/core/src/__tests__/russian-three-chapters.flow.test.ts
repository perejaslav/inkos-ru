import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import JSZip from "jszip";
import { expect, it } from "vitest";
import { WriterAgent, type WriteChapterOutput } from "../agents/writer.js";
import { loadChaptersFromPath } from "../agent/chapter-import-source.js";
import { loadWorkManifest } from "../harness/work-store.js";
import { readArtifactRevision } from "../harness/artifact-reader.js";
import { syncWorkSourceArtifacts } from "../harness/source-sync.js";
import { persistChapterArtifacts } from "../pipeline/chapter-persistence.js";
import { writeExportArtifact, buildExportArtifact } from "../interaction/export-artifact.js";
import { StateManager } from "../state/manager.js";
import { archiveChapterVersion, readChapterVersion } from "../state/chapter-workspace.js";
import {
  buildRuntimeStateArtifacts,
  createInitialRuntimeState,
  loadRuntimeStateSnapshot,
  loadRuntimeStateSnapshotAtChapter,
} from "../state/runtime-state-store.js";
import { countChapterLength } from "../utils/length-metrics.js";
import type { RuntimeStateDelta } from "../models/runtime-state.js";
import type { RuntimeStateSnapshot } from "../state/state-reducer.js";

const CREATED_AT = "2026-10-24T00:00:00.000Z";
const EDITED_AT = "2026-10-24T01:00:00.000Z";
const BOOK_ID = "северная-история";

// Fixed author-supplied chapters and truth deltas. The test deliberately has no
// model client, HTTP server or API key: it exercises the host's production
// persistence, revision, reload and export path, not model prose generation.
const CHAPTERS = [
  {
    title: "Письмо под снегом",
    content: "Анна вышла к старому мосту. Под снегом лежало письмо с сургучной печатью.",
    fact: { subject: "Анна", predicate: "находка", object: "письмо с печатью" },
    event: "Анна нашла запечатанное письмо.",
  },
  {
    title: "Ключ от архива",
    content: "У архивариуса Анна получила медный ключ. Она спрятала письмо в карман пальто.",
    fact: { subject: "Анна", predicate: "ключ", object: "медный ключ от архива" },
    event: "Анна получила ключ от архива.",
  },
  {
    title: "Ответ на мосту",
    content: "На рассвете Анна вернулась к мосту. Она отдала письмо его владельцу.",
    fact: { subject: "письмо", predicate: "владелец", object: "архивариус" },
    event: "Анна вернула письмо архивариусу.",
  },
] as const;

function chapterDelta(chapterNumber: number): RuntimeStateDelta {
  const chapter = CHAPTERS[chapterNumber - 1]!;
  return {
    chapter: chapterNumber,
    factOps: { upsert: [chapter.fact], expire: [] },
    hookOps: {
      upsert: [],
      mention: chapterNumber < 3 ? ["письмо"] : [],
      resolve: chapterNumber === 3 ? ["письмо"] : [],
      defer: [],
    },
    newHookCandidates: [],
    chapterSummary: {
      chapter: chapterNumber,
      title: chapter.title,
      characters: "Анна, архивариус",
      events: chapter.event,
      stateChanges: `${chapter.fact.predicate}: ${chapter.fact.object}`,
      hookActivity: chapterNumber === 3 ? "Тайна письма раскрыта." : "Тайна письма развивается.",
      mood: "напряжённое",
      chapterType: "основной сюжет",
    },
  };
}

function chapterFile(chapterNumber: number) {
  return join("chapters", `${String(chapterNumber).padStart(4, "0")}_${CHAPTERS[chapterNumber - 1]!.title.replaceAll(" ", "_")}.md`);
}

function decodeXmlNumericEntities(content: string): string {
  return content
    .replace(/&#x([0-9a-f]+);/giu, (_, hex: string) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/gu, (_, decimal: string) => String.fromCodePoint(Number(decimal)));
}

it("round-trips three Russian chapters, accepted canon and a revised chapter through MD/EPUB without an LLM", async () => {
  const root = await mkdtemp(join(tmpdir(), "inkos-ru-three-chapters-"));
  try {
    const state = new StateManager(root);
    const bookDir = state.bookDir(BOOK_ID);
    const frame = "# Основа сюжета\n\nАнна ищет владельца письма у северного моста.\n";
    await state.saveBookConfig(BOOK_ID, {
      id: BOOK_ID,
      title: "Северная история",
      genre: "детектив",
      platform: "other",
      status: "outlining",
      targetChapters: 3,
      chapterWordCount: 100,
      language: "ru",
      createdAt: CREATED_AT,
      updatedAt: CREATED_AT,
    });
    await state.ensureControlDocuments(BOOK_ID, "# Авторский замысел\n\nСохранить историю письма.");
    await mkdir(join(bookDir, "story", "outline"), { recursive: true });
    await writeFile(join(bookDir, "story", "outline", "story_frame.md"), frame, "utf8");
    await writeFile(join(bookDir, "story", "outline", "volume_map.md"), "# План\n\nТри главы о письме.\n", "utf8");
    await writeFile(join(bookDir, "story", "book_rules.md"), "# Правила\n\nАнна не теряет письмо до развязки.\n", "utf8");
    await createInitialRuntimeState({
      bookDir,
      language: "ru",
      hooks: [{
        hookId: "письмо",
        startChapter: 0,
        type: "тайна",
        status: "open",
        lastAdvancedChapter: 0,
        expectedPayoff: "Кому принадлежит письмо?",
        notes: "Закрытый конверт с сургучной печатью.",
      }],
    });

    // saveChapter is a real atomic production write. Supplying a deliberately
    // unusable client makes any accidental model invocation fail immediately.
    const writer = new WriterAgent({ client: {} as never, model: "no-llm", projectRoot: root });
    const save = async (
      chapterNumber: number,
      output: WriteChapterOutput,
      now = CREATED_AT,
    ) => persistChapterArtifacts({
      chapterNumber,
      chapterTitle: output.title,
      auditResult: { observations: [], summary: "Фикстура без внешней проверки." },
      finalWordCount: countChapterLength(output.content, "ru_words"),
      loadChapterIndex: () => state.loadChapterIndex(BOOK_ID),
      saveChapter: (index) => writer.saveChapter(bookDir, output, "ru", index),
      markBookActiveIfNeeded: async () => {
        const book = await state.loadBookConfig(BOOK_ID);
        if (book.status !== "active") {
          await state.saveBookConfig(BOOK_ID, { ...book, status: "active", updatedAt: now });
        }
      },
      now: () => now,
    });

    const outputs: WriteChapterOutput[] = [];
    const canonicalSnapshots: RuntimeStateSnapshot[] = [];
    for (let chapterNumber = 1; chapterNumber <= 3; chapterNumber++) {
      const chapter = CHAPTERS[chapterNumber - 1]!;
      const truth = await buildRuntimeStateArtifacts({
        bookDir,
        delta: chapterDelta(chapterNumber),
        language: "ru",
      });
      const output: WriteChapterOutput = {
        chapterNumber,
        title: chapter.title,
        content: chapter.content,
        wordCount: countChapterLength(chapter.content, "ru_words"),
        postSettlement: chapter.event,
        runtimeStateDelta: truth.resolvedDelta,
        runtimeStateSnapshot: truth.snapshot,
        updatedState: truth.currentStateMarkdown,
        updatedHooks: truth.hooksMarkdown,
        updatedChapterSummaries: truth.chapterSummariesMarkdown,
        runtimeStateApplied: true,
      };
      outputs.push(output);
      await save(chapterNumber, output);

      const persisted = await loadRuntimeStateSnapshotAtChapter({ bookDir, chapterNumber, language: "ru" });
      expect(persisted).toEqual(truth.snapshot);
      canonicalSnapshots.push(persisted);
      expect(persisted.manifest.language).toBe("ru");
      expect(persisted.manifest.lastAppliedChapter).toBe(chapterNumber);
      expect(persisted.chapterSummaries.rows.map((row) => row.chapter))
        .toEqual(Array.from({ length: chapterNumber }, (_, n) => n + 1));
      expect(await readFile(join(bookDir, chapterFile(chapterNumber)), "utf8"))
        .toBe(`# Глава ${chapterNumber}. ${chapter.title}\n\n${chapter.content}`);
      await syncWorkSourceArtifacts({ projectRoot: root, workId: BOOK_ID, accept: true });
    }

    const beforeEdit = await loadWorkManifest(root, BOOK_ID);
    const byChapter = (work: typeof beforeEdit, n: number) =>
      work.artifacts.find((artifact) => artifact.revisions.some((rev) => rev.path === `source/${chapterFile(n).replaceAll("\\", "/")}`))!;
    const original3 = byChapter(beforeEdit, 3);
    expect(original3.currentRevisionId).toBeTruthy();
    const earlierRevisions = [1, 2].map((n) => byChapter(beforeEdit, n).currentRevisionId);
    const canonBeforeEdit = await loadRuntimeStateSnapshot(bookDir);
    expect(canonBeforeEdit.currentState.facts.map((fact) => fact.object)).toEqual(
      expect.arrayContaining(["письмо с печатью", "медный ключ от архива", "архивариус"]),
    );
    expect(canonBeforeEdit.hooks.hooks.find((hook) => hook.hookId === "письмо")?.status).toBe("resolved");

    // Edit only the final chapter's prose so the established truth for chapters
    // 1–3 remains valid. The real writer persists it; the work store versions it.
    const oldChapter3 = await readFile(join(bookDir, chapterFile(3)), "utf8");
    const archived = await archiveChapterVersion(bookDir, 3, oldChapter3, "revision", new Date(EDITED_AT));
    const revisedProse = "На рассвете Анна снова пришла к мосту. Архивариус узнал печать, и Анна передала ему письмо.";
    await save(3, { ...outputs[2]!, content: revisedProse }, EDITED_AT);
    await syncWorkSourceArtifacts({ projectRoot: root, workId: BOOK_ID, accept: true });

    // Fresh instances must see the same accepted text, index, typed canon and
    // historical revision. Neither early chapter nor its stored snapshot moves.
    const reloaded = new StateManager(root);
    const reloadedBook = await reloaded.loadBookConfig(BOOK_ID);
    const index = await reloaded.loadChapterIndex(BOOK_ID);
    const afterEdit = await loadWorkManifest(root, BOOK_ID);
    const current3 = byChapter(afterEdit, 3);
    expect(reloadedBook).toMatchObject({ title: "Северная история", language: "ru", status: "active" });
    expect(index.map((chapter) => chapter.number)).toEqual([1, 2, 3]);
    expect(index.map((chapter) => chapter.wordCount)).toEqual([
      countChapterLength(CHAPTERS[0].content, "ru_words"),
      countChapterLength(CHAPTERS[1].content, "ru_words"),
      countChapterLength(revisedProse, "ru_words"),
    ]);
    expect(index[2]?.updatedAt).toBe(EDITED_AT);
    expect(await reloaded.getNextChapterNumber(BOOK_ID)).toBe(4);
    expect(await loadRuntimeStateSnapshot(bookDir)).toEqual(canonBeforeEdit);
    for (let chapterNumber = 1; chapterNumber <= 3; chapterNumber++) {
      expect(await loadRuntimeStateSnapshotAtChapter({ bookDir, chapterNumber, language: "ru" }))
        .toEqual(canonicalSnapshots[chapterNumber - 1]);
    }
    expect((await readFile(join(bookDir, "story", "current_state.md"), "utf8")))
      .toContain("# Текущее состояние");
    expect(await readFile(join(bookDir, "story", "outline", "story_frame.md"), "utf8")).toBe(frame);
    expect(afterEdit.language).toBe("ru");
    expect([1, 2].map((n) => byChapter(afterEdit, n).currentRevisionId)).toEqual(earlierRevisions);
    expect(current3.id).toBe(original3.id);
    expect(current3.currentRevisionId).not.toBe(original3.currentRevisionId);
    expect(await readChapterVersion(bookDir, 3, archived.id)).toBe(oldChapter3);
    expect((await readArtifactRevision({
      projectRoot: root, workId: BOOK_ID, artifactId: current3.id, revisionId: original3.currentRevisionId!,
    })).bytes.toString("utf8")).toBe(oldChapter3);
    expect((await readArtifactRevision({
      projectRoot: root, workId: BOOK_ID, artifactId: current3.id,
    })).bytes.toString("utf8")).toContain(revisedProse);

    const markdown = await writeExportArtifact(reloaded, BOOK_ID, { format: "md" });
    const md = await readFile(markdown.outputPath, "utf8");
    expect(markdown).toMatchObject({ chaptersExported: 3, totalWords: index.reduce((sum, ch) => sum + ch.wordCount, 0) });
    expect(md).toContain("# Северная история");
    expect(md.match(/^# Глава \d+\./gmu)).toHaveLength(3);
    expect(md).toContain(revisedProse);
    expect(md).not.toContain(CHAPTERS[2].content);
    expect(await loadChaptersFromPath(markdown.outputPath)).toEqual([
      { title: CHAPTERS[0].title, content: CHAPTERS[0].content },
      { title: CHAPTERS[1].title, content: CHAPTERS[1].content },
      { title: CHAPTERS[2].title, content: revisedProse },
    ]);

    const epub = await buildExportArtifact(reloaded, BOOK_ID, { format: "epub" });
    const zip = await JSZip.loadAsync(epub.payload);
    const chapterXhtml = Object.values(zip.files)
      .filter((file) => !file.dir && /\.xhtml$/iu.test(file.name) && !/(?:^|\/)toc\.xhtml$/iu.test(file.name));
    expect(chapterXhtml).toHaveLength(3);
    const xml = decodeXmlNumericEntities((await Promise.all(
      Object.values(zip.files)
        .filter((file) => !file.dir && /\.(?:opf|xhtml|html)$/iu.test(file.name))
        .map((file) => file.async("string")),
    )).join("\n"));
    expect(epub.chaptersExported).toBe(3);
    expect(xml).toContain("ru-RU");
    expect(xml).toContain(revisedProse);
    expect(xml).toContain("Ключ от архива");
    expect(xml).not.toContain(CHAPTERS[2].content);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}, 20_000);
