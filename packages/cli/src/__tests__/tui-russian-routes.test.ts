import { describe, expect, it } from "vitest";
import { resolveTuiAgentRoute } from "../tui/agent-input.js";
import type { InteractionSession } from "@actalk/inkos-core";

const session = { sessionKind: "chat" } as InteractionSession;

describe("Russian TUI command routing", () => {
  it("uses Russian default instructions, not Chinese or English", () => {
    expect(resolveTuiAgentRoute("/new", session, null, "ru").userMessage)
      .toBe("Хочу создать новую книгу. Сначала согласуй со мной замысел.");
    expect(resolveTuiAgentRoute("/short", session, null, "ru").userMessage)
      .toContain("рассказ");
    expect(resolveTuiAgentRoute("/play", session, null, "ru").userMessage)
      .toContain("интерактивную историю");
    expect(resolveTuiAgentRoute("/write", session, "rom", "ru").userMessage)
      .toBe("Напиши следующую главу");
    expect(resolveTuiAgentRoute("/cancel", session, null, "ru").localResponse)
      .toBe("Нет действия, ожидающего подтверждения.");
  });
});
