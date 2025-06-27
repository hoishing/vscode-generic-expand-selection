import * as vscode from 'vscode';

export class Logger {
  private logChannel: vscode.LogOutputChannel;

  constructor(name: string) {
    this.logChannel = vscode.window.createOutputChannel(name, { log: true });
  }

  trace(message: string): void {
    this.logChannel.trace(message);
  }

  debug(message: string): void {
    this.logChannel.debug(message);
  }

  info(message: string): void {
    this.logChannel.info(message);
  }

  warn(message: string): void {
    this.logChannel.warn(message);
  }

  error(message: string): void {
    this.logChannel.error(message);
  }

  dispose() {
    this.logChannel.dispose();
  }
}

export const logger = new Logger('Generic Expand Selection');
