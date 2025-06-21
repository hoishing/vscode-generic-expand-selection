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
      // Should prefer content inside quotes
      assert.strictEqual(
        text.substring(result.start, result.end),
        'hello world',
      );
    });

    test('finds single quotes', () => {
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

    test('finds backticks', () => {
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

    test('select world should expand to quoted content', () => {
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

    test('select "world" should expand to quoted content 2', () => {
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

    test('handles escaped quotes', () => {
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

    test('finds nearest containing quote pair', () => {
      const text = '"outer" and "inner content" and "outer2"';
      const result = findNearestQuotePair(text, 14, 19); // "inner"

      assert.ok(result);
      // Should prefer content inside quotes
      assert.strictEqual(
        text.substring(result.start, result.end),
        'inner content',
      );
    });

    test('finds smallest containing quote pair with nested quotes', () => {
      const text = '"outer \\"inner\\" content"';
      const result = findNearestQuotePair(text, 8, 13); // "inner"

      assert.ok(result);
      // Should prefer content inside quotes
      assert.strictEqual(
        text.substring(result.start, result.end),
        'outer \\"inner\\" content',
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
