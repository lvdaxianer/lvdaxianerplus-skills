/**
 * Logger middleware
 *
 * @author lvdaxianerplus
 * @date 2026-04-18
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  meta?: Record<string, unknown>;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

let currentLevel: LogLevel = 'info';
const logs: LogEntry[] = [];
const MAX_LOGS = 1000;

/**
 * Set log level
 *
 * @param level - Log level
 */
export function setLogLevel(level: LogLevel): void {
  currentLevel = level;
}

/**
 * Mask sensitive headers in logs
 *
 * @param headers - Headers object
 * @param sensitiveHeaders - List of sensitive header names
 * @returns Masked headers
 */
function maskSensitiveHeaders(
  headers: Record<string, string>,
  sensitiveHeaders: string[]
): Record<string, string> {
  const result: Record<string, string> = {};

  for (const [key, value] of Object.entries(headers)) {
    if (sensitiveHeaders.includes(key.toLowerCase())) {
      result[key] = '***';
    } else {
      result[key] = value;
    }
  }

  return result;
}

/**
 * Format log entry
 *
 * @param entry - Log entry
 * @returns Formatted string
 */
function formatLog(entry: LogEntry): string {
  const parts = [
    entry.timestamp,
    `[${entry.level.toUpperCase()}]`,
    entry.message,
  ];

  if (entry.meta) {
    parts.push(JSON.stringify(entry.meta));
  }

  return parts.join(' ');
}

/**
 * Write log
 *
 * @param level - Log level
 * @param message - Log message
 * @param meta - Additional metadata
 */
function writeLog(level: LogLevel, message: string, meta?: Record<string, unknown>): void {
  if (LOG_LEVELS[level] < LOG_LEVELS[currentLevel]) {
    return;
  }

  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    meta,
  };

  logs.push(entry);

  // Keep only last MAX_LOGS
  if (logs.length > MAX_LOGS) {
    logs.shift();
  }

  // Output to console
  console.log(formatLog(entry));
}

export const logger = {
  debug(message: string, meta?: Record<string, unknown>): void {
    writeLog('debug', message, meta);
  },

  info(message: string, meta?: Record<string, unknown>): void {
    writeLog('info', message, meta);
  },

  warn(message: string, meta?: Record<string, unknown>): void {
    writeLog('warn', message, meta);
  },

  error(message: string, meta?: Record<string, unknown>): void {
    writeLog('error', message, meta);
  },

  /**
   * Log request
   */
  logRequest(
    toolName: string,
    method: string,
    path: string,
    headers: Record<string, string>,
    sensitiveHeaders: string[]
  ): void {
    const masked = maskSensitiveHeaders(headers, sensitiveHeaders);
    writeLog('info', `[${toolName}] Request: ${method} ${path}`, { headers: masked });
  },

  /**
   * Log response
   */
  logResponse(
    toolName: string,
    status: number,
    body: string,
    duration: number
  ): void {
    writeLog('info', `[${toolName}] Response: ${status}`, { duration, body });
  },

  /**
   * Get recent logs
   */
  getLogs(count = 100): LogEntry[] {
    return logs.slice(-count);
  },
};
