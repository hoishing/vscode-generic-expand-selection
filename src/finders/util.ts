export function getCandidate(
  startIndex: number,
  endIndex: number,
  rangeStart: number,
  rangeEnd: number,
  text: string,
): { start: number; end: number } | null {
  const content = text.substring(rangeStart, rangeEnd);
  const trimmedContent = content.trim();
  if (trimmedContent.length === 0) {
    // If only whitespace, use the original range
    if (
      startIndex >= rangeStart &&
      endIndex <= rangeEnd &&
      !(startIndex === rangeStart && endIndex === rangeEnd)
    ) {
      return { start: rangeStart, end: rangeEnd };
    }
    return null;
  }
  const leadingWhitespace = content.length - content.trimStart().length;
  const trailingWhitespace = content.length - content.trimEnd().length;
  const trimmedStart = rangeStart + leadingWhitespace;
  const trimmedEnd = rangeEnd - trailingWhitespace;
  if (
    startIndex >= trimmedStart &&
    endIndex <= trimmedEnd &&
    !(startIndex === trimmedStart && endIndex === trimmedEnd)
  ) {
    return { start: trimmedStart, end: trimmedEnd };
  }
  return null;
}
