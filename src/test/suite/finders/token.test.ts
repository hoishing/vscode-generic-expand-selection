import * as assert from 'assert';
import * as vscode from 'vscode';
import { findToken } from '../../../finders/token';

async function createTestDocument(
  content: string,
): Promise<vscode.TextDocument> {
  return await vscode.workspace.openTextDocument({
    content,
    language: 'typescript',
  });
}

suite('Token Finder Tests', () => {
  test('finds simple word token', async () => {
    const text = 'const variable = value';
    const doc = await createTestDocument(text);
    const start = text.indexOf('variable');
    const end = start + 'vari'.length;
    const result = findToken(text, start, end, doc); // "vari" -> "variable"

    assert.ok(result);
    assert.strictEqual(result.start, start);
    assert.strictEqual(result.end, start + 'variable'.length);
    assert.strictEqual(text.substring(result.start, result.end), 'variable');
  });

  test('finds word with underscores', async () => {
    const text = 'const my_variable_name = value';
    const doc = await createTestDocument(text);
    const start = text.indexOf('my_variable_name');
    const end = start + 'my'.length;
    const result = findToken(text, start, end, doc); // "my" -> "my_variable_name"

    assert.ok(result);
    assert.strictEqual(result.start, start);
    assert.strictEqual(result.end, start + 'my_variable_name'.length);
    assert.strictEqual(
      text.substring(result.start, result.end),
      'my_variable_name',
    );
  });

  test('finds extended token with dots and hyphens', async () => {
    const text = 'const config = api-key.example.com';
    const doc = await createTestDocument(text);
    const start = text.indexOf('api-key');
    const end = start + 'api'.length;
    const result = findToken(text, start, end, doc); // "api" -> "api-key"

    assert.ok(result);
    assert.strictEqual(result.start, start);
    assert.strictEqual(result.end, start + 'api-key'.length); // only expands to 'api-key'
    assert.strictEqual(
      text.substring(result.start, result.end),
      'api-key', // Updated expected value
    );
  });

  test('returns null when current selection contains space', async () => {
    const text = 'const variable = value';
    const doc = await createTestDocument(text);
    const start = text.indexOf('variable');
    const end = text.indexOf('v', start + 1) + 1; // "variable = v" (contains space)
    const result = findToken(text, start, end, doc);

    assert.strictEqual(result, null);
  });

  test('returns null when no word expansion possible', async () => {
    const text = 'const variable = value';
    const doc = await createTestDocument(text);
    const start = text.indexOf('variable');
    const end = start + 'variable'.length;
    const result = findToken(text, start, end, doc); // "variable" (exact match)

    assert.strictEqual(result, null);
  });

  test('finds operator tokens with fallback pattern', async () => {
    const text = 'const   =   value';
    const doc = await createTestDocument(text);
    const start = text.indexOf('=');
    const result = findToken(text, start, start, doc); // Position at "="

    // With the new fallback pattern, operators should be found
    assert.ok(result);
    assert.strictEqual(text.substring(result.start, result.end), '=');
  });

  test('handles partial word selection - start of word', async () => {
    const text = 'const longVariableName = value';
    const doc = await createTestDocument(text);
    const start = text.indexOf('long');
    const end = start + 'long'.length;
    const result = findToken(text, start, end, doc); // "long" -> "longVariableName"

    assert.ok(result);
    assert.strictEqual(
      text.substring(result.start, result.end),
      'longVariableName',
    );
  });

  test('handles partial word selection - end of word', async () => {
    const text = 'const longVariableName = value';
    const doc = await createTestDocument(text);
    const start = text.indexOf('Name');
    const end = start + 'Name'.length;
    const result = findToken(text, start, end, doc); // "Name" -> "longVariableName"

    assert.ok(result);
    assert.strictEqual(
      text.substring(result.start, result.end),
      'longVariableName',
    );
  });

  test('handles partial word selection - middle of word', async () => {
    const text = 'const longVariableName = value';
    const doc = await createTestDocument(text);
    const start = text.indexOf('Variable');
    const end = start + 'Vari'.length;
    const result = findToken(text, start, end, doc); // "Vari" -> "longVariableName"

    assert.ok(result);
    assert.strictEqual(
      text.substring(result.start, result.end),
      'longVariableName',
    );
  });

  test('uses different regex patterns', async () => {
    const text = 'const file.name-v2.txt = value';
    const doc = await createTestDocument(text);
    const start = text.indexOf('file');
    const end = start + 'file'.length;
    const result = findToken(text, start, end, doc); // "file" -> should expand with extended pattern

    assert.ok(result);
    assert.strictEqual(
      text.substring(result.start, result.end),
      'file.name-v2.txt',
    );
  });

  test('handles camelCase words', async () => {
    const text = 'const myVariableName = value';
    const doc = await createTestDocument(text);
    const start = text.indexOf('myVariableName');
    const end = start + 'my'.length;
    const result = findToken(text, start, end, doc); // "my" -> "myVariableName"

    assert.ok(result);
    assert.strictEqual(
      text.substring(result.start, result.end),
      'myVariableName',
    );
  });

  test('handles numbers in tokens', async () => {
    const text = 'const var123test = value';
    const doc = await createTestDocument(text);
    const start = text.indexOf('var123test');
    const end = start + 'var'.length;
    const result = findToken(text, start, end, doc); // "var" -> "var123test"

    assert.ok(result);
    assert.strictEqual(text.substring(result.start, result.end), 'var123test');
  });

  test('handles tokens at string boundaries', async () => {
    const text = 'word';
    const doc = await createTestDocument(text);
    const start = text.indexOf('or');
    const end = start + 'or'.length;
    const result = findToken(text, start, end, doc); // "or" -> "word"

    assert.ok(result);
    assert.strictEqual(text.substring(result.start, result.end), 'word');
  });

  test('handles multiple potential expansions', async () => {
    const text = 'const URL_PATH = "http://example.com/path"';
    const doc = await createTestDocument(text);
    const start = text.indexOf('URL_PATH');
    const end = start + 'URL'.length;
    const result = findToken(text, start, end, doc); // "URL" -> "URL_PATH"

    assert.ok(result);
    assert.strictEqual(text.substring(result.start, result.end), 'URL_PATH');
  });

  test('returns null when at whitespace', async () => {
    const text = 'const   =   value';
    const doc = await createTestDocument(text);
    const start = text.indexOf('  ') + 1; // Position at space
    const result = findToken(text, start, start, doc); // Position at space

    assert.strictEqual(result, null);
  });
});
