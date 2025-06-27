import * as vscode from 'vscode';
import { SelectionCandidate } from '../types';
import { getCandidate } from './util';
import { logger } from '../logger';

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

  // Get user-configured patterns or use defaults
  const config = vscode.workspace.getConfiguration('genericExpandSelection');
  const userPatterns: string[] = config.get('token.patterns', [
    '[a-zA-Z0-9_-]+',
    '[a-zA-Z0-9_\\-.]+',
    '[a-zA-Z0-9_\\-.#$@%]+',
    '[^\\s[\\]{}()"\'`]+',
  ]);

  // Convert string patterns to RegExp objects
  const patterns: RegExp[] = [];
  for (const patternStr of userPatterns) {
    try {
      patterns.push(new RegExp(patternStr));
    } catch {
      logger.error(`Invalid regex pattern in token.patterns: ${patternStr}`);
    }
  }

  // If no valid patterns, use fallback
  if (patterns.length === 0) {
    patterns.push(/[^\s[\]{}()"'`]+/);
  }

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
