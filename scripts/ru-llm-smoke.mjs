import { createLLMClient, chatCompletion } from "../packages/core/dist/llm/provider.js";

const baseUrl = process.env.INKOS_RU_LLM_BASE_URL ?? "http://127.0.0.1:18081/v1";
const model = process.env.INKOS_RU_LLM_MODEL ?? "inkos-ru-smoke";
const client = createLLMClient({
  provider: "custom", service: "custom", baseUrl, apiKey: "",
  model, apiFormat: "chat", stream: false, temperature: 0.5,
  thinkingBudget: 0,
  extra: { chat_template_kwargs: { enable_thinking: false } },
});
const messages = [
  { role: "system", content: "Ты пишешь художественную прозу на русском языке. Сохраняй установленные имена и факты. Никаких пояснений." },
  { role: "user", content: "Напиши короткую сцену: Илья находит у пристани ключ «Север». Марина запрещает отдавать его смотрителю. Не добавляй новых имён." },
];
try {
  const response = await chatCompletion(client, model, messages, { maxTokens: 512, retry: false });
  const content = response.content?.trim() ?? "";
  if (!content || !content.includes("Иль") || !content.includes("Марин") || !content.includes("Север")) {
    throw new Error("Русский текст отсутствует или нарушены ключевые имена/факты.");
  }
  console.log("INKOS_RU_LLM_SMOKE_PASS");
  console.log(content);
} catch (error) {
  console.error("INKOS_RU_LLM_SMOKE_FAIL", error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}