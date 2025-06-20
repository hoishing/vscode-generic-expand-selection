import { SelectionCandidate } from '../types';
import { isValidExpansion } from './util';

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
    { open: '<', close: '>' },
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
        const candidate: SelectionCandidate = {
          start,
          end: i + 1,
          contentStart: start + 1,
          contentEnd: i,
          size: i + 1 - start,
        };

        // Check if this candidate contains the current selection
        if (
          isValidExpansion(startIndex, endIndex, candidate.start, candidate.end)
        ) {
          // Keep track of the smallest containing candidate
          if (candidate.size < smallestSize) {
            smallestSize = candidate.size;
            nearestCandidate = candidate;
          }
        }
      }
    }
  }

  return nearestCandidate;
}
