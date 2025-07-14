import * as vscode from 'vscode';
import { SelectionCandidate, ConfigService, getLogger } from '../core';
import { getCandidate } from './util';

/**
 * Finds word boundaries using different regex patterns for extended token detection
 */
export function findToken(
  text: string,
  startIndex: number,
  endIndex: number,
  document?: vscode.TextDocument,
): SelectionCandidate | null {
  if (!document) {
    return null;
  }
  // Skip if current selection already contains a space
  const currentSelection = text.substring(startIndex, endIndex);
  if (currentSelection.includes(' ')) {
    return null;
  }

  const currentPosition = document.positionAt(startIndex);

  // Get user-configured patterns using config service
  const userPatterns = ConfigService.getTokenPatterns(document);

  // Convert string patterns to RegExp objects
  const patterns: RegExp[] = [];
  const logger = getLogger();
  for (const patternStr of userPatterns) {
    try {
      patterns.push(new RegExp(patternStr));
    } catch {
      logger.error(`Invalid regex pattern in token.patterns: ${patternStr}`);
    }
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
