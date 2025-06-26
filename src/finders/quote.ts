import { SelectionCandidate } from '../types';
import { getCandidate } from './util';

export function findNearestQuotePair(
  text: string,
  startIndex: number,
  endIndex: number,
): SelectionCandidate | null {
  const selectionText = text.substring(startIndex, endIndex);
  if (!selectionText.includes('\n')) {
    const beforeSelection = text.substring(0, startIndex);
    const afterSelection = text.substring(endIndex);

    const lineStart = beforeSelection.lastIndexOf('\n') + 1;
    const nextNewline = afterSelection.indexOf('\n');
    const lineEnd = nextNewline === -1 ? text.length : endIndex + nextNewline;

    const lineContent = text.substring(lineStart, lineEnd);
    const selectionInLine = startIndex - lineStart;
    const selectionEndInLine = endIndex - lineStart;

    const singleLineResult = findQuotePairsInText(
      lineContent,
      selectionInLine,
      selectionEndInLine,
      lineStart,
    );

    if (singleLineResult) {
      return singleLineResult;
    }
  }

  return findQuotePairsInText(text, startIndex, endIndex, 0);
}

function findQuotePairsInText(
  text: string,
  startIndex: number,
  endIndex: number,
  offset: number = 0,
): SelectionCandidate | null {
  const quotes = ['"', "'", '`'];
  let nearestCandidate: SelectionCandidate | null = null;
  let smallestSize = Infinity;

  for (const quote of quotes) {
    for (let i = 0; i < text.length; i++) {
      if (text[i] === quote) {
        let j = i + 1;
        let escaped = false;

        while (j < text.length) {
          if (text[j] === '\\' && !escaped) {
            escaped = true;
          } else if (text[j] === quote && !escaped) {
            if (offset === 0 && !isValidQuotePair(text, i, j + 1)) {
              i = j;
              break;
            }

            const innerCandidate = getCandidate(
              startIndex,
              endIndex,
              i + 1,
              j,
              text,
            );
            let candidate = innerCandidate;
            if (!candidate) {
              candidate = getCandidate(startIndex, endIndex, i, j + 1, text);
            }
            if (candidate) {
              candidate = {
                start: candidate.start + offset,
                end: candidate.end + offset,
              };
              const size = candidate.end - candidate.start;
              if (size < smallestSize) {
                smallestSize = size;
                nearestCandidate = candidate;
              }
            }

            i = j;
            break;
          } else {
            escaped = false;
          }
          j++;
        }
      }
    }
  }

  return nearestCandidate;
}

function isValidQuotePair(
  text: string,
  startPos: number,
  endPos: number,
): boolean {
  const startQuote = text[startPos];
  const endQuote = text[endPos - 1];

  if (startQuote !== endQuote) {
    return false;
  }

  const content = text.substring(startPos + 1, endPos - 1);
  let unescapedQuoteCount = 0;
  let escaped = false;

  for (let i = 0; i < content.length; i++) {
    if (content[i] === '\\' && !escaped) {
      escaped = true;
    } else if (content[i] === startQuote && !escaped) {
      unescapedQuoteCount++;
    } else {
      escaped = false;
    }
  }

  if (unescapedQuoteCount > 0) {
    return false;
  }

  const beforeQuote = text.substring(Math.max(0, startPos - 20), startPos);
  const afterQuote = text.substring(endPos, Math.min(text.length, endPos + 20));

  if (beforeQuote.includes('//') || beforeQuote.includes('/*')) {
    const commentStart = Math.max(
      beforeQuote.lastIndexOf('//'),
      beforeQuote.lastIndexOf('/*'),
    );
    const lineBreak = beforeQuote.lastIndexOf('\n');
    if (commentStart > lineBreak) {
      return false;
    }
  }

  if (beforeQuote.includes('```') || afterQuote.includes('```')) {
    return false;
  }

  if (content.length < 50) {
    return true;
  }

  const codePatterns = [/[=:]\s*$/, /\(\s*$/, /,\s*$/, /\[\s*$/, /return\s*$/];

  const hasCodeContext = codePatterns.some((pattern) =>
    pattern.test(beforeQuote),
  );

  if (
    !hasCodeContext &&
    (content.includes('"') || content.includes("'") || content.includes('`'))
  ) {
    const differentQuoteTypes = ['"', "'", '`'].filter(
      (q) => q !== startQuote && content.includes(q),
    );
    if (differentQuoteTypes.length > 1) {
      return false;
    }
  }

  return true;
}
