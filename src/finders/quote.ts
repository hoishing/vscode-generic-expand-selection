import { SelectionCandidate } from '../types';

/**
 * Finds all quote pairs (", ', `) and returns the nearest containing candidate
 */
export function findNearestQuotePair(
  text: string,
  startIndex: number,
  endIndex: number,
): SelectionCandidate | null {
  const quotes = ['"', "'", '`'];
  let nearestCandidate: SelectionCandidate | null = null;
  let smallestSize = Infinity;

  for (const quote of quotes) {
    for (let i = 0; i < text.length; i++) {
      if (text[i] === quote) {
        // Look for closing quote
        let j = i + 1;
        let escaped = false;

        while (j < text.length) {
          if (text[j] === '\\' && !escaped) {
            escaped = true;
          } else if (text[j] === quote && !escaped) {
            const candidate: SelectionCandidate = {
              start: i,
              end: j + 1,
              contentStart: i + 1,
              contentEnd: j,
              size: j + 1 - i,
            };

            // Check if this candidate contains the current selection
            if (
              startIndex >= candidate.start &&
              endIndex <= candidate.end &&
              !(startIndex === candidate.start && endIndex === candidate.end)
            ) {
              // Keep track of the smallest containing candidate
              if (candidate.size < smallestSize) {
                smallestSize = candidate.size;
                nearestCandidate = candidate;
              }
            }

            i = j; // Skip to after this quote pair
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
