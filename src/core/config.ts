import * as vscode from 'vscode';

/**
 * Simple configuration utility for the extension
 * Config keys must match package.json contributes.configuration
 */
export class ConfigService {
  private static readonly section = 'genericExpandSelection';

  static get(key: string, document?: vscode.TextDocument): any {
    const config = vscode.workspace.getConfiguration(this.section, document);
    return config.get(key);
  }

  static getBoolean(key: string, document?: vscode.TextDocument): boolean {
    return this.get(key, document) ?? false;
  }

  static getArray(key: string, document?: vscode.TextDocument): string[] {
    return this.get(key, document) ?? [];
  }

  /**
   * Gets all finder enabled states
   */
  static getFinderStates(document?: vscode.TextDocument) {
    return {
      token: this.getBoolean('token.enabled', document),
      quote: this.getBoolean('quote.enabled', document),
      scope: this.getBoolean('scope.enabled', document),
      line: this.getBoolean('line.enabled', document),
    };
  }

  /**
   * Gets token patterns configuration
   */
  static getTokenPatterns(document?: vscode.TextDocument): string[] {
    return this.getArray('token.patterns', document);
  }
}
