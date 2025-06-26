import * as vscode from 'vscode';
import {
  findNearestQuotePair,
  findNearestScope,
  findLineExpansion,
  findToken,
} from './finders';

const outputChannel = vscode.window.createOutputChannel(
  'Generic Expand Selection',
);

export class SelectionProvider {
  private selectionHistories: vscode.Selection[][] = [];

  expandSelection(editor: vscode.TextEditor) {
    const document = editor.document;
    const selections = editor.selections || [editor.selection];
    const text = document.getText();

    const newSelections: vscode.Selection[] = [];

    for (let i = 0; i < selections.length; i++) {
      const selection = selections[i];
      const startOffset = document.offsetAt(selection.start);
      const endOffset = document.offsetAt(selection.end);

      const newRange = this.findNextExpansion(
        text,
        startOffset,
        endOffset,
        document,
      );

      if (newRange) {
        if (!this.selectionHistories[i]) {
          this.selectionHistories[i] = [];
        }
        this.selectionHistories[i].push(selection);
        if (this.selectionHistories[i].length > 100) {
          this.selectionHistories[i].shift();
        }
        const newStart = document.positionAt(newRange.start);
        const newEnd = document.positionAt(newRange.end);
        newSelections.push(new vscode.Selection(newStart, newEnd));
      } else {
        newSelections.push(selection);
      }
    }

    if (editor.selections) {
      editor.selections = newSelections;
    } else {
      editor.selection = newSelections[0];
    }
  }

  shrinkSelection(editor: vscode.TextEditor) {
    const selections = editor.selections || [editor.selection];
    const newSelections: vscode.Selection[] = [];

    for (let i = 0; i < selections.length; i++) {
      if (this.selectionHistories[i] && this.selectionHistories[i].length > 0) {
        const previousSelection = this.selectionHistories[i].pop()!;
        newSelections.push(previousSelection);
      } else {
        newSelections.push(selections[i]);
      }
    }

    if (editor.selections) {
      editor.selections = newSelections;
    } else {
      editor.selection = newSelections[0];
    }
  }

  private findNextExpansion(
    text: string,
    startIndex: number,
    endIndex: number,
    document: vscode.TextDocument,
  ): { start: number; end: number } | null {
    // Get all valid candidates from finders as a map
    const candidateMap: Record<string, { start: number; end: number } | null> =
      {
        token: findToken(text, startIndex, endIndex, document),
        quote: findNearestQuotePair(text, startIndex, endIndex),
        scope: findNearestScope(text, startIndex, endIndex),
        line: findLineExpansion(text, startIndex, endIndex, document),
      };

    const selectionValue = text.substring(startIndex, endIndex);
    outputChannel.appendLine('[expandSelection] Current: ' + selectionValue);

    // Return the smallest valid expansion, with priority logic
    let best: { start: number; end: number } | null = null;
    let smallest = Infinity;

    // Priority: if scope or quote candidate exists and line candidate is not fully contained, ignore line candidate
    const line = candidateMap.line;
    const scope = candidateMap.scope;
    const quote = candidateMap.quote;
    if (line) {
      if (
        (scope && !(line.start >= scope.start && line.end <= scope.end)) ||
        (quote && !(line.start >= quote.start && line.end <= quote.end))
      ) {
        candidateMap.line = null;
      }
    }

    for (const [key, candidate] of Object.entries(candidateMap)) {
      if (!candidate) {
        continue;
      }
      outputChannel.appendLine(
        `[expandSelection] Candidate: ${key} - ${text.substring(
          candidate.start,
          candidate.end,
        )}`,
      );
      const size = candidate.end - candidate.start;
      if (size > 0 && (best === null || size < smallest)) {
        best = candidate;
        smallest = size;
      }
    }
    return best;
  }
}
