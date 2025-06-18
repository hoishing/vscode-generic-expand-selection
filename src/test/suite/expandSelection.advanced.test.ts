import * as assert from 'assert';
import * as vscode from 'vscode';
import { SelectionProvider } from '../../expandSelection';

// Mock editor for testing
class MockEditor implements Partial<vscode.TextEditor> {
  public selection: vscode.Selection;

  constructor(
    public document: vscode.TextDocument,
    selection: vscode.Selection,
  ) {
    this.selection = selection;
  }
}

// Enhanced mock document for testing
class MockDocument implements Partial<vscode.TextDocument> {
  constructor(private text: string) {}

  getText(): string {
    return this.text;
  }

  offsetAt(position: vscode.Position): number {
    const lines = this.text.split('\n');
    let offset = 0;
    for (let i = 0; i < position.line; i++) {
      offset += lines[i].length + 1; // +1 for newline
    }
    return offset + position.character;
  }

  positionAt(offset: number): vscode.Position {
    const lines = this.text.split('\n');
    let currentOffset = 0;
    for (let line = 0; line < lines.length; line++) {
      if (currentOffset + lines[line].length >= offset) {
        return new vscode.Position(line, offset - currentOffset);
      }
      currentOffset += lines[line].length + 1; // +1 for newline
    }
    return new vscode.Position(
      lines.length - 1,
      lines[lines.length - 1].length,
    );
  }

  getWordRangeAtPosition(
    position: vscode.Position,
    regex?: RegExp,
  ): vscode.Range | undefined {
    const offset = this.offsetAt(position);
    const char = this.text[offset];

    if (!char) {
      return undefined;
    }

    // Use provided regex or default patterns
    const patterns = regex ? [regex] : [/[a-zA-Z0-9_]+/, /[a-zA-Z0-9_\.\-]+/];

    for (const pattern of patterns) {
      if (pattern.test(char)) {
        let wordStart = offset;
        let wordEnd = offset;

        // Expand backwards to find word start
        while (wordStart > 0 && pattern.test(this.text[wordStart - 1])) {
          wordStart--;
        }

        // Expand forwards to find word end
        while (wordEnd < this.text.length && pattern.test(this.text[wordEnd])) {
          wordEnd++;
        }

        return new vscode.Range(
          this.positionAt(wordStart),
          this.positionAt(wordEnd),
        );
      }
    }

    return undefined;
  }

  lineAt(lineOrPosition: number | vscode.Position): vscode.TextLine {
    const lineNumber =
      typeof lineOrPosition === 'number' ? lineOrPosition : lineOrPosition.line;
    const lines = this.text.split('\n');
    const lineText = lines[lineNumber] || '';
    return {
      text: lineText,
      lineNumber: lineNumber,
      range: new vscode.Range(
        new vscode.Position(lineNumber, 0),
        new vscode.Position(lineNumber, lineText.length),
      ),
      rangeIncludingLineBreak: new vscode.Range(
        new vscode.Position(lineNumber, 0),
        new vscode.Position(lineNumber + 1, 0),
      ),
      firstNonWhitespaceCharacterIndex: lineText.search(/\S/),
      isEmptyOrWhitespace: lineText.trim().length === 0,
    } as vscode.TextLine;
  }
}

suite('ExpandSelection Advanced Tests', () => {
  suite('Selection History and Shrinking', () => {
    test('stores selection history during expansion', () => {
      const provider = new SelectionProvider();
      const text = 'const obj = { key: "value" }';
      const mockDoc = new MockDocument(text) as unknown as vscode.TextDocument;

      // Start with "value" selection
      const valueStart = text.indexOf('value');
      const valueEnd = valueStart + 5;
      const initialSelection = new vscode.Selection(
        mockDoc.positionAt(valueStart),
        mockDoc.positionAt(valueEnd),
      );

      const mockEditor = new MockEditor(
        mockDoc,
        initialSelection,
      ) as unknown as vscode.TextEditor;

      // Expand selection - should store history
      provider.expandSelection(mockEditor);

      // Selection should have changed
      assert.notStrictEqual(mockEditor.selection.start, initialSelection.start);
      assert.notStrictEqual(mockEditor.selection.end, initialSelection.end);
    });

    test('shrinks selection using history', () => {
      const provider = new SelectionProvider();
      const text = 'const obj = { key: "value" }';
      const mockDoc = new MockDocument(text) as unknown as vscode.TextDocument;

      // Start with "value" selection
      const valueStart = text.indexOf('value');
      const valueEnd = valueStart + 5;
      const initialSelection = new vscode.Selection(
        mockDoc.positionAt(valueStart),
        mockDoc.positionAt(valueEnd),
      );

      const mockEditor = new MockEditor(
        mockDoc,
        initialSelection,
      ) as unknown as vscode.TextEditor;

      // Expand once
      provider.expandSelection(mockEditor);
      const expandedSelection = mockEditor.selection;

      // Shrink should restore previous selection
      provider.shrinkSelection(mockEditor);

      assert.strictEqual(
        mockEditor.selection.start.line,
        initialSelection.start.line,
      );
      assert.strictEqual(
        mockEditor.selection.start.character,
        initialSelection.start.character,
      );
      assert.strictEqual(
        mockEditor.selection.end.line,
        initialSelection.end.line,
      );
      assert.strictEqual(
        mockEditor.selection.end.character,
        initialSelection.end.character,
      );
    });

    test('handles multiple expansions and shrinks', () => {
      const provider = new SelectionProvider();
      const text = 'function test() { const obj = { key: "value" }; }';
      const mockDoc = new MockDocument(text) as unknown as vscode.TextDocument;

      const valueStart = text.indexOf('value');
      const valueEnd = valueStart + 5;
      const initialSelection = new vscode.Selection(
        mockDoc.positionAt(valueStart),
        mockDoc.positionAt(valueEnd),
      );

      const mockEditor = new MockEditor(
        mockDoc,
        initialSelection,
      ) as unknown as vscode.TextEditor;

      // Store initial for comparison
      const step0 = mockEditor.selection;

      // Expand multiple times
      provider.expandSelection(mockEditor);
      const step1 = mockEditor.selection;

      provider.expandSelection(mockEditor);
      const step2 = mockEditor.selection;

      provider.expandSelection(mockEditor);
      const step3 = mockEditor.selection;

      // Shrink back step by step
      provider.shrinkSelection(mockEditor);
      assert.deepStrictEqual(mockEditor.selection, step2);

      provider.shrinkSelection(mockEditor);
      assert.deepStrictEqual(mockEditor.selection, step1);

      provider.shrinkSelection(mockEditor);
      assert.deepStrictEqual(mockEditor.selection, step0);
    });

    test('limits selection history size', () => {
      const provider = new SelectionProvider();
      const text = 'a'.repeat(1000); // Long text
      const mockDoc = new MockDocument(text) as unknown as vscode.TextDocument;

      let currentSelection = new vscode.Selection(
        new vscode.Position(0, 0),
        new vscode.Position(0, 1),
      );

      const mockEditor = new MockEditor(
        mockDoc,
        currentSelection,
      ) as unknown as vscode.TextEditor;

      // Perform 150 expansions (more than the 100 limit)
      for (let i = 0; i < 150; i++) {
        if (i < text.length - 2) {
          mockEditor.selection = new vscode.Selection(
            new vscode.Position(0, 0),
            new vscode.Position(0, i + 1),
          );
          provider.expandSelection(mockEditor);
        }
      }

      // Should only be able to shrink a limited number of times
      let shrinkCount = 0;
      const initialSelection = mockEditor.selection;

      while (shrinkCount < 150) {
        const beforeShrink = mockEditor.selection;
        provider.shrinkSelection(mockEditor);

        // If selection didn't change, we've hit the history limit
        if (mockEditor.selection === beforeShrink) {
          break;
        }
        shrinkCount++;
      }

      // Should not exceed history limit
      assert.ok(shrinkCount <= 100);
    });

    test('shrink with empty history does nothing', () => {
      const provider = new SelectionProvider();
      const text = 'const value = 123';
      const mockDoc = new MockDocument(text) as unknown as vscode.TextDocument;

      const initialSelection = new vscode.Selection(
        new vscode.Position(0, 6),
        new vscode.Position(0, 11),
      );

      const mockEditor = new MockEditor(
        mockDoc,
        initialSelection,
      ) as unknown as vscode.TextEditor;

      // Shrink without any prior expansions
      provider.shrinkSelection(mockEditor);

      // Selection should remain unchanged
      assert.deepStrictEqual(mockEditor.selection, initialSelection);
    });
  });

  suite('Complex Selection Scenarios', () => {
    test('handles deeply nested structures', () => {
      const provider = new SelectionProvider();
      const text =
        'const config = { api: { endpoints: { users: "/api/users/{id}" } } }';
      const mockDoc = new MockDocument(text) as unknown as vscode.TextDocument;

      // Start from "id" inside the deeply nested string
      const idStart = text.indexOf('id');
      const idEnd = idStart + 2;
      const initialSelection = new vscode.Selection(
        mockDoc.positionAt(idStart),
        mockDoc.positionAt(idEnd),
      );

      const mockEditor = new MockEditor(
        mockDoc,
        initialSelection,
      ) as unknown as vscode.TextEditor;

      // Should be able to expand through multiple levels
      provider.expandSelection(mockEditor);
      let selectedText = text.substring(
        mockDoc.offsetAt(mockEditor.selection.start),
        mockDoc.offsetAt(mockEditor.selection.end),
      );

      // Should have expanded to at least the string content
      assert.ok(selectedText.length > 2);
      assert.ok(selectedText.includes('id'));
    });

    test('handles mixed quote types', () => {
      const provider = new SelectionProvider();
      const text = `const template = \`Hello "\${name}" and '\${greeting}'\``;
      const mockDoc = new MockDocument(text) as unknown as vscode.TextDocument;

      // Start from "name" inside template literal
      const nameStart = text.indexOf('name');
      const nameEnd = nameStart + 4;
      const initialSelection = new vscode.Selection(
        mockDoc.positionAt(nameStart),
        mockDoc.positionAt(nameEnd),
      );

      const mockEditor = new MockEditor(
        mockDoc,
        initialSelection,
      ) as unknown as vscode.TextEditor;

      provider.expandSelection(mockEditor);
      const selectedText = text.substring(
        mockDoc.offsetAt(mockEditor.selection.start),
        mockDoc.offsetAt(mockEditor.selection.end),
      );

      // Should handle the mixed quotes correctly
      assert.ok(selectedText.includes('name'));
      assert.ok(selectedText.length > 4);
    });

    test('prioritizes smaller expansions', () => {
      const provider = new SelectionProvider();
      const text = 'function(array[index])';
      const mockDoc = new MockDocument(text) as unknown as vscode.TextDocument;

      // Start from "index"
      const indexStart = text.indexOf('index');
      const indexEnd = indexStart + 5;
      const initialSelection = new vscode.Selection(
        mockDoc.positionAt(indexStart),
        mockDoc.positionAt(indexEnd),
      );

      const mockEditor = new MockEditor(
        mockDoc,
        initialSelection,
      ) as unknown as vscode.TextEditor;

      provider.expandSelection(mockEditor);
      const selectedText = text.substring(
        mockDoc.offsetAt(mockEditor.selection.start),
        mockDoc.offsetAt(mockEditor.selection.end),
      );

      // Should select the brackets first (smaller expansion)
      assert.strictEqual(selectedText, '[index]');
    });

    test('handles code with comments', () => {
      const provider = new SelectionProvider();
      const text = `function test() {
  // This is a comment
  const value = "string"; // End comment
  return value;
}`;
      const mockDoc = new MockDocument(text) as unknown as vscode.TextDocument;

      // Start from "string" in the quoted text
      const stringStart = text.indexOf('string');
      const stringEnd = stringStart + 6;
      const initialSelection = new vscode.Selection(
        mockDoc.positionAt(stringStart),
        mockDoc.positionAt(stringEnd),
      );

      const mockEditor = new MockEditor(
        mockDoc,
        initialSelection,
      ) as unknown as vscode.TextEditor;

      provider.expandSelection(mockEditor);
      const selectedText = text.substring(
        mockDoc.offsetAt(mockEditor.selection.start),
        mockDoc.offsetAt(mockEditor.selection.end),
      );

      // Should expand to the quoted string, ignoring comments
      assert.strictEqual(selectedText, '"string"');
    });

    test('handles empty selections', () => {
      const provider = new SelectionProvider();
      const text = 'const obj = { key: value }';
      const mockDoc = new MockDocument(text) as unknown as vscode.TextDocument;

      // Empty selection (cursor position) at "value"
      const valueStart = text.indexOf('value');
      const emptySelection = new vscode.Selection(
        mockDoc.positionAt(valueStart),
        mockDoc.positionAt(valueStart),
      );

      const mockEditor = new MockEditor(
        mockDoc,
        emptySelection,
      ) as unknown as vscode.TextEditor;

      provider.expandSelection(mockEditor);
      const selectedText = text.substring(
        mockDoc.offsetAt(mockEditor.selection.start),
        mockDoc.offsetAt(mockEditor.selection.end),
      );

      // Should expand to select the word
      assert.strictEqual(selectedText, 'value');
    });
  });

  suite('Edge Cases and Error Handling', () => {
    test('handles very long lines', () => {
      const provider = new SelectionProvider();
      const longString = 'x'.repeat(10000);
      const text = `const long = "${longString}"`;
      const mockDoc = new MockDocument(text) as unknown as vscode.TextDocument;

      // Start from middle of long string
      const middlePos = text.indexOf(longString) + longString.length / 2;
      const selection = new vscode.Selection(
        mockDoc.positionAt(middlePos),
        mockDoc.positionAt(middlePos + 1),
      );

      const mockEditor = new MockEditor(
        mockDoc,
        selection,
      ) as unknown as vscode.TextEditor;

      provider.expandSelection(mockEditor);
      const selectedText = text.substring(
        mockDoc.offsetAt(mockEditor.selection.start),
        mockDoc.offsetAt(mockEditor.selection.end),
      );

      // Should handle long text efficiently
      assert.ok(selectedText.length > 1);
    });

    test('handles malformed syntax gracefully', () => {
      const provider = new SelectionProvider();
      const text = 'const broken = { key: "unclosed string'; // Missing closing quote and brace
      const mockDoc = new MockDocument(text) as unknown as vscode.TextDocument;

      const keyStart = text.indexOf('key');
      const selection = new vscode.Selection(
        mockDoc.positionAt(keyStart),
        mockDoc.positionAt(keyStart + 3),
      );

      const mockEditor = new MockEditor(
        mockDoc,
        selection,
      ) as unknown as vscode.TextEditor;

      // Should not throw error even with malformed syntax
      assert.doesNotThrow(() => {
        provider.expandSelection(mockEditor);
      });
    });

    test('handles selections at document boundaries', () => {
      const provider = new SelectionProvider();
      const text = 'start';
      const mockDoc = new MockDocument(text) as unknown as vscode.TextDocument;

      // Selection at very end of document
      const endSelection = new vscode.Selection(
        mockDoc.positionAt(text.length - 1),
        mockDoc.positionAt(text.length),
      );

      const mockEditor = new MockEditor(
        mockDoc,
        endSelection,
      ) as unknown as vscode.TextEditor;

      provider.expandSelection(mockEditor);
      const selectedText = text.substring(
        mockDoc.offsetAt(mockEditor.selection.start),
        mockDoc.offsetAt(mockEditor.selection.end),
      );

      // Should expand to full word
      assert.strictEqual(selectedText, 'start');
    });

    test('handles unicode characters', () => {
      const provider = new SelectionProvider();
      const text = 'const emoji = "🚀 Hello 世界"';
      const mockDoc = new MockDocument(text) as unknown as vscode.TextDocument;

      // Start from the middle of the unicode string
      const helloStart = text.indexOf('Hello');
      const selection = new vscode.Selection(
        mockDoc.positionAt(helloStart),
        mockDoc.positionAt(helloStart + 5),
      );

      const mockEditor = new MockEditor(
        mockDoc,
        selection,
      ) as unknown as vscode.TextEditor;

      provider.expandSelection(mockEditor);
      const selectedText = text.substring(
        mockDoc.offsetAt(mockEditor.selection.start),
        mockDoc.offsetAt(mockEditor.selection.end),
      );

      // Should handle unicode properly
      assert.ok(selectedText.includes('🚀'));
      assert.ok(selectedText.includes('世界'));
    });

    test('no expansion when no candidates found', () => {
      const provider = new SelectionProvider();
      const text = 'plain text without special characters';
      const mockDoc = new MockDocument(text) as unknown as vscode.TextDocument;

      // Select the entire text
      const fullSelection = new vscode.Selection(
        new vscode.Position(0, 0),
        mockDoc.positionAt(text.length),
      );

      const mockEditor = new MockEditor(
        mockDoc,
        fullSelection,
      ) as unknown as vscode.TextEditor;

      const originalSelection = mockEditor.selection;
      provider.expandSelection(mockEditor);

      // Selection should remain unchanged when no expansion is possible
      assert.deepStrictEqual(mockEditor.selection, originalSelection);
    });
  });

  suite('Integration with Different Finders', () => {
    test('token finder integration', () => {
      const provider = new SelectionProvider();
      const text = 'const CONSTANT_VALUE = 123';
      const mockDoc = new MockDocument(text) as unknown as vscode.TextDocument;

      // Start with part of the constant
      const constantStart = text.indexOf('CONSTANT');
      const selection = new vscode.Selection(
        mockDoc.positionAt(constantStart),
        mockDoc.positionAt(constantStart + 8), // "CONSTANT"
      );

      const mockEditor = new MockEditor(
        mockDoc,
        selection,
      ) as unknown as vscode.TextEditor;

      provider.expandSelection(mockEditor);
      const selectedText = text.substring(
        mockDoc.offsetAt(mockEditor.selection.start),
        mockDoc.offsetAt(mockEditor.selection.end),
      );

      // Should expand to full token including underscores
      assert.strictEqual(selectedText, 'CONSTANT_VALUE');
    });

    test('multiple finder types work together', () => {
      const provider = new SelectionProvider();
      const text = 'array[obj.method("param")]';
      const mockDoc = new MockDocument(text) as unknown as vscode.TextDocument;

      // Start from "param"
      const paramStart = text.indexOf('param');
      const selection = new vscode.Selection(
        mockDoc.positionAt(paramStart),
        mockDoc.positionAt(paramStart + 5),
      );

      const mockEditor = new MockEditor(
        mockDoc,
        selection,
      ) as unknown as vscode.TextEditor;

      // First expansion should be quotes
      provider.expandSelection(mockEditor);
      let selectedText = text.substring(
        mockDoc.offsetAt(mockEditor.selection.start),
        mockDoc.offsetAt(mockEditor.selection.end),
      );
      assert.strictEqual(selectedText, '"param"');

      // Next expansion should be parentheses
      provider.expandSelection(mockEditor);
      selectedText = text.substring(
        mockDoc.offsetAt(mockEditor.selection.start),
        mockDoc.offsetAt(mockEditor.selection.end),
      );
      assert.strictEqual(selectedText, '("param")');
    });
  });
});
