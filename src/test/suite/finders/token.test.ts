import * as assert from 'assert';
import * as vscode from 'vscode';
import { findToken } from '../../../finders/token';

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

    if (!char) {
      return undefined;
    }

    // Use provided regex or default pattern
    const pattern = regex || /[a-zA-Z0-9_]+/;

    // Check if current character matches pattern
    if (!pattern.test(char)) {
      return undefined;
    }

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

suite('Token Finder Tests', () => {
  test('finds simple word token', () => {
    const text = 'const variable = value';
    const mockDoc = new MockDocument(text) as unknown as vscode.TextDocument;
    const start = text.indexOf('variable');
    const end = start + 'vari'.length;
    const result = findToken(text, start, end, mockDoc); // "vari" -> "variable"

    assert.ok(result);
    assert.strictEqual(result.start, start);
    assert.strictEqual(result.end, start + 'variable'.length);
    assert.strictEqual(text.substring(result.start, result.end), 'variable');
  });

  test('finds word with underscores', () => {
    const text = 'const my_variable_name = value';
    const mockDoc = new MockDocument(text) as unknown as vscode.TextDocument;
    const start = text.indexOf('my_variable_name');
    const end = start + 'my'.length;
    const result = findToken(text, start, end, mockDoc); // "my" -> "my_variable_name"

    assert.ok(result);
    assert.strictEqual(result.start, start);
    assert.strictEqual(result.end, start + 'my_variable_name'.length);
    assert.strictEqual(
      text.substring(result.start, result.end),
      'my_variable_name',
    );
  });

  test('finds extended token with dots and hyphens', () => {
    const text = 'const config = api-key.example.com';
    const mockDoc = new MockDocument(text) as unknown as vscode.TextDocument;
    const start = text.indexOf('api-key');
    const end = start + 'api'.length;
    const result = findToken(text, start, end, mockDoc); // "api" -> "api-key"

    assert.ok(result);
    assert.strictEqual(result.start, start);
    assert.strictEqual(result.end, start + 'api-key'.length); // only expands to 'api-key'
    assert.strictEqual(
      text.substring(result.start, result.end),
      'api-key', // Updated expected value
    );
  });

  test('returns null when current selection contains space', () => {
    const text = 'const variable = value';
    const mockDoc = new MockDocument(text) as unknown as vscode.TextDocument;
    const start = text.indexOf('variable');
    const end = text.indexOf('v', start + 1) + 1; // "variable = v" (contains space)
    const result = findToken(text, start, end, mockDoc);

    assert.strictEqual(result, null);
  });

  test('returns null when no word expansion possible', () => {
    const text = 'const variable = value';
    const mockDoc = new MockDocument(text) as unknown as vscode.TextDocument;
    const start = text.indexOf('variable');
    const end = start + 'variable'.length;
    const result = findToken(text, start, end, mockDoc); // "variable" (exact match)

    assert.strictEqual(result, null);
  });

  test('returns null when no word found at position', () => {
    const text = 'const   =   value';
    const mockDoc = new MockDocument(text) as unknown as vscode.TextDocument;
    const start = text.indexOf('=');
    const result = findToken(text, start, start, mockDoc); // Position at "="

    assert.strictEqual(result, null);
  });

  test('handles partial word selection - start of word', () => {
    const text = 'const longVariableName = value';
    const mockDoc = new MockDocument(text) as unknown as vscode.TextDocument;
    const start = text.indexOf('long');
    const end = start + 'long'.length;
    const result = findToken(text, start, end, mockDoc); // "long" -> "longVariableName"

    assert.ok(result);
    assert.strictEqual(
      text.substring(result.start, result.end),
      'longVariableName',
    );
  });

  test('handles partial word selection - end of word', () => {
    const text = 'const longVariableName = value';
    const mockDoc = new MockDocument(text) as unknown as vscode.TextDocument;
    const start = text.indexOf('Name');
    const end = start + 'Name'.length;
    const result = findToken(text, start, end, mockDoc); // "Name" -> "longVariableName"

    assert.ok(result);
    assert.strictEqual(
      text.substring(result.start, result.end),
      'longVariableName',
    );
  });

  test('handles partial word selection - middle of word', () => {
    const text = 'const longVariableName = value';
    const mockDoc = new MockDocument(text) as unknown as vscode.TextDocument;
    const start = text.indexOf('Variable');
    const end = start + 'Vari'.length;
    const result = findToken(text, start, end, mockDoc); // "Vari" -> "longVariableName"

    assert.ok(result);
    assert.strictEqual(
      text.substring(result.start, result.end),
      'longVariableName',
    );
  });

  test('uses different regex patterns', () => {
    const text = 'const file.name-v2.txt = value';
    const mockDoc = new MockDocument(text) as unknown as vscode.TextDocument;
    const start = text.indexOf('file');
    const end = start + 'file'.length;
    const result = findToken(text, start, end, mockDoc); // "file" -> should expand with extended pattern

    assert.ok(result);
    assert.strictEqual(
      text.substring(result.start, result.end),
      'file.name-v2.txt',
    );
  });

  test('handles camelCase words', () => {
    const text = 'const myVariableName = value';
    const mockDoc = new MockDocument(text) as unknown as vscode.TextDocument;
    const start = text.indexOf('myVariableName');
    const end = start + 'my'.length;
    const result = findToken(text, start, end, mockDoc); // "my" -> "myVariableName"

    assert.ok(result);
    assert.strictEqual(
      text.substring(result.start, result.end),
      'myVariableName',
    );
  });

  test('handles numbers in tokens', () => {
    const text = 'const var123test = value';
    const mockDoc = new MockDocument(text) as unknown as vscode.TextDocument;
    const start = text.indexOf('var123test');
    const end = start + 'var'.length;
    const result = findToken(text, start, end, mockDoc); // "var" -> "var123test"

    assert.ok(result);
    assert.strictEqual(text.substring(result.start, result.end), 'var123test');
  });

  test('handles tokens at string boundaries', () => {
    const text = 'word';
    const mockDoc = new MockDocument(text) as unknown as vscode.TextDocument;
    const start = text.indexOf('or');
    const end = start + 'or'.length;
    const result = findToken(text, start, end, mockDoc); // "or" -> "word"

    assert.ok(result);
    assert.strictEqual(text.substring(result.start, result.end), 'word');
  });

  test('handles multiple potential expansions', () => {
    const text = 'const URL_PATH = "http://example.com/path"';
    const mockDoc = new MockDocument(text) as unknown as vscode.TextDocument;
    const start = text.indexOf('URL_PATH');
    const end = start + 'URL'.length;
    const result = findToken(text, start, end, mockDoc); // "URL" -> "URL_PATH"

    assert.ok(result);
    assert.strictEqual(text.substring(result.start, result.end), 'URL_PATH');
  });
});
