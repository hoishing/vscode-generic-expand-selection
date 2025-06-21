import { SelectionCandidate } from '../types';
import { getCandidate } from './util';

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
            // Try content inside quotes first
            const innerCandidate = getCandidate(
              startIndex,
              endIndex,
              i + 1,
              j,
              text,
            );
            let candidate = innerCandidate;
            if (!candidate) {
              // Fallback to full quote including delimiters
              candidate = getCandidate(startIndex, endIndex, i, j + 1, text);
            }
            if (candidate) {
              const size = candidate.end - candidate.start;
              if (size < smallestSize) {
                smallestSize = size;
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
