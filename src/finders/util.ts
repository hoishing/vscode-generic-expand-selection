export function isValidExpansion(
  startIndex: number,
  endIndex: number,
  rangeStart: number,
  rangeEnd: number,
): boolean {
  return (
    startIndex >= rangeStart &&
    endIndex <= rangeEnd &&
    !(startIndex === rangeStart && endIndex === rangeEnd)
  );
}
