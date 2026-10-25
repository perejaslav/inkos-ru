/** Build the complete schema-valid parameters for the confirmed next-chapter action. */
export async function writeNextParameters(
  state: { getNextChapterNumber(bookId: string): Promise<number> },
  bookId: string,
  instruction: string,
  chapterCount = 1,
  chapterWordCount?: number,
) {
  return {
    bookId,
    instruction,
    chapterCount,
    startChapterNumber: await state.getNextChapterNumber(bookId),
    ...(chapterWordCount ? { chapterWordCount } : {}),
  };
}