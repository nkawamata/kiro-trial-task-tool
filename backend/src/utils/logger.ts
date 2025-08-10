// Simple console logger with timestamps and colors
export class Logger {
  private static formatTimestamp(): string {
    return new Date().toISOString();
  }

  private static formatMessage(level: string, message: string, color: string): string {
    return `${color}[${level}]\x1b[0m \x1b[90m${this.formatTimestamp()}\x1b[0m ${message}`;
  }

  static info(message: string, ...args: any[]): void {
    console.log(this.formatMessage('INFO', message, '\x1b[36m'), ...args);
  }

  static warn(message: string, ...args: any[]): void {
    console.warn(this.formatMessage('WARN', message, '\x1b[33m'), ...args);
  }

  static error(message: string, ...args: any[]): void {
    console.error(this.formatMessage('ERROR', message, '\x1b[31m'), ...args);
  }

  static success(message: string, ...args: any[]): void {
    console.log(this.formatMessage('SUCCESS', message, '\x1b[32m'), ...args);
  }

  static debug(message: string, ...args: any[]): void {
    if (process.env.NODE_ENV === 'development') {
      console.log(this.formatMessage('DEBUG', message, '\x1b[35m'), ...args);
    }
  }
}

// Export default instance
export const logger = Logger;