import * as assert from 'assert';
import * as vscode from 'vscode';
import { SelectionProvider } from '../../expandSelection';

async function createTestDocument(
  content: string,
): Promise<vscode.TextDocument> {
  return await vscode.workspace.openTextDocument({
    content,
    language: 'typescript',
  });
}

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

suite('ExpandSelection Advanced Tests', () => {
  suite('Selection History and Shrinking', () => {
    test('stores selection history during expansion', async () => {
      const provider = new SelectionProvider();
      const text = 'const obj = { key: "value" }';
      const doc = await createTestDocument(text);

      // Start with "value" selection
      const valueStart = text.indexOf('value');
      const valueEnd = valueStart + 5;
      const initialSelection = new vscode.Selection(
        doc.positionAt(valueStart),
        doc.positionAt(valueEnd),
      );

      const mockEditor = new MockEditor(
        doc,
        initialSelection,
      ) as unknown as vscode.TextEditor;

      // Expand selection - should store history
      provider.expandSelection(mockEditor);

      // Selection should have changed
      assert.notStrictEqual(mockEditor.selection.start, initialSelection.start);
      assert.notStrictEqual(mockEditor.selection.end, initialSelection.end);
    });

    test('shrinks selection using history', async () => {
      const provider = new SelectionProvider();
      const text = 'const obj = { key: "value" }';
      const doc = await createTestDocument(text);

      // Start with "value" selection
      const valueStart = text.indexOf('value');
      const valueEnd = valueStart + 5;
      const initialSelection = new vscode.Selection(
        doc.positionAt(valueStart),
        doc.positionAt(valueEnd),
      );

      const mockEditor = new MockEditor(
        doc,
        initialSelection,
      ) as unknown as vscode.TextEditor;

      // Expand once
      provider.expandSelection(mockEditor);

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

    test('handles multiple expansions and shrinks', async () => {
      const provider = new SelectionProvider();
      const text = 'function test() { const obj = { key: "value" }; }';
      const doc = await createTestDocument(text);

      const valueStart = text.indexOf('value');
      const valueEnd = valueStart + 5;
      const initialSelection = new vscode.Selection(
        doc.positionAt(valueStart),
        doc.positionAt(valueEnd),
      );

      const mockEditor = new MockEditor(
        doc,
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

      // Shrink back step by step
      provider.shrinkSelection(mockEditor);
      assert.deepStrictEqual(mockEditor.selection, step2);

      provider.shrinkSelection(mockEditor);
      assert.deepStrictEqual(mockEditor.selection, step1);

      provider.shrinkSelection(mockEditor);
      assert.deepStrictEqual(mockEditor.selection, step0);
    });

    test('limits selection history size', async () => {
      const provider = new SelectionProvider();
      const text = 'a'.repeat(1000); // Long text
      const doc = await createTestDocument(text);

      let currentSelection = new vscode.Selection(
        new vscode.Position(0, 0),
        new vscode.Position(0, 1),
      );

      const mockEditor = new MockEditor(
        doc,
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

    test('shrink with empty history does nothing', async () => {
      const provider = new SelectionProvider();
      const text = 'const value = 123';
      const doc = await createTestDocument(text);

      const initialSelection = new vscode.Selection(
        new vscode.Position(0, 6),
        new vscode.Position(0, 11),
      );

      const mockEditor = new MockEditor(
        doc,
        initialSelection,
      ) as unknown as vscode.TextEditor;

      // Shrink without any prior expansions
      provider.shrinkSelection(mockEditor);

      // Selection should remain unchanged
      assert.deepStrictEqual(mockEditor.selection, initialSelection);
    });
  });

  suite('Complex Selection Scenarios', () => {
    test('handles deeply nested structures', async () => {
      const provider = new SelectionProvider();
      const text =
        'const config = { api: { endpoints: { users: "/api/users/{id}" } } }';
      const doc = await createTestDocument(text);

      // Start from "id" inside the deeply nested string
      const idStart = text.indexOf('id');
      const idEnd = idStart + 2;
      const initialSelection = new vscode.Selection(
        doc.positionAt(idStart),
        doc.positionAt(idEnd),
      );

      const mockEditor = new MockEditor(
        doc,
        initialSelection,
      ) as unknown as vscode.TextEditor;

      // Should be able to expand through multiple levels
      provider.expandSelection(mockEditor);
      let selectedText = text.substring(
        doc.offsetAt(mockEditor.selection.start),
        doc.offsetAt(mockEditor.selection.end),
      );

      // Should have expanded to at least the string content
      assert.ok(selectedText.length > 2);
      assert.ok(selectedText.includes('id'));
    });

    test('handles mixed quote types', async () => {
      const provider = new SelectionProvider();
      const text = `const template = \`Hello "\${name}" and '\${greeting}'\``;
      const doc = await createTestDocument(text);

      // Start from "name" inside template literal
      const nameStart = text.indexOf('name');
      const nameEnd = nameStart + 4;
      const initialSelection = new vscode.Selection(
        doc.positionAt(nameStart),
        doc.positionAt(nameEnd),
      );

      const mockEditor = new MockEditor(
        doc,
        initialSelection,
      ) as unknown as vscode.TextEditor;

      provider.expandSelection(mockEditor);
      const selectedText = text.substring(
        doc.offsetAt(mockEditor.selection.start),
        doc.offsetAt(mockEditor.selection.end),
      );

      // Should handle the mixed quotes correctly
      assert.ok(selectedText.includes('name'));
      assert.ok(selectedText.length > 4);
    });

    test('prioritizes smaller expansions', async () => {
      const provider = new SelectionProvider();
      const text = 'function(array[index])';
      const doc = await createTestDocument(text);

      // Start from "index"
      const indexStart = text.indexOf('index');
      const indexEnd = indexStart + 5;
      const initialSelection = new vscode.Selection(
        doc.positionAt(indexStart),
        doc.positionAt(indexEnd),
      );

      const mockEditor = new MockEditor(
        doc,
        initialSelection,
      ) as unknown as vscode.TextEditor;

      provider.expandSelection(mockEditor);
      const selectedText = text.substring(
        doc.offsetAt(mockEditor.selection.start),
        doc.offsetAt(mockEditor.selection.end),
      );

      // Should select the brackets first (smaller expansion)
      assert.strictEqual(selectedText, '[index]');
    });

    test('handles code with comments', async () => {
      const provider = new SelectionProvider();
      const text = `function test() {
  // This is a comment
  const value = "string"; // End comment
  return value;
}`;
      const doc = await createTestDocument(text);

      // Start from "string" in the quoted text
      const stringStart = text.indexOf('string');
      const stringEnd = stringStart + 6;
      const initialSelection = new vscode.Selection(
        doc.positionAt(stringStart),
        doc.positionAt(stringEnd),
      );

      const mockEditor = new MockEditor(
        doc,
        initialSelection,
      ) as unknown as vscode.TextEditor;

      provider.expandSelection(mockEditor);
      const selectedText = text.substring(
        doc.offsetAt(mockEditor.selection.start),
        doc.offsetAt(mockEditor.selection.end),
      );

      // Should expand to the quoted string, ignoring comments
      assert.strictEqual(selectedText, '"string"');
    });

    test('handles empty selections', async () => {
      const provider = new SelectionProvider();
      const text = 'const obj = { key: value }';
      const doc = await createTestDocument(text);

      // Empty selection (cursor position) at "value"
      const valueStart = text.indexOf('value');
      const emptySelection = new vscode.Selection(
        doc.positionAt(valueStart),
        doc.positionAt(valueStart),
      );

      const mockEditor = new MockEditor(
        doc,
        emptySelection,
      ) as unknown as vscode.TextEditor;

      provider.expandSelection(mockEditor);
      const selectedText = text.substring(
        doc.offsetAt(mockEditor.selection.start),
        doc.offsetAt(mockEditor.selection.end),
      );

      // Should expand to select the word
      assert.strictEqual(selectedText, 'value');
    });
  });

  suite('Edge Cases and Error Handling', () => {
    test('handles very long lines', async () => {
      const provider = new SelectionProvider();
      const longString = 'x'.repeat(10000);
      const text = `const long = "${longString}"`;
      const doc = await createTestDocument(text);

      // Start from middle of long string
      const middlePos = text.indexOf(longString) + longString.length / 2;
      const selection = new vscode.Selection(
        doc.positionAt(middlePos),
        doc.positionAt(middlePos + 1),
      );

      const mockEditor = new MockEditor(
        doc,
        selection,
      ) as unknown as vscode.TextEditor;

      provider.expandSelection(mockEditor);
      const selectedText = text.substring(
        doc.offsetAt(mockEditor.selection.start),
        doc.offsetAt(mockEditor.selection.end),
      );

      // Should handle long text efficiently
      assert.ok(selectedText.length > 1);
    });

    test('handles malformed syntax gracefully', async () => {
      const provider = new SelectionProvider();
      const text = 'const broken = { key: "unclosed string'; // Missing closing quote and brace
      const doc = await createTestDocument(text);

      const keyStart = text.indexOf('key');
      const selection = new vscode.Selection(
        doc.positionAt(keyStart),
        doc.positionAt(keyStart + 3),
      );

      const mockEditor = new MockEditor(
        doc,
        selection,
      ) as unknown as vscode.TextEditor;

      // Should not throw error even with malformed syntax
      assert.doesNotThrow(() => {
        provider.expandSelection(mockEditor);
      });
    });

    test('handles selections at document boundaries', async () => {
      const provider = new SelectionProvider();
      const text = 'start';
      const doc = await createTestDocument(text);

      // Selection at very end of document
      const endSelection = new vscode.Selection(
        doc.positionAt(text.length - 1),
        doc.positionAt(text.length),
      );

      const mockEditor = new MockEditor(
        doc,
        endSelection,
      ) as unknown as vscode.TextEditor;

      provider.expandSelection(mockEditor);
      const selectedText = text.substring(
        doc.offsetAt(mockEditor.selection.start),
        doc.offsetAt(mockEditor.selection.end),
      );

      // Should expand to full word
      assert.strictEqual(selectedText, 'start');
    });

    test('handles unicode characters', async () => {
      const provider = new SelectionProvider();
      const text = 'const emoji = "🚀 Hello 世界"';
      const doc = await createTestDocument(text);

      // Start from the middle of the unicode string
      const helloStart = text.indexOf('Hello');
      const selection = new vscode.Selection(
        doc.positionAt(helloStart),
        doc.positionAt(helloStart + 5),
      );

      const mockEditor = new MockEditor(
        doc,
        selection,
      ) as unknown as vscode.TextEditor;

      provider.expandSelection(mockEditor);
      const selectedText = text.substring(
        doc.offsetAt(mockEditor.selection.start),
        doc.offsetAt(mockEditor.selection.end),
      );

      // Should handle unicode properly
      assert.ok(selectedText.includes('🚀'));
      assert.ok(selectedText.includes('世界'));
    });

    test('no expansion when no candidates found', async () => {
      const provider = new SelectionProvider();
      const text = 'plain text without special characters';
      const doc = await createTestDocument(text);

      // Select the entire text
      const fullSelection = new vscode.Selection(
        new vscode.Position(0, 0),
        doc.positionAt(text.length),
      );

      const mockEditor = new MockEditor(
        doc,
        fullSelection,
      ) as unknown as vscode.TextEditor;

      const originalSelection = mockEditor.selection;
      provider.expandSelection(mockEditor);

      // Selection should remain unchanged when no expansion is possible
      assert.deepStrictEqual(mockEditor.selection, originalSelection);
    });
  });

  suite('Integration with Different Finders', () => {
    test('token finder integration', async () => {
      const provider = new SelectionProvider();
      const text = 'const CONSTANT_VALUE = 123';
      const doc = await createTestDocument(text);

      // Start with part of the constant
      const constantStart = text.indexOf('CONSTANT');
      const selection = new vscode.Selection(
        doc.positionAt(constantStart),
        doc.positionAt(constantStart + 8), // "CONSTANT"
      );

      const mockEditor = new MockEditor(
        doc,
        selection,
      ) as unknown as vscode.TextEditor;

      provider.expandSelection(mockEditor);
      const selectedText = text.substring(
        doc.offsetAt(mockEditor.selection.start),
        doc.offsetAt(mockEditor.selection.end),
      );

      // Should expand to full token including underscores
      assert.strictEqual(selectedText, 'CONSTANT_VALUE');
    });

    test('multiple finder types work together', async () => {
      const provider = new SelectionProvider();
      const text = 'array[obj.method("param")]';
      const doc = await createTestDocument(text);

      // Start from "param"
      const paramStart = text.indexOf('param');
      const selection = new vscode.Selection(
        doc.positionAt(paramStart),
        doc.positionAt(paramStart + 5),
      );

      const mockEditor = new MockEditor(
        doc,
        selection,
      ) as unknown as vscode.TextEditor;

      // First expansion should be quotes
      provider.expandSelection(mockEditor);
      let selectedText = text.substring(
        doc.offsetAt(mockEditor.selection.start),
        doc.offsetAt(mockEditor.selection.end),
      );
      assert.strictEqual(selectedText, '"param"');

      // Next expansion should be parentheses
      provider.expandSelection(mockEditor);
      selectedText = text.substring(
        doc.offsetAt(mockEditor.selection.start),
        doc.offsetAt(mockEditor.selection.end),
      );
      assert.strictEqual(selectedText, '("param")');
    });
  });
});
