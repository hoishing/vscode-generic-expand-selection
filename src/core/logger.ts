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

/**
 * Logger factory function to create or get logger instances
 */
export class LoggerFactory {
  private static instances = new Map<string, Logger>();

  static getLogger(name: string = 'Generic Expand Selection'): Logger {
    if (!this.instances.has(name)) {
      this.instances.set(name, new Logger(name));
    }
    return this.instances.get(name)!;
  }

  static disposeAll(): void {
    for (const logger of this.instances.values()) {
      logger.dispose();
    }
    this.instances.clear();
  }
}

/**
 * Convenience function to get the default logger
 */
export function getLogger(): Logger {
  return LoggerFactory.getLogger();
}
