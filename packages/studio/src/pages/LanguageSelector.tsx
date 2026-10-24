import { useState } from "react";
import { getAppLanguage } from "../lib/app-language";

export function LanguageSelector({ onSelect, onUiRussian }: { onSelect: (lang: "zh" | "en" | "ru") => void; onUiRussian: () => void }) {
  const [hovering, setHovering] = useState<"zh" | "en" | "ru" | null>(null);
  const [selected, setSelected] = useState<"zh" | "en" | "ru" | null>(null);

  const handleSelect = (lang: "zh" | "en" | "ru") => {
    setSelected(lang);
    // Brief pause for the selection animation before transitioning
    setTimeout(() => onSelect(lang), 400);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-8">
      {/* Logo — cinematic scale */}
      <div className="mb-16 text-center">
        <div className="flex items-baseline justify-center gap-1.5 mb-4">
          <span className="font-serif text-6xl italic text-primary">Ink</span>
          <span className="text-5xl font-semibold tracking-tight text-foreground">OS</span>
        </div>
        <div className="text-base text-muted-foreground tracking-widest uppercase">Studio</div>
      </div>

      {/* Language cards — generous, distinct, immersive */}
      <div className="flex flex-wrap justify-center gap-8 mb-16">
        <button
          onClick={() => handleSelect("zh")}
          onMouseEnter={() => setHovering("zh")}
          onMouseLeave={() => setHovering(null)}
          className={`group w-80 border rounded-lg p-10 text-left transition-all duration-300 ${
            selected === "zh"
              ? "border-primary bg-primary/10 scale-[1.02]"
              : hovering === "zh"
                ? "border-primary/50 bg-card"
                : "border-border bg-card/50"
          }`}
        >
          <div className="font-serif text-3xl mb-4 text-foreground">中文创作</div>
          <div className="text-base text-foreground/70 leading-relaxed mb-6">
            玄幻 · 仙侠 · 都市 · 恐怖 · 通用
          </div>
          <div className="text-sm text-muted-foreground">
            番茄小说 · 起点中文网 · 飞卢
          </div>
        </button>

        <button
          onClick={() => handleSelect("en")}
          onMouseEnter={() => setHovering("en")}
          onMouseLeave={() => setHovering(null)}
          className={`group w-80 border rounded-lg p-10 text-left transition-all duration-300 ${
            selected === "en"
              ? "border-primary bg-primary/10 scale-[1.02]"
              : hovering === "en"
                ? "border-primary/50 bg-card"
                : "border-border bg-card/50"
          }`}
        >
          <div className="font-serif text-3xl italic mb-4 text-foreground">English Writing</div>
          <div className="text-base text-foreground/70 leading-relaxed mb-6">
            LitRPG · Progression · Romantasy · Sci-Fi · Isekai
          </div>
          <div className="text-sm text-muted-foreground">
            Royal Road · Kindle Unlimited · Scribble Hub
          </div>
        </button>
        <button
          type="button"
          onClick={() => handleSelect("ru")}
          onMouseEnter={() => setHovering("ru")}
          onMouseLeave={() => setHovering(null)}
          className={`group w-80 border rounded-lg p-10 text-left transition-all duration-300 ${
            selected === "ru"
              ? "border-primary bg-primary/10 scale-[1.02]"
              : hovering === "ru" ? "border-primary/50 bg-card" : "border-border bg-card/50"
          }`}
        >
          <div className="font-serif text-3xl mb-4 text-foreground">Русская литература</div>
          <div className="text-base text-foreground/70 leading-relaxed mb-6">
            Роман · Рассказ · Фантастика · Детектив
          </div>
          <div className="text-sm text-muted-foreground">Русский язык произведений</div>
        </button>
      </div>

      <div className="mb-4 text-center text-sm text-muted-foreground">
        {getAppLanguage() === "ru"
          ? "Выберите язык создаваемых произведений. Язык интерфейса выбирается отдельно."
          : "Choose the language of your writing project / 选择创作语言"}
      </div>
      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={onUiRussian}
          className={`rounded-lg border px-4 py-2 text-sm transition-colors ${getAppLanguage() === "ru" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"}`}
        >
          Русский интерфейс
        </button>
        <span className="text-sm text-muted-foreground">
          {getAppLanguage() === "ru" ? "Язык интерфейса можно изменить позднее" : "可在设置中更改 · Change in Settings"}
        </span>
      </div>
    </div>
  );
}
