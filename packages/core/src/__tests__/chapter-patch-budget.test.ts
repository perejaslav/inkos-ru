import { describe, expect, it } from "vitest";
import { ChapterPatchBudget } from "../harness/chapter-patch-budget.js";

describe("autonomous chapter patch budget", () => {
  it("permits eight successful local edits, then refuses the ninth without mutation", () => {
    const budget = new ChapterPatchBudget(8, 600_000);
    for (let i = 0; i < 8; i++) {
      budget.assertAvailable("novel:1", 1000 + i);
      budget.recordApplied("novel:1", 1000 + i);
    }
    expect(() => budget.assertAvailable("novel:1", 1010)).toThrow("CHAPTER_PATCH_LIMIT_REACHED");
    expect(() => budget.assertAvailable("novel:2", 1010)).not.toThrow();
    expect(() => budget.assertAvailable("novel:1", 601010)).not.toThrow();
  });
});