import * as assert from 'assert';
import * as vscode from 'vscode';
import { SelectionProvider } from '../../services';

async function createTestDocument(
  content: string,
): Promise<vscode.TextDocument> {
  return await vscode.workspace.openTextDocument({
    content,
    language: 'typescript',
  });
}

class MockMultiCursorEditor implements Partial<vscode.TextEditor> {
  public selection: vscode.Selection;
  public selections: vscode.Selection[];

  constructor(
    public document: vscode.TextDocument,
    selections: vscode.Selection[],
  ) {
    this.selections = selections;
    this.selection = selections[0];
  }
}

class MockSingleCursorEditor implements Partial<vscode.TextEditor> {
  public selection: vscode.Selection;

  constructor(
    public document: vscode.TextDocument,
    selection: vscode.Selection,
  ) {
    this.selection = selection;
  }
}

function createSelection(
  start: number,
  end: number,
  document: vscode.TextDocument,
): vscode.Selection {
  const startPos = document.positionAt(start);
  const endPos = document.positionAt(end);
  return new vscode.Selection(startPos, endPos);
}

suite('ExpandSelection Multi-Cursor Tests', () => {
  suite('Multiple Cursor Expansion', () => {
    test('expands multiple selections independently', async () => {
      const provider = new SelectionProvider();
      const text =
        'const obj1 = { key: "value1" }; const obj2 = { key: "value2" };';
      const doc = await createTestDocument(text);

      const value1Start = text.indexOf('value1');
      const value1End = value1Start + 'value1'.length;
      const value2Start = text.indexOf('value2');
      const value2End = value2Start + 'value2'.length;

      const initialSelections = [
        createSelection(value1Start, value1End, doc),
        createSelection(value2Start, value2End, doc),
      ];

      const mockEditor = new MockMultiCursorEditor(doc, initialSelections);
      provider.expandSelection(mockEditor as unknown as vscode.TextEditor);

      assert.strictEqual(mockEditor.selections.length, 2);

      const selection1Text = text.substring(
        doc.offsetAt(mockEditor.selections[0].start),
        doc.offsetAt(mockEditor.selections[0].end),
      );
      const selection2Text = text.substring(
        doc.offsetAt(mockEditor.selections[1].start),
        doc.offsetAt(mockEditor.selections[1].end),
      );

      assert.strictEqual(selection1Text, '"value1"');
      assert.strictEqual(selection2Text, '"value2"');
    });

    test('handles mixed expansion results', async () => {
      const provider = new SelectionProvider();
      const text = 'const str = "hello"; const num = 42;';
      const doc = await createTestDocument(text);

      const helloStart = text.indexOf('hello');
      const helloEnd = helloStart + 'hello'.length;
      const numStart = text.indexOf('42');
      const numEnd = numStart + '42'.length;

      const initialSelections = [
        createSelection(helloStart, helloEnd, doc),
        createSelection(numStart, numEnd, doc),
      ];

      const mockEditor = new MockMultiCursorEditor(doc, initialSelections);
      provider.expandSelection(mockEditor as unknown as vscode.TextEditor);

      assert.strictEqual(mockEditor.selections.length, 2);

      const selection1Text = text.substring(
        doc.offsetAt(mockEditor.selections[0].start),
        doc.offsetAt(mockEditor.selections[0].end),
      );
      const selection2Text = text.substring(
        doc.offsetAt(mockEditor.selections[1].start),
        doc.offsetAt(mockEditor.selections[1].end),
      );

      assert.strictEqual(selection1Text, '"hello"');
      assert.strictEqual(selection2Text, '42;');
    });

    test('maintains selection order', async () => {
      const provider = new SelectionProvider();
      const text = '"a" + "b" + "c"';
      const doc = await createTestDocument(text);

      const aStart = text.indexOf('a');
      const bStart = text.indexOf('b');
      const cStart = text.indexOf('c');

      const initialSelections = [
        createSelection(aStart, aStart + 1, doc),
        createSelection(bStart, bStart + 1, doc),
        createSelection(cStart, cStart + 1, doc),
      ];

      const mockEditor = new MockMultiCursorEditor(doc, initialSelections);
      provider.expandSelection(mockEditor as unknown as vscode.TextEditor);

      assert.strictEqual(mockEditor.selections.length, 3);

      const selection1Text = text.substring(
        doc.offsetAt(mockEditor.selections[0].start),
        doc.offsetAt(mockEditor.selections[0].end),
      );
      const selection2Text = text.substring(
        doc.offsetAt(mockEditor.selections[1].start),
        doc.offsetAt(mockEditor.selections[1].end),
      );
      const selection3Text = text.substring(
        doc.offsetAt(mockEditor.selections[2].start),
        doc.offsetAt(mockEditor.selections[2].end),
      );

      assert.strictEqual(selection1Text, '"a"');
      assert.strictEqual(selection2Text, '"b"');
      assert.strictEqual(selection3Text, '"c"');
    });
  });

  suite('Multiple Cursor History and Shrinking', () => {
    test('maintains separate history for each cursor', async () => {
      const provider = new SelectionProvider();
      const text = 'obj1 = { key: "val1" }; obj2 = { key: "val2" };';
      const doc = await createTestDocument(text);

      const val1Start = text.indexOf('val1');
      const val2Start = text.indexOf('val2');

      const initialSelections = [
        createSelection(val1Start, val1Start + 4, doc),
        createSelection(val2Start, val2Start + 4, doc),
      ];

      const mockEditor = new MockMultiCursorEditor(doc, [...initialSelections]);

      provider.expandSelection(mockEditor as unknown as vscode.TextEditor);

      const firstExpansionSelections = [...mockEditor.selections];

      provider.expandSelection(mockEditor as unknown as vscode.TextEditor);

      provider.shrinkSelection(mockEditor as unknown as vscode.TextEditor);

      assert.strictEqual(mockEditor.selections.length, 2);
      assert.strictEqual(
        doc.offsetAt(mockEditor.selections[0].start),
        doc.offsetAt(firstExpansionSelections[0].start),
      );
      assert.strictEqual(
        doc.offsetAt(mockEditor.selections[0].end),
        doc.offsetAt(firstExpansionSelections[0].end),
      );
      assert.strictEqual(
        doc.offsetAt(mockEditor.selections[1].start),
        doc.offsetAt(firstExpansionSelections[1].start),
      );
      assert.strictEqual(
        doc.offsetAt(mockEditor.selections[1].end),
        doc.offsetAt(firstExpansionSelections[1].end),
      );
    });

    test('shrinks all cursors to previous state', async () => {
      const provider = new SelectionProvider();
      const text = '"hello" and "world"';
      const doc = await createTestDocument(text);

      const helloStart = text.indexOf('hello');
      const worldStart = text.indexOf('world');

      const initialSelections = [
        createSelection(helloStart, helloStart + 5, doc),
        createSelection(worldStart, worldStart + 5, doc),
      ];

      const mockEditor = new MockMultiCursorEditor(doc, [...initialSelections]);

      provider.expandSelection(mockEditor as unknown as vscode.TextEditor);
      provider.shrinkSelection(mockEditor as unknown as vscode.TextEditor);

      assert.strictEqual(mockEditor.selections.length, 2);
      assert.strictEqual(
        doc.offsetAt(mockEditor.selections[0].start),
        doc.offsetAt(initialSelections[0].start),
      );
      assert.strictEqual(
        doc.offsetAt(mockEditor.selections[0].end),
        doc.offsetAt(initialSelections[0].end),
      );
      assert.strictEqual(
        doc.offsetAt(mockEditor.selections[1].start),
        doc.offsetAt(initialSelections[1].start),
      );
      assert.strictEqual(
        doc.offsetAt(mockEditor.selections[1].end),
        doc.offsetAt(initialSelections[1].end),
      );
    });

    test('handles partial shrink when some cursors have no history', async () => {
      const provider = new SelectionProvider();
      const text = '"hello" and "world"';
      const doc = await createTestDocument(text);

      const helloStart = text.indexOf('hello');
      const worldStart = text.indexOf('world');

      const firstSelection = createSelection(helloStart, helloStart + 5, doc);
      const secondSelection = createSelection(worldStart, worldStart + 5, doc);

      const mockEditor = new MockMultiCursorEditor(doc, [firstSelection]);
      provider.expandSelection(mockEditor as unknown as vscode.TextEditor);

      mockEditor.selections = [mockEditor.selections[0], secondSelection];

      provider.shrinkSelection(mockEditor as unknown as vscode.TextEditor);

      assert.strictEqual(mockEditor.selections.length, 2);

      const selection1Text = text.substring(
        doc.offsetAt(mockEditor.selections[0].start),
        doc.offsetAt(mockEditor.selections[0].end),
      );
      const selection2Text = text.substring(
        doc.offsetAt(mockEditor.selections[1].start),
        doc.offsetAt(mockEditor.selections[1].end),
      );

      assert.strictEqual(selection1Text, 'hello');
      assert.strictEqual(selection2Text, 'world');
    });
  });

  suite('Edge Cases with Multiple Cursors', () => {
    test('handles many cursors efficiently', async () => {
      const provider = new SelectionProvider();
      const text = Array.from({ length: 10 }, (_, i) => `"val${i}"`).join(' ');
      const doc = await createTestDocument(text);

      const selections: vscode.Selection[] = [];
      for (let i = 0; i < 10; i++) {
        const start = text.indexOf(`val${i}`);
        selections.push(createSelection(start, start + 4, doc));
      }

      const mockEditor = new MockMultiCursorEditor(doc, selections);
      provider.expandSelection(mockEditor as unknown as vscode.TextEditor);

      assert.strictEqual(mockEditor.selections.length, 10);

      for (let i = 0; i < 10; i++) {
        const selectionText = text.substring(
          doc.offsetAt(mockEditor.selections[i].start),
          doc.offsetAt(mockEditor.selections[i].end),
        );
        assert.strictEqual(selectionText, `"val${i}"`);
      }
    });

    test('handles cursors with no expansion candidates', async () => {
      const provider = new SelectionProvider();
      const text = '"hello" \n\n "world"';
      const doc = await createTestDocument(text);

      const helloStart = text.indexOf('hello');
      const spaceStart = text.indexOf('\n\n') + 1;
      const worldStart = text.indexOf('world');

      const initialSelections = [
        createSelection(helloStart, helloStart + 5, doc),
        createSelection(spaceStart, spaceStart, doc),
        createSelection(worldStart, worldStart + 5, doc),
      ];

      const mockEditor = new MockMultiCursorEditor(doc, [...initialSelections]);
      provider.expandSelection(mockEditor as unknown as vscode.TextEditor);

      assert.strictEqual(mockEditor.selections.length, 3);

      const selection1Text = text.substring(
        doc.offsetAt(mockEditor.selections[0].start),
        doc.offsetAt(mockEditor.selections[0].end),
      );
      const selection2Start = doc.offsetAt(mockEditor.selections[1].start);
      const selection2End = doc.offsetAt(mockEditor.selections[1].end);
      const selection3Text = text.substring(
        doc.offsetAt(mockEditor.selections[2].start),
        doc.offsetAt(mockEditor.selections[2].end),
      );

      assert.strictEqual(selection1Text, '"hello"');
      assert.strictEqual(selection2Start, spaceStart);
      assert.strictEqual(selection2End, spaceStart);
      assert.strictEqual(selection3Text, '"world"');
    });

    test('backwards compatibility with single selection', async () => {
      const provider = new SelectionProvider();
      const text = 'const obj = { key: "value" }';
      const doc = await createTestDocument(text);

      const valueStart = text.indexOf('value');
      const selection = createSelection(valueStart, valueStart + 5, doc);

      const mockEditor = new MockSingleCursorEditor(doc, selection);

      provider.expandSelection(mockEditor as unknown as vscode.TextEditor);

      const selectionText = text.substring(
        doc.offsetAt(mockEditor.selection.start),
        doc.offsetAt(mockEditor.selection.end),
      );

      assert.strictEqual(selectionText, '"value"');
    });
  });

  suite('History Management with Multiple Cursors', () => {
    test('limits history per cursor independently', async () => {
      const provider = new SelectionProvider();
      const text = '"a" "b"';
      const doc = await createTestDocument(text);

      const aStart = text.indexOf('a');
      const bStart = text.indexOf('b');

      const selections = [
        createSelection(aStart, aStart + 1, doc),
        createSelection(bStart, bStart + 1, doc),
      ];

      const mockEditor = new MockMultiCursorEditor(doc, [...selections]);

      for (let i = 0; i < 105; i++) {
        provider.expandSelection(mockEditor as unknown as vscode.TextEditor);
        mockEditor.selections = [...selections];
      }

      assert.doesNotThrow(() => {
        provider.shrinkSelection(mockEditor as unknown as vscode.TextEditor);
      });
    });

    test('handles dynamic cursor count changes', async () => {
      const provider = new SelectionProvider();
      const text = '"a" "b" "c"';
      const doc = await createTestDocument(text);

      const aStart = text.indexOf('a');
      const bStart = text.indexOf('b');
      const cStart = text.indexOf('c');

      const mockEditor = new MockMultiCursorEditor(doc, [
        createSelection(aStart, aStart + 1, doc),
        createSelection(bStart, bStart + 1, doc),
      ]);

      provider.expandSelection(mockEditor as unknown as vscode.TextEditor);

      mockEditor.selections = [
        mockEditor.selections[0],
        mockEditor.selections[1],
        createSelection(cStart, cStart + 1, doc),
      ];

      provider.expandSelection(mockEditor as unknown as vscode.TextEditor);

      assert.strictEqual(mockEditor.selections.length, 3);

      provider.shrinkSelection(mockEditor as unknown as vscode.TextEditor);

      assert.strictEqual(mockEditor.selections.length, 3);
    });
  });
});
