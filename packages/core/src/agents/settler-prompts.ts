import type { BookConfig } from "../models/book.js";
import type { BookRules } from "../models/book-rules.js";

export function buildSettlerSystemPrompt(
  book: BookConfig,
  bookRules: BookRules | null,
  language: "zh" | "en" | "ru",
): string {
  const fullCast = bookRules?.enableFullCastTracking
    ? language === "ru"
      ? "Учитывай каждого персонажа, присутствующего или прямо упомянутого в главе."
      : language === "en"
      ? "Track every present or explicitly mentioned character in the submitted state delta."
      : "在提交的状态变更中追踪本章出场或明确被提及的角色。"
    : "";
  if (language === "ru") {
    return `Выдели явные факты главы и перенеси их в обновление состояния произведения, используя активированный Skill. Сохраняй несвязанные факты и постоянные идентификаторы. Планы нельзя считать уже произошедшими событиями. ${fullCast}\nПроизведение: ${book.title}.`;
  }
  return language === "en"
    ? `Project explicit facts from the chapter into incremental runtime truth using the activated long-writing Skill. Preserve unrelated state and stable ids. Plans are not completed events. ${fullCast}\nWork: ${book.title}.`
    : `按已激活的长篇写作 Skill，把正文明确事实投影为增量运行时 truth。保留无关状态和稳定 id，不把计划当成已发生事件。${fullCast}\n作品：${book.title}。`;
}

export function buildSettlerUserPrompt(params: {
  readonly chapterNumber: number;
  readonly title: string;
  readonly content: string;
  readonly selectedEvidenceBlock?: string;
  readonly governedControlBlock: string;
  readonly validationFeedback?: string;
  readonly language?: "zh" | "en" | "ru";
}): string {
  const isEnglish = params.language === "en";
  const isRussian = params.language === "ru";
  const heading = (en: string, zh: string, ru: string) => isRussian ? ru : isEnglish ? en : zh;
  const block = (title: string, value: string) => value
    ? `\n## ${title}\n${value}\n`
    : "";
  const controlBlock = params.governedControlBlock;

  return `${isRussian ? `Перенеси факты главы ${params.chapterNumber} «${params.title}» в текущее состояние произведения.` : isEnglish ? `Project Chapter ${params.chapterNumber} "${params.title}" into runtime truth.` : `把第${params.chapterNumber}章「${params.title}」投影到运行时 truth。`}
${params.validationFeedback ? block(heading("Reconciliation observations", "状态对账观察", "Замечания по согласованию состояния"), params.validationFeedback) : ""}
## ${heading("Chapter body", "本章正文", "Текст главы")}
${params.content}
${controlBlock}
${block(heading("Selected authority and long-range evidence", "已选权威与长程证据", "Установленные факты и доказательства"), params.selectedEvidenceBlock ?? "")}`;
}
