import * as vscode from 'vscode';
import { SelectionProvider } from './services';
import { getLogger } from './core';

export function activate(context: vscode.ExtensionContext) {
  const logger = getLogger();
  const provider = new SelectionProvider();

  // Register expand selection command
  const expandCommand = vscode.commands.registerCommand(
    'genericExpandSelection.expand',
    () => {
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        provider.expandSelection(editor);
      }
    },
  );

  // Register shrink selection command
  const shrinkCommand = vscode.commands.registerCommand(
    'genericExpandSelection.shrink',
    () => {
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        provider.shrinkSelection(editor);
      }
    },
  );

  context.subscriptions.push(expandCommand, shrinkCommand, logger);
}

export function deactivate() {}
