/** Limit autonomous rapid-fire local patches in one editing pass. */
export class ChapterPatchBudget {
  private readonly timestamps = new Map<string, number[]>();

  constructor(private readonly maxEdits = 8, private readonly windowMs = 10 * 60_000) {}

  assertAvailable(key: string, now = Date.now()): void {
    const recent = (this.timestamps.get(key) ?? []).filter((time) => now - time < this.windowMs);
    this.timestamps.set(key, recent);
    if (recent.length >= this.maxEdits) {
      throw new Error(`CHAPTER_PATCH_LIMIT_REACHED: ${this.maxEdits} local edits were already applied in this editing pass. Stop editing this chapter, report the remaining observations to the author, and wait for a new editing session.`);
    }
  }

  recordApplied(key: string, now = Date.now()): void {
    const recent = (this.timestamps.get(key) ?? []).filter((time) => now - time < this.windowMs);
    this.timestamps.set(key, [...recent, now]);
  }
}