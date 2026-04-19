export const LogLevel = {
  DEBUG: "DEBUG",
  INFO: "INFO",
  WARN: "WARN",
  ERROR: "ERROR",
} as const;

export type LogLevelType = (typeof LogLevel)[keyof typeof LogLevel];

export class Logger {
  private static isDevelopment = import.meta.env.DEV;

  static log(level: LogLevelType, message: string, data?: any) {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = `[${timestamp}] [${level}]`;

    if (Logger.isDevelopment || level === LogLevel.ERROR) {
      if (data) {
        console.log(`${prefix} ${message}`, data);
      } else {
        console.log(`${prefix} ${message}`);
      }
    }
  }

  static debug(message: string, data?: any) {
    Logger.log(LogLevel.DEBUG, message, data);
  }

  static info(message: string, data?: any) {
    Logger.log(LogLevel.INFO, message, data);
  }

  static warn(message: string, data?: any) {
    Logger.log(LogLevel.WARN, message, data);
  }

  static error(message: string, error?: any) {
    Logger.log(LogLevel.ERROR, message, error);
  }
}
