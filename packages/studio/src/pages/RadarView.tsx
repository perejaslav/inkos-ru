import { useEffect, useState } from "react";
import type { Theme } from "../hooks/use-theme";
import type { TFunction } from "../hooks/use-i18n";
import { useColors } from "../hooks/use-colors";
import { fetchJson } from "../hooks/use-api";
import { TrendingUp, Loader2, Target, Clock } from "lucide-react";
import { compareRussianMarketSnapshots } from "../../../core/src/agents/ru-market-trends";

interface Recommendation {
  readonly platform: string;
  readonly genre: string;
  readonly concept: string;
  readonly reasoning: string;
  readonly benchmarkTitles: ReadonlyArray<string>;
}

interface RadarResult {
  readonly marketSummary: string;
  readonly recommendations: ReadonlyArray<Recommendation>;
}

interface RadarHistoryItem {
  readonly file: string;
  readonly timestamp: string;
  readonly summaryPreview: string;
  readonly result: RadarResult;
}

interface GenreSupply {
  readonly genre: string;
  readonly booksCount: number;
  readonly url: string;
  readonly collectedAt: string;
}
interface RankedBook { readonly title: string; readonly author: string; readonly rank: number; readonly url: string; readonly collectedAt: string }
interface RuSnapshot { readonly timestamp: string; readonly sources: ReadonlyArray<{ readonly source: string; readonly status: string; readonly items: ReadonlyArray<unknown>; readonly error: string | null }> }

interface Nav { toDashboard: () => void }

export function RadarView({ nav, theme, t }: { nav: Nav; theme: Theme; t: TFunction }) {
  const c = useColors(theme);
  const [result, setResult] = useState<RadarResult | null>(null);
  const [history, setHistory] = useState<ReadonlyArray<RadarHistoryItem>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ruGenres, setRuGenres] = useState<ReadonlyArray<GenreSupply>>([]);
  const [ruBooks, setRuBooks] = useState<ReadonlyArray<RankedBook>>([]);
  const [authorBooks, setAuthorBooks] = useState<ReadonlyArray<RankedBook>>([]);
  const [authorLoading, setAuthorLoading] = useState(false);
  const [authorError, setAuthorError] = useState("");
  const [combinedLoading, setCombinedLoading] = useState(false);
  const [combinedStatus, setCombinedStatus] = useState("");
  const [snapshots, setSnapshots] = useState<ReadonlyArray<RuSnapshot>>([]);
  const [savingSnapshot, setSavingSnapshot] = useState(false);
  const [snapshotError, setSnapshotError] = useState("");
  const [aiReport, setAiReport] = useState("");
  const [aiModel, setAiModel] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const analyzeRussianMarket = async () => {
    setAiLoading(true);
    setAiError("");
    setAiReport("");
    try {
      const data = await fetchJson<{ report: string; model: string }>("/radar/ru/analyze", { method: "POST", signal: AbortSignal.timeout(100000) });
      setAiReport(data.report);
      setAiModel(data.model);
    } catch (e) { setAiError(e instanceof Error ? e.message : String(e)); }
    finally { setAiLoading(false); }
  };
  const loadSnapshots = async () => {
    try { setSnapshots((await fetchJson<{ items: RuSnapshot[] }>("/radar/ru/history")).items); setSnapshotError(""); }
    catch (e) { setSnapshotError(e instanceof Error ? e.message : String(e)); }
    finally { setHistoryLoaded(true); }
  };
  const saveSnapshot = async () => {
    setSavingSnapshot(true);
    setSnapshotError("");
    setAiReport("");
    try {
      await fetchJson<RuSnapshot>("/radar/ru/snapshot", { method: "POST", signal: AbortSignal.timeout(30000) });
      await loadSnapshots();
    } catch (e) { setSnapshotError(e instanceof Error ? e.message : String(e)); }
    finally { setSavingSnapshot(false); }
  };
  const loadCombined = async () => {
    setCombinedLoading(true);
    setCombinedStatus("");
    setRuGenres([]);
    setRuBooks([]);
    setAuthorBooks([]);
    const responses = await Promise.allSettled([
      fetchJson<{ items: GenreSupply[] }>("/radar/ru/litmarket/genres", { signal: AbortSignal.timeout(20000) }),
      fetchJson<{ items: RankedBook[] }>("/radar/ru/litnet/popular", { signal: AbortSignal.timeout(20000) }),
      fetchJson<{ items: RankedBook[] }>("/radar/ru/author-today/monthly", { signal: AbortSignal.timeout(20000) }),
    ]);
    const labels = ["Литмаркет", "Литнет", "Author.Today"];
    const messages = responses.map((response, index) => response.status === "fulfilled"
      ? `${labels[index]}: данные получены`
      : `${labels[index]}: недоступен (${response.reason instanceof Error ? response.reason.message : String(response.reason)})`);
    if (responses[0].status === "fulfilled") setRuGenres(responses[0].value.items);
    if (responses[1].status === "fulfilled") setRuBooks(responses[1].value.items);
    if (responses[2].status === "fulfilled") setAuthorBooks(responses[2].value.items);
    setCombinedStatus(messages.join("; "));
    setCombinedLoading(false);
  };
  const loadAuthorToday = async () => {
    setAuthorLoading(true);
    setAuthorError("");
    try {
      const data = await fetchJson<{ items: RankedBook[] }>("/radar/ru/author-today/monthly", { signal: AbortSignal.timeout(20_000) });
      setAuthorBooks(data.items);
    } catch (e) { setAuthorError(e instanceof Error ? e.message : String(e)); }
    finally { setAuthorLoading(false); }
  };
  const [booksLoading, setBooksLoading] = useState(false);
  const [booksError, setBooksError] = useState("");
  const loadLitnet = async () => {
    setBooksLoading(true);
    setBooksError("");
    try {
      const data = await fetchJson<{ items: RankedBook[] }>("/radar/ru/litnet/popular", { signal: AbortSignal.timeout(20_000) });
      setRuBooks(data.items);
    } catch (e) {
      setBooksError(e instanceof Error ? e.message : String(e));
    } finally { setBooksLoading(false); }
  };
  const [ruLoading, setRuLoading] = useState(false);
  const [ruError, setRuError] = useState("");

  const loadRussianMarket = async () => {
    setRuLoading(true);
    setRuError("");
    try {
      const response = await fetchJson<{ items: GenreSupply[] }>("/radar/ru/litmarket/genres", {
        signal: AbortSignal.timeout(20_000),
      });
      setRuGenres(response.items);
    } catch (e) {
      setRuError(e instanceof Error ? e.message : String(e));
    } finally {
      setRuLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      const data = await fetchJson<{ items: ReadonlyArray<RadarHistoryItem> }>("/radar/history");
      setHistory(data.items ?? []);
    } catch {
      setHistory([]);
    }
  };

  useEffect(() => {
    void loadHistory();
    void loadSnapshots();
  }, []);

  const handleScan = async () => {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const data = await fetchJson<RadarResult>("/radar/scan", {
        method: "POST",
        signal: AbortSignal.timeout(120_000),
      });
      setResult(data);
      await loadHistory();
    } catch (e) {
      setError(e instanceof Error && (e.name === "TimeoutError" || e.name === "AbortError")
        ? "Анализ превысил 2 минуты. Проверьте доступность источников и ИИ-модели, затем повторите попытку."
        : e instanceof Error ? e.message : String(e));
    }
    setLoading(false);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <button onClick={nav.toDashboard} className={c.link}>{t("bread.home")}</button>
        <span className="text-border">/</span>
        <span>{t("nav.radar")}</span>
      </div>

      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl flex items-center gap-3">
          <TrendingUp size={28} className="text-primary" />
          {t("radar.title")}
        </h1>
        <button
          onClick={handleScan}
          disabled={loading}
          className={`px-5 py-2.5 text-sm rounded-lg ${c.btnPrimary} disabled:opacity-30 flex items-center gap-2`}
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Target size={14} />}
          {loading ? t("radar.scanning") : t("radar.scan")}
        </button>
      </div>

      <section className={`border ${c.cardStatic} rounded-lg p-5 space-y-3`}>
        <h2 className="font-semibold">Российский книжный рынок — сводка источников</h2>
        <p className="text-sm text-muted-foreground">Загрузите данные трёх площадок одним запросом. Количество произведений и позиции в рейтингах не являются продажами; показатели площадок нельзя складывать.</p>
        <button onClick={loadCombined} disabled={combinedLoading} className={`rounded-lg px-4 py-2 text-sm ${c.btnPrimary} disabled:opacity-40`}>
          {combinedLoading ? "Получение данных..." : "Собрать данные российского рынка"}
        </button>
        <button onClick={saveSnapshot} disabled={savingSnapshot} className={`rounded-lg px-4 py-2 text-sm ${c.btnSecondary} disabled:opacity-40`}>
          {savingSnapshot ? "Сохранение снимка..." : "Собрать и сохранить снимок"}
        </button>
        <button onClick={analyzeRussianMarket} disabled={aiLoading || savingSnapshot || snapshots.length === 0} title={snapshots.length === 0 ? "Сначала соберите и сохраните снимок" : undefined} className={`rounded-lg px-4 py-2 text-sm ${c.btnSecondary} disabled:opacity-40`}>
          {aiLoading ? "Анализ ИИ..." : "Подготовить аналитический отчёт ИИ"}
        </button>
        {aiError && <p role="alert" className="text-sm text-destructive">{aiError}</p>}
        {aiReport && <div className="space-y-2"><h3 className="font-medium">Отчёт ИИ ({aiModel})</h3><p className="whitespace-pre-wrap text-sm leading-relaxed">{aiReport}</p></div>}
        {snapshotError && <p role="alert" className="text-sm text-destructive">{snapshotError}</p>}
        {historyLoaded && snapshots.length === 0 && !snapshotError && <p className="text-sm text-muted-foreground">Сохранённых снимков пока нет. Нажмите «Собрать и сохранить снимок», чтобы получить первый отчёт.</p>}
        {snapshots.length > 0 && <div className="text-sm space-y-1">
          <h3 className="font-medium">История снимков (последние {snapshots.length})</h3>
          {snapshots.slice(0, 5).map((snapshot) => <p key={snapshot.timestamp} className="text-muted-foreground">
            {new Date(snapshot.timestamp).toLocaleString("ru-RU")}: {snapshot.sources.map(source => `${source.source} — ${source.status === "ok" ? source.items.length + " записей" : "ошибка"}`).join("; ")}
          </p>)}
        </div>}
        {snapshots.length >= 2 && <div className="text-sm space-y-2">
          <h3 className="font-medium">Изменения предложения жанров между двумя последними снимками</h3>
          <p className="text-xs text-muted-foreground">Сравнивается количество произведений Литмаркета, а не продажи или спрос. Разница может отражать изменения каталога.</p>
          {compareRussianMarketSnapshots(snapshots[1], snapshots[0]).length === 0
            ? <p className="text-muted-foreground">Сопоставимых данных нет.</p>
            : compareRussianMarketSnapshots(snapshots[1], snapshots[0]).slice(0, 10).map(change => <div key={change.genre} className="flex justify-between gap-3">
              <a href={change.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{change.genre}</a>
              <span className="tabular-nums">{change.previous.toLocaleString("ru-RU")} → {change.current.toLocaleString("ru-RU")} ({change.delta > 0 ? "+" : ""}{change.delta}; {change.percent === null ? "н/д" : `${change.percent}%`})</span>
            </div>)}
        </div>}
        {combinedStatus && <p role="status" className="text-sm text-muted-foreground">{combinedStatus}</p>}
        {(ruGenres.length > 0 || ruBooks.length > 0 || authorBooks.length > 0) && <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          <div><strong>Литмаркет</strong><p>{ruGenres.length} жанров; количество опубликованных произведений</p></div>
          <div><strong>Литнет</strong><p>{ruBooks.length} книг в публичной выдаче</p></div>
          <div><strong>Author.Today</strong><p>{authorBooks.length} книг в месячной выдаче</p></div>
        </div>}
      </section>

      <section className={`border ${c.cardStatic} rounded-lg p-5 space-y-3`}>
        <h2 className="font-semibold">Российский рынок — предложение по жанрам</h2>
        <p className="text-sm text-muted-foreground">Пилотный источник: Литмаркет. Показано количество опубликованных произведений, а не продажи, просмотры или спрос.</p>
        <button onClick={loadRussianMarket} disabled={ruLoading} className={`rounded-lg px-4 py-2 text-sm ${c.btnSecondary} disabled:opacity-40`}>
          {ruLoading ? "Получение данных..." : "Загрузить жанры Литмаркета"}
        </button>
        {ruError && <p role="alert" className="text-sm text-destructive">{ruError}</p>}
        {ruGenres.length > 0 && <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Снимок: {new Date(ruGenres[0].collectedAt).toLocaleString("ru-RU")}</p>
          {ruGenres.slice().sort((a, b) => b.booksCount - a.booksCount).map((item) => (
            <div key={item.url} className="flex justify-between gap-3 text-sm border-b border-border/30 pb-1">
              <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{item.genre}</a>
              <span className="tabular-nums">{item.booksCount.toLocaleString("ru-RU")}</span>
            </div>
          ))}
        </div>}
      </section>
      <section className={`border ${c.cardStatic} rounded-lg p-5 space-y-3`}>
        <h2 className="font-semibold">Литнет — популярные произведения</h2>
        <p className="text-sm text-muted-foreground">Порядок карточек в публичном разделе «Популярные». Позиция в списке не является подтверждённым количеством продаж.</p>
        <button onClick={loadLitnet} disabled={booksLoading} className={`rounded-lg px-4 py-2 text-sm ${c.btnSecondary} disabled:opacity-40`}>
          {booksLoading ? "Получение рейтинга..." : "Загрузить популярные книги Литнета"}
        </button>
        {booksError && <p role="alert" className="text-sm text-destructive">{booksError}</p>}
        {ruBooks.length > 0 && <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Снимок: {new Date(ruBooks[0].collectedAt).toLocaleString("ru-RU")}</p>
          {ruBooks.map((book) => <div key={book.url} className="flex justify-between gap-2 text-sm border-b border-border/30 pb-1">
            <span><span className="text-muted-foreground">{book.rank}. </span><a href={book.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{book.title}</a> <span className="text-muted-foreground">— {book.author}</span></span>
          </div>)}
        </div>}
      </section>
      <section className={`border ${c.cardStatic} rounded-lg p-5 space-y-3`}>
        <h2 className="font-semibold">Author.Today — популярные книги за месяц</h2>
        <p className="text-sm text-muted-foreground">Публичная выдача, отсортированная по популярности за месяц. Позиция не означает количество продаж.</p>
        <button onClick={loadAuthorToday} disabled={authorLoading} className={`rounded-lg px-4 py-2 text-sm ${c.btnSecondary} disabled:opacity-40`}>
          {authorLoading ? "Получение рейтинга..." : "Загрузить рейтинг Author.Today"}
        </button>
        {authorError && <p role="alert" className="text-sm text-destructive">{authorError}</p>}
        {authorBooks.length > 0 && <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Снимок: {new Date(authorBooks[0].collectedAt).toLocaleString("ru-RU")}</p>
          {authorBooks.map(book => <div key={book.url} className="text-sm border-b border-border/30 pb-1">
            <span className="text-muted-foreground">{book.rank}. </span><a href={book.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{book.title}</a>
            <span className="text-muted-foreground"> — {book.author}</span>
          </div>)}
        </div>}
      </section>

      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg text-sm">{error}</div>
      )}

      {result && (
        <div className="space-y-6">
          <div className={`border ${c.cardStatic} rounded-lg p-5`}>
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">{t("radar.summary")}</h3>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{result.marketSummary}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {result.recommendations.map((rec, i) => (
              <div key={i} className={`border ${c.cardStatic} rounded-lg p-5 space-y-3`}>
                <div className="flex items-center">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {rec.platform} · {rec.genre}
                  </span>
                </div>
                <p className="text-sm font-semibold">{rec.concept}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{rec.reasoning}</p>
                {rec.benchmarkTitles.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {rec.benchmarkTitles.map((bt) => (
                      <span key={bt} className="px-2 py-0.5 text-[10px] bg-secondary rounded">{bt}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {history.length > 0 && (
        <div className={`border ${c.cardStatic} rounded-lg p-5 space-y-3`}>
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Clock size={14} />
            {t("radar.history")}
          </h3>
          <div className="space-y-2">
            {history.slice(0, 10).map((item) => (
              <button
                key={item.file}
                onClick={() => setResult(item.result)}
                className="w-full rounded-md border border-border/40 px-3 py-2 text-left text-xs hover:bg-muted/30"
              >
                <div className="font-medium text-foreground">{new Date(item.timestamp).toLocaleString()}</div>
                <div className="mt-1 line-clamp-2 text-muted-foreground">{item.summaryPreview || item.file}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {!result && !loading && !error && (
        <div className={`border border-dashed ${c.cardStatic} rounded-lg p-12 text-center text-muted-foreground text-sm italic`}>
          {t("radar.emptyHint")}
        </div>
      )}
    </div>
  );
}
