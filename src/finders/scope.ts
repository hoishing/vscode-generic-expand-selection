import * as vscode from 'vscode';
import { SelectionCandidate } from '../core';
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
 * Finds all balanced scopes and returns the nearest containing candidate
 */
export function findNearestScope(
  text: string,
  startIndex: number,
  endIndex: number,
  // eslint-disable-next-line no-unused-vars
  _document?: vscode.TextDocument,
): SelectionCandidate | null {
  // Define scope mappings directly
  const openChars = new Map<string, string>([
    ['[', ']'],
    ['{', '}'],
    ['(', ')'],
  ]);

  const closeChars = new Set(openChars.values());

  // Separate stacks for each scope type
  const stacks = new Map<string, number[]>(); // close_char -> stack of indices
  for (const closeChar of closeChars) {
    stacks.set(closeChar, []);
  }

  let nearestCandidate: SelectionCandidate | null = null;
  let smallestSize = Infinity;

  // Single pass through the text
  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (openChars.has(char)) {
      const closeChar = openChars.get(char)!;
      stacks.get(closeChar)!.push(i);
    } else if (closeChars.has(char)) {
      const stack = stacks.get(char)!;
      if (stack.length > 0) {
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
