import * as vscode from 'vscode';
import { SelectionCandidate } from '../core';
import { getCandidate } from './util';

/**
 * Finds line expansion candidate that spans from start of line containing startIndex
 * to end of line containing endIndex, with trimmed content
 */
export function findLineExpansion(
  text: string,
  startIndex: number,
  endIndex: number,
  document?: vscode.TextDocument,
): SelectionCandidate | null {
  if (!document) {
    return null;
  }
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

  // Get the full candidate first
  const fullCandidate = getCandidate(
    startIndex,
    endIndex,
    startLineStart,
    endLineEnd,
    text,
  );
  if (!fullCandidate) {
    return null;
  }

  // Check for trailing semicolon or comma in the trimmed candidate
  const lastChar = text[fullCandidate.end - 1];
  const startLine = document.positionAt(fullCandidate.start).line;
  const endLine = document.positionAt(fullCandidate.end).line;

  if (
    (lastChar === ';' || lastChar === ',') &&
    fullCandidate.end > endIndex &&
    startLine === endLine
  ) {
    const candidate = getCandidate(
      startIndex,
      endIndex,
      fullCandidate.start,
      fullCandidate.end - 1,
      text,
    );
    if (candidate) {
      return candidate;
    }
  }

  return fullCandidate;
}
