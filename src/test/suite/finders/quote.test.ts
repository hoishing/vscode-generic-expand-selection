import * as assert from 'assert';
import { findNearestQuotePair } from '../../../finders/quote';

suite('Quote Finder Tests', () => {
  suite('findNearestQuotePair', () => {
    test('finds double quotes', () => {
      const text = 'const str = "hello world"';
      const start = text.indexOf('hello');
      const end = start + 'hello'.length;
      const result = findNearestQuotePair(text, start, end); // "hello"

      assert.ok(result);
      assert.strictEqual(result.start, text.indexOf('"'));
      assert.strictEqual(result.end, text.lastIndexOf('"') + 1);
      assert.strictEqual(
        text.substring(result.start, result.end),
        '"hello world"',
      );
      assert.strictEqual(
        text.substring(result.start + 1, result.end - 1),
        'hello world',
      );
    });

    test('finds single quotes', () => {
      const text = "const str = 'hello world'";
      const start = text.indexOf('hello');
      const end = start + 'hello'.length;
      const result = findNearestQuotePair(text, start, end); // 'hello'

      assert.ok(result);
      assert.strictEqual(result.start, text.indexOf("'"));
      assert.strictEqual(result.end, text.lastIndexOf("'") + 1);
      assert.strictEqual(
        text.substring(result.start, result.end),
        "'hello world'",
      );
      assert.strictEqual(
        text.substring(result.start + 1, result.end - 1),
        'hello world',
      );
    });

    test('finds backticks', () => {
      const text = 'const str = `hello ${name}`';
      const start = text.indexOf('hello');
      const end = start + 'hello'.length;
      const result = findNearestQuotePair(text, start, end); // `hello`

      assert.ok(result);
      assert.strictEqual(result.start, text.indexOf('`'));
      assert.strictEqual(result.end, text.lastIndexOf('`') + 1);
      assert.strictEqual(
        text.substring(result.start, result.end),
        '`hello ${name}`',
      );
      assert.strictEqual(
        text.substring(result.start + 1, result.end - 1),
        'hello ${name}',
      );
    });

    test('handles escaped quotes', () => {
      const text = 'const str = "hello \\"world\\""';
      const start = text.indexOf('hello');
      const end = start + 'hello'.length;
      const result = findNearestQuotePair(text, start, end); // "hello"

      assert.ok(result);
      assert.strictEqual(result.start, text.indexOf('"'));
      assert.strictEqual(result.end, text.lastIndexOf('"') + 1);
      assert.strictEqual(
        text.substring(result.start, result.end),
        '"hello \\"world\\""',
      );
      assert.strictEqual(
        text.substring(result.start + 1, result.end - 1),
        'hello \\"world\\"',
      );
    });

    test('finds nearest containing quote pair', () => {
      const text = '"outer" and "inner content" and "outer2"';
      const result = findNearestQuotePair(text, 14, 19); // "inner"

      assert.ok(result);
      assert.strictEqual(
        text.substring(result.start, result.end),
        '"inner content"',
      );
    });

    test('finds smallest containing quote pair with nested quotes', () => {
      const text = '"outer \\"inner\\" content"';
      const result = findNearestQuotePair(text, 8, 13); // "inner"

      assert.ok(result);
      // Should find the outer quote since escaped quotes don't create separate pairs
      assert.strictEqual(
        text.substring(result.start, result.end),
        '"outer \\"inner\\" content"',
      );
    });

    test('returns null when no containing quotes found', () => {
      const text = 'no quotes here';
      const result = findNearestQuotePair(text, 5, 10);

      assert.strictEqual(result, null);
    });

    test('returns null when selection equals quote boundaries', () => {
      const text = 'const str = "hello"';
      const result = findNearestQuotePair(text, 12, 19); // Exact quote match

      assert.strictEqual(result, null);
    });

    test('handles multiple quote types and returns smallest', () => {
      const text = '"outer \'inner\' content"';
      const result = findNearestQuotePair(text, 8, 13); // 'inner'

      assert.ok(result);
      // Should find the single quotes as they're smaller
      assert.strictEqual(text.substring(result.start, result.end), "'inner'");
    });
  });
});
