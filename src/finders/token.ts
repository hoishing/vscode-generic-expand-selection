import * as vscode from 'vscode';
import { SelectionCandidate } from '../types';
import { getCandidate } from './util';

/**
 * Finds word boundaries using different regex patterns for extended token detection
 */
export function findToken(
  text: string,
  startIndex: number,
  endIndex: number,
  document: vscode.TextDocument,
): SelectionCandidate | null {
  // Skip if current selection already contains a space
  const currentSelection = text.substring(startIndex, endIndex);
  if (currentSelection.includes(' ')) {
    return null;
  }

  const currentPosition = document.positionAt(startIndex);

  // Define different word patterns to try
  const patterns = [
    /[A-Z]?[a-z]+/, // With single word characters
    /[a-zA-Z]+/, // With letters only
    /[a-zA-Z0-9]+/, // With digits
    /[a-zA-Z0-9_]+/, // With underscores
    /[a-zA-Z0-9_\-]+/, // With hyphens
    /[a-zA-Z0-9_\-\.]+/, // With dots
  ];

  for (const pattern of patterns) {
    const wordRange = document.getWordRangeAtPosition(currentPosition, pattern);
    if (wordRange) {
      const wordStart = document.offsetAt(wordRange.start);
      const wordEnd = document.offsetAt(wordRange.end);

      const candidate = getCandidate(
        startIndex,
        endIndex,
        wordStart,
        wordEnd,
        text,
      );
      if (candidate) {
        return candidate;
      }
    }
  }

  return null;
}
