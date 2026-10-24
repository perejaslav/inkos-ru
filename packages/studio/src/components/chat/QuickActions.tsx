import {
  Zap,
  Search,
  FileOutput,
  TrendingUp,
} from "lucide-react";

export interface QuickActionsProps {
  readonly onAction: (command: string, requestedIntent?: "write_next") => void;
  readonly disabled: boolean;
  readonly isZh: boolean;
  readonly isRu?: boolean;
  readonly writingLanguage?: "zh" | "en" | "ru";
}

interface ChipDef {
  readonly icon: React.ReactNode;
  readonly labelZh: string;
  readonly labelEn: string;
  readonly labelRu: string;
  readonly commandZh: string;
  readonly commandEn: string;
  readonly commandRu: string;
  readonly requestedIntent?: "write_next";
}

const CHIPS: ReadonlyArray<ChipDef> = [
  {
    icon: <Zap size={12} />,
    labelZh: "写下一章",
    labelEn: "Write next",
    labelRu: "Следующая глава",
    commandZh: "写下一章",
    commandEn: "write next",
    commandRu: "Напиши следующую главу",
    requestedIntent: "write_next",
  },
  {
    icon: <Search size={12} />,
    labelZh: "审计",
    labelEn: "Audit",
    labelRu: "Проверить",
    commandZh: "审计",
    commandEn: "audit",
    commandRu: "Проверь книгу",
  },
  {
    icon: <FileOutput size={12} />,
    labelZh: "导出",
    labelEn: "Export",
    labelRu: "Экспорт",
    commandZh: "导出全书",
    commandEn: "export book",
    commandRu: "Экспортируй книгу",
  },
  {
    icon: <TrendingUp size={12} />,
    labelZh: "市场雷达",
    labelEn: "Market radar",
    labelRu: "Анализ рынка",
    commandZh: "扫描市场趋势",
    commandEn: "scan market trends",
    commandRu: "Изучи рыночные тенденции",
  },
];

export function QuickActions({ onAction, disabled, isZh, isRu = false, writingLanguage }: QuickActionsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto px-1 py-1">
      {CHIPS.map((chip) => {
        const label = isRu ? chip.labelRu : isZh ? chip.labelZh : chip.labelEn;
        // Labels belong to the UI; commands belong to the book/project content.
        const language = writingLanguage ?? (isZh ? "zh" : "en");
        const command = language === "ru" ? chip.commandRu : language === "zh" ? chip.commandZh : chip.commandEn;
        return (
          <button
            key={label}
            onClick={() => onAction(command, chip.requestedIntent)}
            disabled={disabled}
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary/50 border border-border/30 text-xs font-medium text-muted-foreground hover:text-primary hover:border-primary/30 hover:bg-primary/5 transition-all disabled:opacity-40 disabled:pointer-events-none group"
          >
            <span className="group-hover:scale-110 transition-transform">{chip.icon}</span>
            {label}
          </button>
        );
      })}
    </div>
  );
}
