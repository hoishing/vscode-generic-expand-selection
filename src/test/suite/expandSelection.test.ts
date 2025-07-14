import * as assert from 'assert';
import * as vscode from 'vscode';
import { SelectionProvider } from '../../services';
import { findNearestQuotePair } from '../../finders/quote';
import { findToken } from '../../finders/token';

async function createTestDocument(
  content: string,
): Promise<vscode.TextDocument> {
  return await vscode.workspace.openTextDocument({
    content,
    language: 'typescript',
  });
}

suite('ExpandSelection Test Suite', () => {
  test('findNextExpansion with quotes', async () => {
    const provider = new SelectionProvider();
    const text = 'const url = "https://example.com"';
    const doc = await createTestDocument(text);

    // Test expanding from "example" to domain part
    const examplePos = text.indexOf('example');
    const result = (provider as any).findNextExpansion(
      text,
      examplePos,
      examplePos + 7,
      doc,
    );

    assert.ok(result);
    assert.strictEqual(text.substring(result.start, result.end), 'example.com');
  });

  test('findNextExpansion with nested quotes', async () => {
    const provider = new SelectionProvider();
    const text =
      'const config = `env:"WEBHOOK_URL" default:"https://api.example.com/webhook"`';
    const doc = await createTestDocument(text);

    // Test expanding from "api" to domain part
    const apiPos = text.indexOf('api');
    const result = (provider as any).findNextExpansion(
      text,
      apiPos,
      apiPos + 3,
      doc,
    );

    assert.ok(result);
    assert.strictEqual(
      text.substring(result.start, result.end),
      'api.example.com',
    );
  });

  test('findNextExpansion with brackets', async () => {
    const provider = new SelectionProvider();
    const text = 'array[index][key]';
    const doc = await createTestDocument(text);

    // Test expanding from "key" to brackets
    const keyPos = text.indexOf('key');
    const result = (provider as any).findNextExpansion(
      text,
      keyPos,
      keyPos + 3,
      doc,
    );

    assert.ok(result);
    assert.strictEqual(text.substring(result.start, result.end), '[key]');
  });

  test('findQuotePairsNoLineBreaks excludes content with line breaks', async () => {
    const provider = new SelectionProvider();
    const textWithLineBreak = 'path/to/\n/other/file';
    const textWithoutLineBreak = 'path/to/file/name';
    const docBreak = await createTestDocument(textWithLineBreak);
    const docNoBreak = await createTestDocument(textWithoutLineBreak);

    // Test that content with line breaks finds line expansion
    const resultWithBreak = (provider as any).findNextExpansion(
      textWithLineBreak,
      5,
      7,
      docBreak,
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
      docNoBreak,
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

  test('findQuotePairsNoLineBreaks works with colon separator', async () => {
    const provider = new SelectionProvider();
    const text = 'key:value:another';
    const doc = await createTestDocument(text);

    // Test expanding from "value" to full text
    const valuePos = text.indexOf('value');
    const result = (provider as any).findNextExpansion(
      text,
      valuePos,
      valuePos + 5,
      doc,
    );

    assert.ok(result);
    assert.strictEqual(
      text.substring(result.start, result.end),
      'key:value:another',
    );
  });

  test('findQuotePairsNoLineBreaks works with dot separator', async () => {
    const provider = new SelectionProvider();
    const text = 'example.domain.com';
    const doc = await createTestDocument(text);

    // Test expanding from "domain" to full text
    const domainPos = text.indexOf('domain');
    const result = (provider as any).findNextExpansion(
      text,
      domainPos,
      domainPos + 6,
      doc,
    );

    assert.ok(result);
    assert.strictEqual(
      text.substring(result.start, result.end),
      'example.domain.com',
    );
  });

  test('VS Code API word range with underscore exclusion', async () => {
    const provider = new SelectionProvider();
    const text = 'OK_NOW_MOVE';
    const doc = await createTestDocument(text);

    // Test expanding from 'NOW' to full word with underscores
    const nowPos = text.indexOf('NOW');
    const result = (provider as any).findNextExpansion(
      text,
      nowPos,
      nowPos + 3,
      doc,
    );

    assert.ok(result);
    const selectedText = text.substring(result.start, result.end);
    assert.strictEqual(selectedText, 'OK_NOW_MOVE');
  });

  test('findNextExpansion - underscore word progression', async () => {
    const provider = new SelectionProvider();
    const text = 'const OK_NOW_MOVE = value';
    const doc = await createTestDocument(text);

    // First expansion: 'NOW' part (from cursor at W)
    const nowStart = text.indexOf('NOW');
    const nowEnd = nowStart + 3;

    // Second expansion should be full word 'OK_NOW_MOVE'
    const result = (provider as any).findNextExpansion(
      text,
      nowStart,
      nowEnd,
      doc,
    );

    assert.ok(result);
    assert.strictEqual(text.substring(result.start, result.end), 'OK_NOW_MOVE');
  });

  test('trimmed content selection', async () => {
    const provider = new SelectionProvider();
    const text = 'function( \n  content with spaces  \n )';
    const doc = await createTestDocument(text);

    // Test expanding from "content" to trimmed content (without leading/trailing whitespace)
    const contentPos = text.indexOf('content');
    const result = (provider as any).findNextExpansion(
      text,
      contentPos,
      contentPos + 7,
      doc,
    );

    assert.ok(result);
    const selectedText = text.substring(result.start, result.end);
    assert.strictEqual(selectedText, 'content with spaces');

    // Verify no leading or trailing whitespace
    assert.strictEqual(selectedText.trim(), selectedText);
  });

  test('trimmed content with quotes', async () => {
    const provider = new SelectionProvider();
    const text = '"  hello world  "';
    const doc = await createTestDocument(text);

    // Test expanding from "hello" to trimmed content
    const helloPos = text.indexOf('hello');
    const result = (provider as any).findNextExpansion(
      text,
      helloPos,
      helloPos + 5,
      doc,
    );

    assert.ok(result);
    const selectedText = text.substring(result.start, result.end);
    assert.strictEqual(selectedText, 'hello world'); // Should prefer content inside quotes
  });

  test('README expansion example sequence', async () => {
    const provider = new SelectionProvider();
    const text = `const config = { url: 'https://example.com' };`;
    const doc = await createTestDocument(text);

    // Starting with cursor on "xamp" (part of "example")
    const xampPos = text.indexOf('xamp');

    // First expansion: xamp → example
    const step1 = (provider as any).findNextExpansion(
      text,
      xampPos,
      xampPos + 4,
      doc,
    );
    assert.ok(step1, 'Step 1: Should expand xamp to example');
    assert.strictEqual(text.substring(step1.start, step1.end), 'example');

    // Second expansion: example → example.com
    const step2 = (provider as any).findNextExpansion(
      text,
      step1.start,
      step1.end,
      doc,
    );
    assert.ok(step2, 'Step 2: Should expand example to example.com');
    assert.strictEqual(text.substring(step2.start, step2.end), 'example.com');

    // Third expansion: example.com → https://example.com
    const step3 = (provider as any).findNextExpansion(
      text,
      step2.start,
      step2.end,
      doc,
    );
    assert.ok(
      step3,
      'Step 3: Should expand example.com to https://example.com',
    );
    assert.strictEqual(
      text.substring(step3.start, step3.end),
      'https://example.com',
    );

    // Fourth expansion: https://example.com → 'https://example.com'
    const step4 = (provider as any).findNextExpansion(
      text,
      step3.start,
      step3.end,
      doc,
    );
    assert.ok(step4, 'Step 4: Should expand to quoted content');
    assert.strictEqual(
      text.substring(step4.start, step4.end),
      "'https://example.com'",
    );

    // Fifth expansion: 'https://example.com' → url: 'https://example.com'
    const step5 = (provider as any).findNextExpansion(
      text,
      step4.start,
      step4.end,
      doc,
    );
    assert.ok(step5, 'Step 5: Should expand to property assignment');
    assert.strictEqual(
      text.substring(step5.start, step5.end),
      "url: 'https://example.com'",
    );

    // Sixth expansion: url: 'https://example.com' → { url: 'https://example.com' }
    const step6 = (provider as any).findNextExpansion(
      text,
      step5.start,
      step5.end,
      doc,
    );
    assert.ok(step6, 'Step 6: Should expand to object content');
    assert.strictEqual(
      text.substring(step6.start, step6.end),
      "{ url: 'https://example.com' }",
    );

    // Seventh expansion: { url: 'https://example.com' } → const config = { url: 'https://example.com' }
    const step7 = (provider as any).findNextExpansion(
      text,
      step6.start,
      step6.end,
      doc,
    );
    assert.ok(step7, 'Step 7: Should expand to variable assignment');
    assert.strictEqual(
      text.substring(step7.start, step7.end),
      "const config = { url: 'https://example.com' }",
    );

    // Eighth expansion: const config = { url: 'https://example.com' } → const config = { url: 'https://example.com' };
    const step8 = (provider as any).findNextExpansion(
      text,
      step7.start,
      step7.end,
      doc,
    );
    assert.ok(step8, 'Step 8: Should expand to full statement with semicolon');
    assert.strictEqual(
      text.substring(step8.start, step8.end),
      "const config = { url: 'https://example.com' };",
    );
  });

  test('Quote scope edge case - content without quotes should expand to include quotes', async () => {
    const provider = new SelectionProvider();
    const text = `'https://example.com'`;
    const doc = await createTestDocument(text);

    // Test expanding from just the URL content to include quotes
    const urlStart = text.indexOf('https');
    const urlEnd = text.indexOf('.com') + 4;

    const result = (provider as any).findNextExpansion(
      text,
      urlStart,
      urlEnd,
      doc,
    );

    assert.ok(result, 'Should find quote expansion');
    assert.strictEqual(
      text.substring(result.start, result.end),
      "'https://example.com'",
    );
  });

  test('Debug quote finder behavior', async () => {
    const text = `const config = { url: 'https://example.com' };`;

    // Test quote finder directly
    const urlStart = text.indexOf('https');
    const urlEnd = text.indexOf('.com') + 4;

    const quoteResult = findNearestQuotePair(text, urlStart, urlEnd);
    assert.ok(quoteResult, 'Quote finder should find the surrounding quotes');
    if (quoteResult) {
      const quotedContent = text.substring(quoteResult.start, quoteResult.end);
      assert.strictEqual(quotedContent, "'https://example.com'");
    }
  });

  test('Debug expansion step by step', async () => {
    const provider = new SelectionProvider();
    const text = `const config = { url: 'https://example.com' };`;
    const doc = await createTestDocument(text);

    // Test expanding from "example.com"
    const exampleComStart = text.indexOf('example.com');
    const exampleComEnd = exampleComStart + 'example.com'.length;

    // Check what each finder returns
    const tokenResult = findToken(text, exampleComStart, exampleComEnd, doc);

    const result = (provider as any).findNextExpansion(
      text,
      exampleComStart,
      exampleComEnd,
      doc,
    );

    // Verify that token finder gives us the expected https URL expansion
    if (tokenResult) {
      assert.strictEqual(
        text.substring(tokenResult.start, tokenResult.end),
        'https://example.com',
      );
    }

    // The final result should be the token expansion (smallest valid expansion)
    assert.ok(result);
    assert.strictEqual(
      text.substring(result.start, result.end),
      'https://example.com',
    );
  });
});
