import * as vscode from 'vscode';

/**
 * Configuration keys for the Generic Expand Selection extension
 */
export type ConfigKey = 
  | 'token.patterns'
  | 'token.enabled'
  | 'quote.enabled'
  | 'scope.enabled'
  | 'line.enabled';

/**
 * Configuration value types
 */
export type ConfigValue<K extends ConfigKey> = 
  K extends 'token.patterns' ? string[] :
  K extends 'token.enabled' | 'quote.enabled' | 'scope.enabled' | 'line.enabled' ? boolean :
  never;

/**
 * Centralized configuration getter utility for the extension
 */
export class ConfigService {
  private static readonly section = 'genericExpandSelection';

  /**
   * Gets a configuration value with type safety
   */
  static get<K extends ConfigKey>(
    key: K,
    document?: vscode.TextDocument,
  ): ConfigValue<K> {
    const config = vscode.workspace.getConfiguration(
      this.section,
      document?.uri,
    );

    // Default values for each configuration key
    const getDefault = (configKey: ConfigKey): any => {
      switch (configKey) {
        case 'token.patterns':
          return [
            '[a-zA-Z0-9_-]+',
            '[a-zA-Z0-9_\\-.]+',
            '[a-zA-Z0-9_\\-.#$@%]+',
            '[^\\s[\\]{}()"\'`]+',
          ];
        case 'token.enabled':
        case 'quote.enabled':
        case 'scope.enabled':
        case 'line.enabled':
          return true;
        default:
          throw new Error(`Unknown config key: ${configKey}`);
      }
    };

    return config.get(key, getDefault(key));
  }

  /**
   * Gets all finder enabled states
   */
  static getFinderStates(document?: vscode.TextDocument): {
    token: boolean;
    quote: boolean;
    scope: boolean;
    line: boolean;
  } {
    return {
      token: this.get('token.enabled', document),
      quote: this.get('quote.enabled', document),
      scope: this.get('scope.enabled', document),
      line: this.get('line.enabled', document),
    };
  }

  /**
   * Gets token patterns configuration
   */
  static getTokenPatterns(document?: vscode.TextDocument): string[] {
    return this.get('token.patterns', document);
  }
}
