import * as assert from 'assert';
import { findNearestQuotePair } from '../../../finders/quote';

suite('Quote Finder Tests', () => {
  suite('findNearestQuotePair', () => {
    test('finds double quotes', () => {
      const text = 'const str = "hello world"';
      const result = findNearestQuotePair(text, 13, 18); // "hello"

      assert.ok(result);
      assert.strictEqual(result.start, 12); // Opening quote
      assert.strictEqual(result.end, 25); // Closing quote + 1
      assert.strictEqual(result.contentStart, 13); // After opening quote
      assert.strictEqual(result.contentEnd, 24); // Before closing quote
      assert.strictEqual(
        text.substring(result.start, result.end),
        '"hello world"',
      );
      assert.strictEqual(
        text.substring(result.contentStart, result.contentEnd),
        'hello world',
      );
    });

    test('finds single quotes', () => {
      const text = "const str = 'hello world'";
      const result = findNearestQuotePair(text, 13, 18); // 'hello'

      assert.ok(result);
      assert.strictEqual(result.start, 12);
      assert.strictEqual(result.end, 25);
      assert.strictEqual(
        text.substring(result.start, result.end),
        "'hello world'",
      );
    });

    test('finds backticks', () => {
      const text = 'const str = `hello ${name}`';
      const result = findNearestQuotePair(text, 13, 18); // `hello`

      assert.ok(result);
      assert.strictEqual(result.start, 12);
      assert.strictEqual(result.end, 27);
      assert.strictEqual(
        text.substring(result.start, result.end),
        '`hello ${name}`',
      );
    });

    test('handles escaped quotes', () => {
      const text = 'const str = "hello \\"world\\""';
      const result = findNearestQuotePair(text, 13, 18); // "hello"

      assert.ok(result);
      assert.strictEqual(result.start, 12);
      assert.strictEqual(result.end, 29);
      assert.strictEqual(
        text.substring(result.start, result.end),
        '"hello \\"world\\""',
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
