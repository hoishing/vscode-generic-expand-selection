import * as vscode from 'vscode';
import { SelectionCandidate } from '../types';
import { isValidExpansion } from './util';

/**
 * Finds line expansion candidate that spans from start of line containing startIndex
 * to end of line containing endIndex, with trimmed content
 */
export function findLineExpansion(
  text: string,
  startIndex: number,
  endIndex: number,
  document: vscode.TextDocument,
): SelectionCandidate | null {
  const startPos = document.positionAt(startIndex);
  const endPos = document.positionAt(endIndex);

  // Get the start of the line containing startIndex
  const startLineStart = document.offsetAt(
    new vscode.Position(startPos.line, 0),
  );

  // Get the end of the line containing endIndex
  const endLineEnd = document.offsetAt(
    new vscode.Position(endPos.line, document.lineAt(endPos.line).text.length),
  );

  // Extract the content from start of first line to end of last line
  const fullContent = text.substring(startLineStart, endLineEnd);

  // Trim the content to remove leading and trailing whitespace
  const trimmedContent = fullContent.trim();

  if (trimmedContent.length === 0) {
    return null;
  }

  // Calculate the actual start and end positions of the trimmed content
  const leadingWhitespace = fullContent.length - fullContent.trimStart().length;
  const trailingWhitespace = fullContent.length - fullContent.trimEnd().length;

  const trimmedStart = startLineStart + leadingWhitespace;
  const trimmedEnd = endLineEnd - trailingWhitespace;

  // Only return if it would expand the selection (not if selection already matches exactly)
  if (!isValidExpansion(startIndex, endIndex, trimmedStart, trimmedEnd)) {
    return null;
  }

  return {
    start: trimmedStart,
    end: trimmedEnd,
    contentStart: trimmedStart,
    contentEnd: trimmedEnd,
    size: trimmedEnd - trimmedStart,
  };
}
