import { getAppLanguage } from "./app-language";

const KNOWN_RUNTIME_REPLACEMENTS: ReadonlyArray<{
  readonly pattern: RegExp;
  readonly replacement: string;
  readonly ru: string;
}> = [
  {
    pattern: /Studio LLM API key not set\. Open Studio services and save an API key for the selected service\./g,
    replacement: "Studio 模型 API Key 未设置。请打开“模型配置”，为当前服务保存 API Key。",
    ru: "Ключ API модели Studio не задан. Откройте настройки моделей и сохраните ключ выбранного сервиса.",
  },
  {
    pattern: /INKOS_LLM_API_KEY not set\. Run 'inkos config set-global' or add it to project \.env file\./g,
    replacement: "INKOS_LLM_API_KEY 未设置。请运行 `inkos config set-global`，或在项目 .env 文件中添加它。",
    ru: "Переменная INKOS_LLM_API_KEY не задана. Выполните `inkos config set-global` или добавьте её в .env проекта.",
  },
];

export function localizeKnownRuntimeMessage(message: string): string {
  // Runtime messages arrive in English; in English mode show them as-is.
  const lang = getAppLanguage();
  if (lang === "en") return message;
  let localized = message;
  for (const entry of KNOWN_RUNTIME_REPLACEMENTS) {
    localized = localized.replace(entry.pattern, lang === "ru" ? entry.ru : entry.replacement);
  }
  if (lang === "ru") {
    localized = localized
      .replace(/Patched chapter (\d+)\./g, "Внесены изменения в главу $1.")
      .replace(/Reviewed chapter (\d+); (\d+) observation\(s\)\./g, "Проверена глава $1; замечаний: $2.")
      .replace(/Completed (\d+) chapter\(s\) for "[^"]+"\./g, "Написано глав: $1.")
      .replace(/CHAPTER_PATCH_LIMIT_REACHED:/g, "Достигнут лимит автоматических правок:");
  }
  return localized;
}
