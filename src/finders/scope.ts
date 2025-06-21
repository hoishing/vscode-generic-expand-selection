import { SelectionCandidate } from '../types';
import { getCandidate } from './util';

function getScopeCandidate(
  start: number,
  end: number,
  startIndex: number,
  endIndex: number,
  text: string,
): SelectionCandidate | null {
  // Try content inside scope
  const inner = getCandidate(startIndex, endIndex, start + 1, end, text);
  if (inner) {
    return inner;
  }
  // Try scope including delimiters
  return getCandidate(startIndex, endIndex, start, end + 1, text);
}

/**
 * Finds all balanced scopes ([], {}, (), <>) and returns the nearest containing candidate
 */
export function findNearestScope(
  text: string,
  startIndex: number,
  endIndex: number,
): SelectionCandidate | null {
  const scopePairs = [
    { open: '[', close: ']' },
    { open: '{', close: '}' },
    { open: '(', close: ')' },
  ];

  let nearestCandidate: SelectionCandidate | null = null;
  let smallestSize = Infinity;

  for (const { open, close } of scopePairs) {
    const stack: number[] = [];

    for (let i = 0; i < text.length; i++) {
      if (text[i] === open) {
        stack.push(i);
      } else if (text[i] === close && stack.length > 0) {
        const start = stack.pop()!;
        const candidate = getScopeCandidate(
          start,
          i,
          startIndex,
          endIndex,
          text,
        );
        if (candidate) {
          const size = candidate.end - candidate.start;
          if (size < smallestSize) {
            smallestSize = size;
            nearestCandidate = candidate;
          }
        }
      }
    }
  }

  return nearestCandidate;
}
