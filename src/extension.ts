import * as vscode from 'vscode';
import { SelectionProvider } from './expandSelection';

export function activate(context: vscode.ExtensionContext) {
  const provider = new SelectionProvider();

  // Register expand selection command
  const expandCommand = vscode.commands.registerCommand(
    'vscode-generic-expand-selection.expandSelection',
    () => {
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        provider.expandSelection(editor);
      }
    },
  );

  // Register shrink selection command
  const shrinkCommand = vscode.commands.registerCommand(
    'vscode-generic-expand-selection.shrinkSelection',
    () => {
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        provider.shrinkSelection(editor);
      }
    },
  );

  context.subscriptions.push(expandCommand, shrinkCommand);
}

export function deactivate() {}
