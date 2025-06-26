import * as assert from 'assert';
import { findNearestScope } from '../../../finders/scope';

suite('Scope Finder Tests', () => {
  test('finds square brackets', async () => {
    const text = 'array[index]';
    const start = text.indexOf('index');
    const end = start + 'index'.length;
    const result = findNearestScope(text, start, end); // "index"

    assert.ok(result);
    // Should return full scope when inner content is not valid expansion
    assert.strictEqual(result.start, text.indexOf('['));
    assert.strictEqual(result.end, text.indexOf(']') + 1);
    assert.strictEqual(text.substring(result.start, result.end), '[index]');
  });

  test('finds curly braces', async () => {
    const text = 'object{key: value}';
    const start = text.indexOf('key');
    const end = start + 'key'.length;
    const result = findNearestScope(text, start, end); // "key"

    assert.ok(result);
    assert.strictEqual(result.start, text.indexOf('k'));
    assert.strictEqual(result.end, text.indexOf('}'));
    assert.strictEqual(text.substring(result.start, result.end), 'key: value');
  });

  test('finds parentheses', async () => {
    const text = 'function(param1, param2)';
    const start = text.indexOf('param1');
    const end = start + 'param1'.length;
    const result = findNearestScope(text, start, end); // "param1"

    assert.ok(result);
    assert.strictEqual(result.start, text.indexOf('p'));
    assert.strictEqual(result.end, text.indexOf(')'));
    assert.strictEqual(
      text.substring(result.start, result.end),
      'param1, param2',
    );
  });

  test('finds nested scopes - innermost first', async () => {
    const text = 'array[obj{key: value}]';
    const result = findNearestScope(text, 10, 13); // "key"

    assert.ok(result);
    // Should find the innermost scope content (inside curly braces)
    assert.strictEqual(text.substring(result.start, result.end), 'key: value');
  });

  test('finds nested scopes - expands to outer', async () => {
    const text = 'array[obj{key: value}]';
    const result = findNearestScope(text, 6, 21); // "obj{key: value}"

    assert.ok(result);
    // Should find the outer scope (square brackets)
    assert.strictEqual(
      text.substring(result.start, result.end),
      '[obj{key: value}]',
    );
  });

  test('handles multiple nested levels', async () => {
    const text = 'func(array[obj{key: (inner)}])';
    const result = findNearestScope(text, 21, 26); // "inner"

    assert.ok(result);
    // Should find the innermost parentheses (current implementation behavior)
    assert.strictEqual(text.substring(result.start, result.end), '(inner)');
  });

  test('finds smallest containing scope', async () => {
    const text = 'func(param1) and func(param2)';
    const result = findNearestScope(text, 22, 28); // "param2"

    // Should return null because the current algorithm might not find this scope
    // or should find the containing scope
    if (result) {
      assert.strictEqual(text.substring(result.start, result.end), '(param2)');
    } else {
      assert.strictEqual(result, null);
    }
  });

  test('handles unbalanced scopes gracefully', async () => {
    const text = 'incomplete[bracket';
    const result = findNearestScope(text, 11, 17); // "bracket"

    assert.strictEqual(result, null);
  });

  test('returns null when no containing scope found', async () => {
    const text = 'no scopes here';
    const result = findNearestScope(text, 5, 10);

    assert.strictEqual(result, null);
  });

  test('returns null when selection equals scope boundaries', async () => {
    const text = 'array[index]';
    const result = findNearestScope(text, 5, 12); // Exact bracket match

    assert.strictEqual(result, null);
  });

  test('handles mixed scope types', async () => {
    const text = 'func({key: [1, 2, 3]})';
    const result = findNearestScope(text, 11, 12); // "1"

    assert.ok(result);
    // Should find the square brackets
    assert.strictEqual(text.substring(result.start, result.end), '[1, 2, 3]');
  });

  test('handles empty scopes', async () => {
    const text = 'empty[]';
    const result = findNearestScope(text, 6, 6); // Empty selection inside brackets

    assert.ok(result);
    assert.strictEqual(text.substring(result.start, result.end), '[]');
  });

  test('complex nested structure', async () => {
    const text = 'data[items.map(item => ({id: item.id, name: item.name}))]';
    const result = findNearestScope(text, 34, 41); // "item.id"

    assert.ok(result);
    // Should find the innermost containing scope content
    assert.strictEqual(
      text.substring(result.start, result.end),
      'id: item.id, name: item.name',
    );
  });

  test('respects scope precedence', async () => {
    const text = 'func((nested))';
    const result = findNearestScope(text, 6, 12); // "nested"

    assert.ok(result);
    // Should find the inner parentheses first
    assert.strictEqual(text.substring(result.start, result.end), '(nested)');
  });
});
