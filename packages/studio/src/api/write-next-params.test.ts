import { expect, it, vi } from "vitest";
import { writeNextParameters } from "./write-next-params";

it("sends the next persisted chapter number to the schema for the quick action", async () => {
  const getNextChapterNumber = vi.fn().mockResolvedValue(3);
  const args = await writeNextParameters({ getNextChapterNumber }, "тестовый-роман", "Напиши следующую главу");
  expect(args).toEqual({ bookId: "тестовый-роман", instruction: "Напиши следующую главу", chapterCount: 1, startChapterNumber: 3 });
  expect(getNextChapterNumber).toHaveBeenCalledWith("тестовый-роман");
});