import * as assert from 'assert';
import * as vscode from 'vscode';
import { ConfigService } from '../../core';
import { getFinders } from '../../finders';

suite('Config Service Tests', () => {
  test('returns default values when no configuration is set', () => {
    // Store original function
    const originalGetConfiguration = vscode.workspace.getConfiguration;

    try {
      // Mock getConfiguration to return empty config
      vscode.workspace.getConfiguration = () =>
        ({
          get: (key: string, defaultValue: any) => defaultValue,
        } as any);

      const tokenPatterns = ConfigService.getTokenPatterns();
      const finderStates = ConfigService.getFinderStates();

      assert.deepStrictEqual(tokenPatterns, [
        '[a-zA-Z0-9_-]+',
        '[a-zA-Z0-9_\\-.]+',
        '[a-zA-Z0-9_\\-.#$@%]+',
        '[^\\s[\\]{}()"\'`]+',
      ]);

      assert.deepStrictEqual(finderStates, {
        token: true,
        quote: true,
        scope: true,
        line: true,
      });
    } finally {
      // Restore original function
      vscode.workspace.getConfiguration = originalGetConfiguration;
    }
  });

  test('returns custom configuration values', () => {
    const originalGetConfiguration = vscode.workspace.getConfiguration;

    try {
      const customConfig: Record<string, any> = {};
      customConfig['token.patterns'] = ['[a-zA-Z]+'];
      customConfig['token.enabled'] = false;
      customConfig['quote.enabled'] = true;
      customConfig['scope.enabled'] = false;
      customConfig['line.enabled'] = true;

      // Mock getConfiguration to return custom config
      vscode.workspace.getConfiguration = () =>
        ({
          get: (key: string, defaultValue: any) =>
            customConfig[key] ?? defaultValue,
        } as any);

      const tokenPatterns = ConfigService.getTokenPatterns();
      const finderStates = ConfigService.getFinderStates();

      assert.deepStrictEqual(tokenPatterns, ['[a-zA-Z]+']);
      assert.deepStrictEqual(finderStates, {
        token: false,
        quote: true,
        scope: false,
        line: true,
      });
    } finally {
      vscode.workspace.getConfiguration = originalGetConfiguration;
    }
  });

  test('individual config getters work correctly', () => {
    const originalGetConfiguration = vscode.workspace.getConfiguration;

    try {
      const customConfig: Record<string, any> = {};
      customConfig['token.enabled'] = false;
      customConfig['quote.enabled'] = false;
      customConfig['scope.enabled'] = true;
      customConfig['line.enabled'] = true;

      vscode.workspace.getConfiguration = () =>
        ({
          get: (key: string, defaultValue: any) =>
            customConfig[key] ?? defaultValue,
        } as any);

      assert.strictEqual(ConfigService.get('token.enabled'), false);
      assert.strictEqual(ConfigService.get('quote.enabled'), false);
      assert.strictEqual(ConfigService.get('scope.enabled'), true);
      assert.strictEqual(ConfigService.get('line.enabled'), true);
    } finally {
      vscode.workspace.getConfiguration = originalGetConfiguration;
    }
  });
});

suite('Unified Finder Tests', () => {
  test('FINDERS registry contains all expected finders', () => {
    const finders = getFinders();
    assert.strictEqual(finders.length, 4);

    const finderNames = finders.map((f) => f.name);
    assert.deepStrictEqual(finderNames, ['token', 'quote', 'scope', 'line']);

    // Verify all finders have the correct structure
    for (const finder of finders) {
      assert.ok(typeof finder.name === 'string');
      assert.ok(typeof finder.finder === 'function');
      assert.ok(typeof finder.configKey === 'string');
      assert.ok(finder.configKey.endsWith('.enabled'));
    }
  });

  test('all finders have unified signature', async () => {
    const testContent = 'hello "world" [test] line';
    const document = await vscode.workspace.openTextDocument({
      content: testContent,
      language: 'javascript',
    });

    const finders = getFinders();
    // Test that all finders can be called with the same signature
    for (const { name, finder } of finders) {
      try {
        const result = finder(testContent, 5, 10, document);
        // Result can be null or a valid candidate
        if (result) {
          assert.ok(typeof result.start === 'number');
          assert.ok(typeof result.end === 'number');
          assert.ok(result.start <= result.end);
        }
      } catch (error) {
        assert.fail(`Finder ${name} failed with unified signature: ${error}`);
      }
    }
  });

  test('finders work correctly when called individually', async () => {
    const testContent = 'hello "world" [test] line';
    const document = await vscode.workspace.openTextDocument({
      content: testContent,
      language: 'javascript',
    });

    const finders = getFinders();

    // Test quote finder
    const quoteFinder = finders.find((f) => f.name === 'quote')!;
    const quoteResult = quoteFinder.finder(testContent, 7, 12, document); // inside "world"
    assert.ok(quoteResult, 'Quote finder should find quotes around "world"');

    // Test scope finder
    const scopeFinder = finders.find((f) => f.name === 'scope')!;
    const scopeResult = scopeFinder.finder(testContent, 15, 19, document); // inside [test]
    assert.ok(scopeResult, 'Scope finder should find brackets around [test]');
  });
});
