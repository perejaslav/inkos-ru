/** Fail closed when an AI report cites URLs outside the captured public sources. */
export function validateRussianMarketReport(report: unknown, sourceUrls: ReadonlySet<string>): string {
  if (typeof report !== "string" || !report.trim()) throw new Error("ИИ вернул пустой отчёт");
  if (report.length > 20_000) throw new Error("ИИ вернул слишком длинный отчёт");
  const urls = report.match(/https?:\/\/[^\s<>"'`]+/gi) ?? [];
  for (const raw of urls) {
    let url: URL;
    try { url = new URL(raw.replace(/[.,;:!?)}\]]+$/, "")); }
    catch { throw new Error("ИИ вернул некорректную ссылку"); }
    if (!sourceUrls.has(url.href)) throw new Error("ИИ указал ссылку, отсутствующую в исходных данных");
  }
  // These quantitative claims cannot be derived from supply counts or ranking positions.
  if (/(?:продаж|выручк|просмотр|читател|спрос)[^.!?\n]{0,45}\b\d[\d\s.,%]*|\b\d[\d\s.,%]*[^.!?\n]{0,45}(?:продаж|выручк|просмотр|читател|спрос)/iu.test(report)) {
    throw new Error("ИИ указал неподтверждённые количественные показатели спроса или продаж");
  }
  return report.trim();
}
