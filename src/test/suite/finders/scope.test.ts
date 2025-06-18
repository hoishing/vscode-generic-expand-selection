import * as assert from 'assert';
import { findNearestScope } from '../../../finders/scope';

suite('Scope Finder Tests', () => {
  test('finds square brackets', () => {
    const text = 'array[index]';
    const result = findNearestScope(text, 6, 11); // "index"

    assert.ok(result);
    assert.strictEqual(result.start, 5); // Opening bracket
    assert.strictEqual(result.end, 12); // Closing bracket + 1
    assert.strictEqual(result.contentStart, 6); // After opening bracket
    assert.strictEqual(result.contentEnd, 11); // Before closing bracket
    assert.strictEqual(text.substring(result.start, result.end), '[index]');
    assert.strictEqual(
      text.substring(result.contentStart, result.contentEnd),
      'index',
    );
  });

  test('finds curly braces', () => {
    const text = 'object{key: value}';
    const result = findNearestScope(text, 7, 10); // "key"

    assert.ok(result);
    assert.strictEqual(result.start, 6);
    assert.strictEqual(result.end, 18);
    assert.strictEqual(
      text.substring(result.start, result.end),
      '{key: value}',
    );
  });

  test('finds parentheses', () => {
    const text = 'function(param1, param2)';
    const result = findNearestScope(text, 9, 15); // "param1"

    assert.ok(result);
    assert.strictEqual(result.start, 8);
    assert.strictEqual(result.end, 24);
    assert.strictEqual(
      text.substring(result.start, result.end),
      '(param1, param2)',
    );
  });

  test('finds angle brackets', () => {
    const text = 'template<typename T>';
    const result = findNearestScope(text, 9, 17); // "typename"

    assert.ok(result);
    assert.strictEqual(result.start, 8);
    assert.strictEqual(result.end, 20);
    assert.strictEqual(
      text.substring(result.start, result.end),
      '<typename T>',
    );
  });

  test('finds nested scopes - innermost first', () => {
    const text = 'array[obj{key: value}]';
    const result = findNearestScope(text, 10, 13); // "key"

    assert.ok(result);
    // Should find the innermost scope (curly braces)
    assert.strictEqual(
      text.substring(result.start, result.end),
      '{key: value}',
    );
  });

  test('finds nested scopes - expands to outer', () => {
    const text = 'array[obj{key: value}]';
    const result = findNearestScope(text, 6, 21); // "obj{key: value}"

    assert.ok(result);
    // Should find the outer scope (square brackets)
    assert.strictEqual(
      text.substring(result.start, result.end),
      '[obj{key: value}]',
    );
  });

  test('handles multiple nested levels', () => {
    const text = 'func(array[obj{key: (inner)}])';
    const result = findNearestScope(text, 19, 24); // "inner"

    assert.ok(result);
    // Should find the innermost parentheses
    assert.strictEqual(text.substring(result.start, result.end), '(inner)');
  });

  test('finds smallest containing scope', () => {
    const text = 'func(param1) and func(param2)';
    const result = findNearestScope(text, 18, 24); // "param2"

    assert.ok(result);
    assert.strictEqual(text.substring(result.start, result.end), '(param2)');
  });

  test('handles unbalanced scopes gracefully', () => {
    const text = 'incomplete[bracket';
    const result = findNearestScope(text, 11, 17); // "bracket"

    assert.strictEqual(result, null);
  });

  test('returns null when no containing scope found', () => {
    const text = 'no scopes here';
    const result = findNearestScope(text, 5, 10);

    assert.strictEqual(result, null);
  });

  test('returns null when selection equals scope boundaries', () => {
    const text = 'array[index]';
    const result = findNearestScope(text, 5, 12); // Exact bracket match

    assert.strictEqual(result, null);
  });

  test('handles mixed scope types', () => {
    const text = 'func({key: [1, 2, 3]})';
    const result = findNearestScope(text, 11, 12); // "1"

    assert.ok(result);
    // Should find the square brackets
    assert.strictEqual(text.substring(result.start, result.end), '[1, 2, 3]');
  });

  test('handles empty scopes', () => {
    const text = 'empty[]';
    const result = findNearestScope(text, 6, 6); // Empty selection inside brackets

    assert.ok(result);
    assert.strictEqual(text.substring(result.start, result.end), '[]');
  });

  test('complex nested structure', () => {
    const text = 'data[items.map(item => ({id: item.id, name: item.name}))]';
    const result = findNearestScope(text, 34, 41); // "item.id"

    assert.ok(result);
    // Should find the innermost containing scope
    assert.strictEqual(
      text.substring(result.start, result.end),
      '{id: item.id, name: item.name}',
    );
  });

  test('respects scope precedence', () => {
    const text = 'func((nested))';
    const result = findNearestScope(text, 6, 12); // "nested"

    assert.ok(result);
    // Should find the inner parentheses first
    assert.strictEqual(text.substring(result.start, result.end), '(nested)');
  });
});
