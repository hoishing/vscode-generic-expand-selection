import * as vscode from 'vscode';
import { SelectionCandidate } from '../core';

export * from './quote';
export * from './scope';
export * from './line';
export * from './token';

// Import the individual finder functions
import { findNearestQuotePair } from './quote';
import { findNearestScope } from './scope';
import { findLineExpansion } from './line';
import { findToken } from './token';

/**
 * Unified finder function signature
 */
export type FinderFunction = (
  text: string,
  startIndex: number,
  endIndex: number,
  document?: vscode.TextDocument,
) => SelectionCandidate | null;

/**
 * Configuration mapping for finder names to their enabled config keys
 */
export interface FinderConfig {
  name: string;
  finder: FinderFunction;
  configKey:
    | 'token.enabled'
    | 'quote.enabled'
    | 'scope.enabled'
    | 'line.enabled';
}

/**
 * Finder registry factory - returns all available finders with their configuration
 */
export function createFinderRegistry(): FinderConfig[] {
  return [
    {
      name: 'token',
      finder: findToken,
      configKey: 'token.enabled',
    },
    {
      name: 'quote',
      finder: findNearestQuotePair,
      configKey: 'quote.enabled',
    },
    {
      name: 'scope',
      finder: findNearestScope,
      configKey: 'scope.enabled',
    },
    {
      name: 'line',
      finder: findLineExpansion,
      configKey: 'line.enabled',
    },
  ];
}

/**
 * Get all available finders
 */
export function getFinders(): FinderConfig[] {
  return createFinderRegistry();
}
