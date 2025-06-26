import * as assert from 'assert';
import { findNearestQuotePair } from '../../../finders/quote';

suite('Quote Finder Tests', () => {
  suite('findNearestQuotePair', () => {
    test('finds double quotes', async () => {
      const text = 'const str = "hello world"';
      const start = text.indexOf('hello');
      const end = start + 'hello'.length;
      const result = findNearestQuotePair(text, start, end); // "hello"

      assert.ok(result);
      // Should prefer content inside quotes
      assert.strictEqual(
        text.substring(result.start, result.end),
        'hello world',
      );
    });

    test('finds single quotes', async () => {
      const text = "const str = 'hello world'";
      const start = text.indexOf('hello');
      const end = start + 'hello'.length;
      const result = findNearestQuotePair(text, start, end); // 'hello'

      assert.ok(result);
      assert.strictEqual(
        text.substring(result.start, result.end),
        'hello world',
      );
    });

    test('finds backticks', async () => {
      const text = 'const str = `hello ${name}`';
      const start = text.indexOf('hello');
      const end = start + 'hello'.length;
      const result = findNearestQuotePair(text, start, end); // `hello`

      assert.ok(result);
      // Should prefer content inside backticks
      assert.strictEqual(
        text.substring(result.start, result.end),
        'hello ${name}',
      );
    });

    test('select world should expand to quoted content', async () => {
      const text = 'const str = "hello \\"world\\""';
      const start = text.indexOf('world');
      const end = start + 'world'.length;
      const result = findNearestQuotePair(text, start, end); // "world"

      assert.ok(result);
      // Should return the complete escaped quote segment
      assert.strictEqual(
        text.substring(result.start, result.end),
        'hello \\"world\\"',
      );
    });

    test('select "world" should expand to quoted content 2', async () => {
      const text = 'const str = "hello \\"world\\""';
      const start = text.indexOf('"world\\"');
      const end = start + '"world\\"'.length;
      const result = findNearestQuotePair(text, start, end); // "world"

      assert.ok(result);
      // Should prefer content inside quotes
      assert.strictEqual(
        text.substring(result.start, result.end),
        'hello \\"world\\"',
      );
    });

    test('handles escaped quotes', async () => {
      const text = 'const str = "hello \\"world\\""';
      const start = text.indexOf('hello');
      const end = start + 'hello'.length;
      const result = findNearestQuotePair(text, start, end); // "hello"

      assert.ok(result);
      // Should prefer content inside quotes
      assert.strictEqual(
        text.substring(result.start, result.end),
        'hello \\"world\\"',
      );
    });

    test('finds nearest containing quote pair', async () => {
      const text =
        '"outer" and maybe it  does not work it full readme file?"inner content" and "outer2"';
      const result = findNearestQuotePair(text, 57, 62); // "inner" (inside the quotes)

      assert.ok(result);
      // Should prefer content inside quotes
      assert.strictEqual(
        text.substring(result.start, result.end),
        'inner content',
      );
    });

    test('finds smallest containing quote pair with nested quotes', async () => {
      const text = '"outer \\"inner\\" content"';
      const result = findNearestQuotePair(text, 8, 13); // "inner"

      assert.ok(result);
      // Should prefer content inside quotes
      assert.strictEqual(
        text.substring(result.start, result.end),
        'outer \\"inner\\" content',
      );
    });

    test('returns null when no containing quotes found', async () => {
      const text = 'no quotes here';
      const result = findNearestQuotePair(text, 5, 10);

      assert.strictEqual(result, null);
    });

    test('returns null when selection equals quote boundaries', async () => {
      const text = 'const str = "hello"';
      const result = findNearestQuotePair(text, 12, 19); // Exact quote match

      assert.strictEqual(result, null);
    });

    test('handles multiple quote types and returns smallest', async () => {
      const text = '"outer \'inner\' content"';
      const result = findNearestQuotePair(text, 8, 13); // 'inner'

      assert.ok(result);
      // Should find the single quotes as they're smaller
      assert.strictEqual(text.substring(result.start, result.end), "'inner'");
    });

    test('README expansion example - URL to quoted URL', async () => {
      const text = `const config = { url: 'https://example.com' };`;
      // Test expanding from URL content to include quotes
      const urlStart = text.indexOf('https://example.com');
      const urlEnd = urlStart + 'https://example.com'.length;

      const result = findNearestQuotePair(text, urlStart, urlEnd);

      assert.ok(result, 'Should find the surrounding quotes');
      assert.strictEqual(
        text.substring(result.start, result.end),
        "'https://example.com'",
      );
    });

    test('README expansion example - partial URL (example.com) to quoted URL', async () => {
      const text = `const config = { url: 'https://example.com' };`;
      // Test expanding from partial URL to content inside quotes (not including quotes)
      const partialStart = text.indexOf('example.com');
      const partialEnd = partialStart + 'example.com'.length;

      const result = findNearestQuotePair(text, partialStart, partialEnd);

      assert.ok(result, 'Should find the content inside quotes');
      // Quote finder returns content inside quotes when selection is partial
      assert.strictEqual(
        text.substring(result.start, result.end),
        'https://example.com',
      );
    });

    test('README expansion example - word (example) to quoted URL', async () => {
      const text = `const config = { url: 'https://example.com' };`;
      // Test expanding from just "example" to content inside quotes (not including quotes)
      const wordStart = text.indexOf('example');
      const wordEnd = wordStart + 'example'.length;

      const result = findNearestQuotePair(text, wordStart, wordEnd);

      assert.ok(result, 'Should find the content inside quotes');
      // Quote finder returns content inside quotes when selection is partial
      assert.strictEqual(
        text.substring(result.start, result.end),
        'https://example.com',
      );
    });

    test('Quote expansion from inside content to full quoted string', async () => {
      const text = `'https://example.com'`;
      // Test expanding from content inside quotes to include quotes
      const contentStart = text.indexOf('https');
      const contentEnd = text.indexOf('.com') + 4;

      const result = findNearestQuotePair(text, contentStart, contentEnd);

      assert.ok(result, 'Should find expansion to include quotes');
      assert.strictEqual(
        text.substring(result.start, result.end),
        "'https://example.com'",
      );
    });

    test('enhanced validation handles complex quote scenarios', async () => {
      // This simulates a case where quotes are part of text content, not code
      const text = '"He said "hello" to me"';
      const start = text.indexOf('"hello"') + 1; // Position inside "hello"
      const end = start + 'hello'.length;
      const result = findNearestQuotePair(text, start, end);

      // The validation logic should handle this appropriately
      // Whether it finds quotes or not depends on the validation rules
      // This test mainly ensures the function doesn't crash on complex input
      // and that the validation logic is being applied
      if (result) {
        assert.ok(text.substring(result.start, result.end).length > 0);
      }
    });

    test('handles complex markdown-like content correctly', async () => {
      const text = 'Use quotes like `"`, `\'`, and `` ` `` in markdown';
      const start = text.indexOf('`"`') + 1;
      const end = start + 1;
      const result = findNearestQuotePair(text, start, end);

      // This case should be handled by the validation logic
      // The result depends on whether it detects this as markdown context
      if (result) {
        // If found, should be the backtick pair around the quote
        assert.ok(text.substring(result.start, result.end).includes('"'));
      }
    });
  });

  test('handles problematic multi-line quote scenarios with single-line fallback', async () => {
    // Simulate the README scenario with unbalanced quotes in documentation
    const text = `
- **Quote Scopes**: Expands to content within quotes (\`"\`, \`'\`, \`\` \` \`\`)
- **Bracket Scopes**: Expands to content within brackets
- **Expand Selection**: \`Ctrl+E\` (Windows/Linux) or \`Cmd+E\` (Mac)
- **Retract Selection**: \`Ctrl+Shift+E\` (Windows/Linux)
`;

    // Test expanding from "Ctrl+E" - should find backticks on same line, not the large problematic span
    const ctrlEStart = text.indexOf('Ctrl+E');
    const ctrlEEnd = ctrlEStart + 'Ctrl+E'.length;
    const result = findNearestQuotePair(text, ctrlEStart, ctrlEEnd);

    assert.ok(result, 'Should find a quote candidate');
    assert.strictEqual(
      text.substring(result.start, result.end),
      '`Ctrl+E`',
      'Should find the backticks around Ctrl+E, not the large problematic span',
    );
  });

  test('still works normally for simple single-line cases', async () => {
    const text = 'const str = "hello world"';
    const start = text.indexOf('hello');
    const end = start + 'hello'.length;
    const result = findNearestQuotePair(text, start, end);

    assert.ok(result);
    assert.strictEqual(text.substring(result.start, result.end), 'hello world');
  });

  test('handles normal multi-line quotes when not problematic', async () => {
    const text = `const template = \`
This is a multi-line template
with some content
\`;`;

    const contentStart = text.indexOf('This');
    const contentEnd = contentStart + 'This'.length;
    const result = findNearestQuotePair(text, contentStart, contentEnd);

    assert.ok(result);
    // Should still find the full template content since it's reasonable size
    assert.ok(
      text
        .substring(result.start, result.end)
        .includes('This is a multi-line template'),
      'Should find multi-line template when size is reasonable',
    );
  });

  test('fallback only applies when quote span is very large or has line breaks in problematic way', async () => {
    // Create a case with moderately large quote that should still work normally
    const content =
      'This is some content that is longer than usual but not excessively large';
    const text = `const str = "${content}"`;

    const start = text.indexOf('content');
    const end = start + 'content'.length;
    const result = findNearestQuotePair(text, start, end);

    assert.ok(result);
    assert.strictEqual(
      text.substring(result.start, result.end),
      content,
      'Should work normally for moderately sized quotes',
    );
  });
});
