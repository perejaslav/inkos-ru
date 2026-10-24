import { getAppLanguage } from "./app-language";

// Presentation only: retain upstream provider IDs, endpoints and native labels.
const russianProviderLabels: Record<string, string> = {
  "百炼 (通义千问)": "Alibaba Cloud (Qwen / DashScope)",
  "百炼 Coding Plan": "Alibaba Cloud Coding Plan",
  "火山引擎 (豆包)": "Volcengine (Doubao)",
  "火山 Coding Plan": "Volcengine Coding Plan",
  "腾讯混元": "Tencent Hunyuan",
  "腾讯云 (lkeap)": "Tencent Cloud (LKEAP)",
  "文心一言 (千帆)": "Baidu Qianfan (ERNIE)",
  "讯飞星火": "iFLYTEK Spark",
  "讯飞星辰 Astron Coding Plan": "iFLYTEK Astron Coding Plan",
  "小米 MiMo": "Xiaomi MiMo",
  "美团 LongCat": "Meituan LongCat",
  "书生浦语 (InternLM)": "InternLM",
  "零一万物 (01.AI)": "01.AI (Yi)",
  "360 智脑": "360 AI",
  "阶跃星辰": "StepFun",
  "无问芯穹 InfiniAI": "InfiniAI",
  "百川智能": "Baichuan AI",
  "LM Studio (本地)": "LM Studio (локально)",
  "自定义端点": "Свой API-сервер",
  "New API (中转网关)": "New API (прокси)",
  "Ollama (本地)": "Ollama (локально)",
  "魔搭社区 ModelScope": "ModelScope",
  "七牛云 AI": "Qiniu AI",
  "商汤日日新": "SenseNova",
  "硅基流动": "SiliconFlow",
  "智谱 GLM": "Zhipu GLM",
};

export function providerDisplayLabel(label: string): string {
  return getAppLanguage() === "ru" ? (russianProviderLabels[label] ?? label) : label;
}