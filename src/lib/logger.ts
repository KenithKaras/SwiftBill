/**
 * Production-safe logging service for SwiftBill.
 * Automatically handles development vs production environment logging.
 */

const IS_PROD = import.meta.env.PROD;

export const logger = {
  debug(message: string, ...args: any[]): void {
    if (!IS_PROD) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  },

  info(message: string, ...args: any[]): void {
    if (!IS_PROD) {
      console.info(`[INFO] ${message}`, ...args);
    }
  },

  warn(message: string, ...args: any[]): void {
    // Warnings are logged in production but can be sanitized or routed to monitoring
    console.warn(`[WARN] ${message}`, ...args);
  },

  error(message: string, error?: any, ...args: any[]): void {
    // Errors are always logged.
    // In production, we log a sanitized format, avoiding leakage of sensitive arguments.
    if (IS_PROD) {
      const errorMessage = error instanceof Error ? error.message : String(error || '');
      console.error(`[ERROR] ${message}: ${errorMessage}`);
    } else {
      console.error(`[ERROR] ${message}`, error, ...args);
    }
  }
};
