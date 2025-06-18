import * as vscode from 'vscode';
import {
  findNearestQuotePair,
  findNearestScope,
  findLineExpansion,
  findToken,
} from './finders';
import { SelectionCandidate } from './types';

export class SelectionProvider {
  private selectionHistory: vscode.Selection[] = [];

  expandSelection(editor: vscode.TextEditor) {
    const document = editor.document;
    const selection = editor.selection;

    const text = document.getText();
    const startOffset = document.offsetAt(selection.start);
    const endOffset = document.offsetAt(selection.end);

    // Try scoped expansion
    const newRange = this.findNextExpansion(
      text,
      startOffset,
      endOffset,
      document,
    );
    if (newRange) {
      // Store current selection for retract functionality before changing
      this.selectionHistory.push(selection);
      if (this.selectionHistory.length > 100) {
        this.selectionHistory.shift();
      }
      const newStart = document.positionAt(newRange.start);
      const newEnd = document.positionAt(newRange.end);
      editor.selection = new vscode.Selection(newStart, newEnd);
    }
  }

  shrinkSelection(editor: vscode.TextEditor) {
    if (this.selectionHistory.length > 0) {
      // Restore previous selection from history
      const previousSelection = this.selectionHistory.pop()!;
      editor.selection = previousSelection;
    }
  }

  private findNextExpansion(
    text: string,
    startIndex: number,
    endIndex: number,
    document: vscode.TextDocument,
  ): { start: number; end: number } | null {
    // Find all possible scope expansions and collect candidates
    const candidates = [
      findToken(text, startIndex, endIndex, document),
      findNearestQuotePair(text, startIndex, endIndex),
      findNearestScope(text, startIndex, endIndex),
      findLineExpansion(text, startIndex, endIndex, document),
    ].filter((c) => !!c);

    // Add all non-null candidates
    candidates
      .filter(
        (candidate): candidate is SelectionCandidate => candidate !== null,
      )
      .forEach((candidate) => candidates.push(candidate));

    // Filter and sort candidates
    const validCandidates = candidates
      .filter(
        (c) =>
          startIndex >= c.start &&
          endIndex <= c.end &&
          !(startIndex === c.start && endIndex === c.end),
      )
      .sort((a, b) => a.size - b.size);

    // Find best expansion
    for (const candidate of validCandidates) {
      // Get trimmed content range
      const trimmedRange = this.getTrimmedRange(
        text,
        candidate.contentStart,
        candidate.contentEnd,
      );

      if (startIndex === trimmedRange.start && endIndex === trimmedRange.end) {
        return { start: candidate.start, end: candidate.end };
      }

      if (
        startIndex >= candidate.contentStart &&
        endIndex <= candidate.contentEnd
      ) {
        if (
          startIndex === candidate.contentStart &&
          endIndex === candidate.contentEnd
        ) {
          continue;
        }
        return trimmedRange;
      }
    }

    return null;
  }

  private getTrimmedRange(
    text: string,
    start: number,
    end: number,
  ): { start: number; end: number } {
    const content = text.substring(start, end);
    const trimmedContent = content.trim();

    if (trimmedContent.length === 0) {
      return { start, end };
    }

    const leadingWhitespace = content.length - content.trimStart().length;
    const trailingWhitespace = content.length - content.trimEnd().length;

    return {
      start: start + leadingWhitespace,
      end: end - trailingWhitespace,
    };
  }
}
