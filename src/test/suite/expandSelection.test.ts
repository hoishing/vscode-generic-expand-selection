import * as assert from 'assert';
import * as vscode from 'vscode';
import { SelectionProvider } from '../../expandSelection';

// Mock document for testing
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

    const wordPattern = regex || /[a-zA-Z0-9_]/;

    if (!char || !wordPattern.test(char)) {
      return undefined;
    }

    let wordStart = offset;
    let wordEnd = offset;

    // Expand backwards to find word start
    while (wordStart > 0 && wordPattern.test(this.text[wordStart - 1])) {
      wordStart--;
    }

    // Expand forwards to find word end
    while (wordEnd < this.text.length && wordPattern.test(this.text[wordEnd])) {
      wordEnd++;
    }

    return new vscode.Range(
      this.positionAt(wordStart),
      this.positionAt(wordEnd),
    );
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

suite('ExpandSelection Test Suite', () => {
  test('findNextExpansion with quotes', () => {
    const provider = new SelectionProvider();
    const text = 'const url = "https://example.com"';
    const mockDoc = new MockDocument(text) as unknown as vscode.TextDocument;

    // Test expanding from "example" to domain part
    const examplePos = text.indexOf('example');
    const result = (provider as any).findNextExpansion(
      text,
      examplePos,
      examplePos + 7,
      mockDoc,
    );

    assert.ok(result);
    assert.strictEqual(text.substring(result.start, result.end), 'example.com');
  });

  test('findNextExpansion with nested quotes', () => {
    const provider = new SelectionProvider();
    const text =
      'const config = `env:"WEBHOOK_URL" default:"https://api.example.com/webhook"`';
    const mockDoc = new MockDocument(text) as unknown as vscode.TextDocument;

    // Test expanding from "api" to domain part
    const apiPos = text.indexOf('api');
    const result = (provider as any).findNextExpansion(
      text,
      apiPos,
      apiPos + 3,
      mockDoc,
    );

    assert.ok(result);
    assert.strictEqual(
      text.substring(result.start, result.end),
      'api.example.com',
    );
  });

  test('findNextExpansion with brackets', () => {
    const provider = new SelectionProvider();
    const text = 'array[index][key]';
    const mockDoc = new MockDocument(text) as unknown as vscode.TextDocument;

    // Test expanding from "key" to brackets
    const keyPos = text.indexOf('key');
    const result = (provider as any).findNextExpansion(
      text,
      keyPos,
      keyPos + 3,
      mockDoc,
    );

    assert.ok(result);
    assert.strictEqual(text.substring(result.start, result.end), '[key]');
  });

  test('findQuotePairsNoLineBreaks excludes content with line breaks', () => {
    const provider = new SelectionProvider();
    const textWithLineBreak = 'path/to/\n/other/file';
    const textWithoutLineBreak = 'path/to/file/name';
    const mockDocBreak = new MockDocument(
      textWithLineBreak,
    ) as unknown as vscode.TextDocument;
    const mockDocNoBreak = new MockDocument(
      textWithoutLineBreak,
    ) as unknown as vscode.TextDocument;

    // Test that content with line breaks finds line expansion
    const resultWithBreak = (provider as any).findNextExpansion(
      textWithLineBreak,
      5,
      7,
      mockDocBreak,
    );
    // Should find line expansion
    assert.ok(resultWithBreak);
    assert.strictEqual(
      textWithLineBreak.substring(resultWithBreak.start, resultWithBreak.end),
      'path/to/',
    );

    // Test that content without line breaks works
    const filePos = textWithoutLineBreak.indexOf('file');
    const resultWithoutBreak = (provider as any).findNextExpansion(
      textWithoutLineBreak,
      filePos,
      filePos + 4,
      mockDocNoBreak,
    );

    assert.ok(resultWithoutBreak);
    assert.strictEqual(
      textWithoutLineBreak.substring(
        resultWithoutBreak.start,
        resultWithoutBreak.end,
      ),
      'path/to/file/name',
    );
  });

  test('findQuotePairsNoLineBreaks works with colon separator', () => {
    const provider = new SelectionProvider();
    const text = 'key:value:another';
    const mockDoc = new MockDocument(text) as unknown as vscode.TextDocument;

    // Test expanding from "value" to full text
    const valuePos = text.indexOf('value');
    const result = (provider as any).findNextExpansion(
      text,
      valuePos,
      valuePos + 5,
      mockDoc,
    );

    assert.ok(result);
    assert.strictEqual(
      text.substring(result.start, result.end),
      'key:value:another',
    );
  });

  test('findQuotePairsNoLineBreaks works with dot separator', () => {
    const provider = new SelectionProvider();
    const text = 'example.domain.com';
    const mockDoc = new MockDocument(text) as unknown as vscode.TextDocument;

    // Test expanding from "domain" to full text
    const domainPos = text.indexOf('domain');
    const result = (provider as any).findNextExpansion(
      text,
      domainPos,
      domainPos + 6,
      mockDoc,
    );

    assert.ok(result);
    assert.strictEqual(
      text.substring(result.start, result.end),
      'example.domain.com',
    );
  });

  test('VS Code API word range with underscore exclusion', () => {
    const provider = new SelectionProvider();
    const text = 'OK_NOW_MOVE';
    const mockDoc = new MockDocument(text) as unknown as vscode.TextDocument;

    // Test expanding from 'NOW' to full word with underscores
    const nowPos = text.indexOf('NOW');
    const result = (provider as any).findNextExpansion(
      text,
      nowPos,
      nowPos + 3,
      mockDoc,
    );

    assert.ok(result);
    const selectedText = text.substring(result.start, result.end);
    assert.strictEqual(selectedText, 'OK_NOW_MOVE');
  });

  test('findNextExpansion - underscore word progression', () => {
    const provider = new SelectionProvider();
    const text = 'const OK_NOW_MOVE = value';
    const mockDoc = new MockDocument(text) as unknown as vscode.TextDocument;

    // First expansion: 'NOW' part (from cursor at W)
    const nowStart = text.indexOf('NOW');
    const nowEnd = nowStart + 3;

    // Second expansion should be full word 'OK_NOW_MOVE'
    const result = (provider as any).findNextExpansion(
      text,
      nowStart,
      nowEnd,
      mockDoc,
    );

    assert.ok(result);
    assert.strictEqual(text.substring(result.start, result.end), 'OK_NOW_MOVE');
  });

  test('trimmed content selection', () => {
    const provider = new SelectionProvider();
    const text = 'function( \n  content with spaces  \n )';
    const mockDoc = new MockDocument(text) as unknown as vscode.TextDocument;

    // Test expanding from "content" to trimmed content (without leading/trailing whitespace)
    const contentPos = text.indexOf('content');
    const result = (provider as any).findNextExpansion(
      text,
      contentPos,
      contentPos + 7,
      mockDoc,
    );

    assert.ok(result);
    const selectedText = text.substring(result.start, result.end);
    assert.strictEqual(selectedText, 'content with spaces');

    // Verify no leading or trailing whitespace
    assert.strictEqual(selectedText.trim(), selectedText);
  });

  test('trimmed content with quotes', () => {
    const provider = new SelectionProvider();
    const text = '"  hello world  "';
    const mockDoc = new MockDocument(text) as unknown as vscode.TextDocument;

    // Test expanding from "hello" to trimmed content
    const helloPos = text.indexOf('hello');
    const result = (provider as any).findNextExpansion(
      text,
      helloPos,
      helloPos + 5,
      mockDoc,
    );

    assert.ok(result);
    const selectedText = text.substring(result.start, result.end);
    assert.strictEqual(selectedText, 'hello world'); // Should prefer content inside quotes
  });
});
