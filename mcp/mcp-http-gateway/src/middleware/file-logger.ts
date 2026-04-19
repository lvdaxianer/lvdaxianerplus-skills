/**
 * File logger with rotation support
 *
 * Supports:
 * - Monthly rotation
 * - Size-based rotation (300MB default)
 * - Detailed request/response logging
 *
 * @author lvdaxianerplus
 * @date 2026-04-18
 */

import * as fs from 'fs';
import * as path from 'path';
import type { FileLoggingConfig } from '../config/types.js';
import { DEFAULT_FILE_LOGGING } from '../config/types.js';

/**
 * Log entry for file logging
 *
 * @author lvdaxianerplus
 * @date 2026-04-18
 */
interface FileLogEntry {
  timestamp: string;
  level: string;
  toolName: string;
  message: string;
  request?: {
    method: string;
    url: string;
    headers?: Record<string, string>;
    body?: unknown;
  };
  response?: {
    status: number;
    headers?: Record<string, string>;
    body?: unknown;
    duration: number;
  };
}

/**
 * File logger state
 *
 * @author lvdaxianerplus
 * @date 2026-04-18
 */
interface FileLoggerState {
  currentFile: string;
  currentMonth: string;
  currentSize: number;
  writeStream: fs.WriteStream | null;
}

let fileConfig: FileLoggingConfig = DEFAULT_FILE_LOGGING;
let loggerState: FileLoggerState | null = null;

/**
 * Initialize file logger
 *
 * @param config - File logging configuration
 *
 * @author lvdaxianerplus
 * @date 2026-04-18
 */
export function initFileLogger(config: FileLoggingConfig): void {
  fileConfig = { ...DEFAULT_FILE_LOGGING, ...config };

  // File logging is disabled by default
  if (!fileConfig.enabled) {
    return;
  }

  // Create log directory if not exists
  const logDir = fileConfig.dir ?? './logs';
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  // Initialize logger state
  const now = new Date();
  const monthKey = getMonthKey(now);
  const fileName = getLogFileName(logDir, monthKey);

  loggerState = {
    currentFile: fileName,
    currentMonth: monthKey,
    currentSize: fs.existsSync(fileName) ? fs.statSync(fileName).size : 0,
    writeStream: null,
  };

  // Open write stream
  openWriteStream();
}

/**
 * Get month key for rotation (YYYY-MM format)
 *
 * @param date - Date object
 * @returns Month key string
 *
 * @author lvdaxianerplus
 * @date 2026-04-18
 */
function getMonthKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Get log file name for a specific month
 *
 * @param dir - Log directory
 * @param monthKey - Month key (YYYY-MM)
 * @returns Full file path
 *
 * @author lvdaxianerplus
 * @date 2026-04-18
 */
function getLogFileName(dir: string, monthKey: string): string {
  return path.join(dir, `mcp-gateway-${monthKey}.log`);
}

/**
 * Open write stream for current log file
 *
 * @author lvdaxianerplus
 * @date 2026-04-18
 */
function openWriteStream(): void {
  if (!loggerState) {
    return;
  }

  // Close existing stream if open
  if (loggerState.writeStream) {
    loggerState.writeStream.end();
  }

  // Open new stream in append mode
  loggerState.writeStream = fs.createWriteStream(loggerState.currentFile, {
    flags: 'a',
    encoding: 'utf8',
  });
}

/**
 * Check if rotation is needed
 *
 * Rotation conditions:
 * 1. Monthly rotation: current month changed
 * 2. Size rotation: file size exceeds maxSize MB
 *
 * @returns Whether rotation is needed
 *
 * @author lvdaxianerplus
 * @date 2026-04-18
 */
function needsRotation(): boolean {
  if (!loggerState) {
    return false;
  }

  // Check monthly rotation
  if (fileConfig.rotateByMonth) {
    const currentMonth = getMonthKey(new Date());
    if (currentMonth !== loggerState.currentMonth) {
      return true;
    }
  }

  // Check size rotation (convert MB to bytes)
  const maxSizeBytes = (fileConfig.maxSize ?? 300) * 1024 * 1024;
  if (loggerState.currentSize >= maxSizeBytes) {
    return true;
  }

  return false;
}

/**
 * Perform log rotation
 *
 * @author lvdaxianerplus
 * @date 2026-04-18
 */
function rotateLog(): void {
  if (!loggerState) {
    return;
  }

  const logDir = fileConfig.dir ?? './logs';
  const now = new Date();
  const monthKey = getMonthKey(now);

  // Generate new file name with timestamp for size-based rotation
  let fileName: string;
  if (fileConfig.rotateByMonth && monthKey !== loggerState.currentMonth) {
    // Monthly rotation: use new month key
    fileName = getLogFileName(logDir, monthKey);
  } else {
    // Size rotation: append timestamp to filename
    const timestamp = now.toISOString().replace(/[:.]/g, '-');
    fileName = path.join(logDir, `mcp-gateway-${monthKey}-${timestamp}.log`);
  }

  // Close current stream
  if (loggerState.writeStream) {
    loggerState.writeStream.end();
  }

  // Update state
  loggerState.currentFile = fileName;
  loggerState.currentMonth = monthKey;
  loggerState.currentSize = 0;

  // Open new stream
  openWriteStream();
}

/**
 * Mask sensitive headers
 *
 * @param headers - Headers object
 * @param sensitiveHeaders - List of sensitive header names
 * @returns Masked headers
 *
 * @author lvdaxianerplus
 * @date 2026-04-18
 */
function maskSensitiveHeaders(
  headers: Record<string, string>,
  sensitiveHeaders: string[]
): Record<string, string> {
  const result: Record<string, string> = {};

  for (const [key, value] of Object.entries(headers)) {
    if (sensitiveHeaders.some((s) => key.toLowerCase().includes(s.toLowerCase()))) {
      result[key] = '***';
    } else {
      result[key] = value;
    }
  }

  return result;
}

/**
 * Write log entry to file
 *
 * @param entry - Log entry to write
 *
 * @author lvdaxianerplus
 * @date 2026-04-18
 */
function writeToFile(entry: FileLogEntry): void {
  if (!fileConfig.enabled || !loggerState || !loggerState.writeStream) {
    return;
  }

  // Check if rotation is needed before writing
  if (needsRotation()) {
    rotateLog();
  }

  // Format log entry as JSON line
  const logLine = JSON.stringify(entry) + '\n';
  const lineSize = Buffer.byteLength(logLine, 'utf8');

  // Write to file
  loggerState.writeStream.write(logLine);

  // Update size counter
  loggerState.currentSize += lineSize;
}

/**
 * Log request details to file
 *
 * @param toolName - Tool name
 * @param method - HTTP method
 * @param url - Request URL
 * @param headers - Request headers
 * @param body - Request body
 *
 * @author lvdaxianerplus
 * @date 2026-04-18
 */
export function logRequestToFile(
  toolName: string,
  method: string,
  url: string,
  headers: Record<string, string>,
  body?: unknown
): void {
  if (!fileConfig.enabled) {
    return;
  }

  const entry: FileLogEntry = {
    timestamp: new Date().toISOString(),
    level: 'INFO',
    toolName,
    message: `Request: ${method} ${url}`,
    request: {
      method,
      url,
      headers: fileConfig.logRequestHeaders
        ? maskSensitiveHeaders(headers, ['authorization', 'x-api-key', 'authentication'])
        : undefined,
      body: fileConfig.logRequestBody ? body : undefined,
    },
  };

  writeToFile(entry);
}

/**
 * Log response details to file
 *
 * @param toolName - Tool name
 * @param status - HTTP status code
 * @param headers - Response headers
 * @param body - Response body
 * @param duration - Request duration in ms
 *
 * @author lvdaxianerplus
 * @date 2026-04-18
 */
export function logResponseToFile(
  toolName: string,
  status: number,
  headers: Record<string, string>,
  body: unknown,
  duration: number
): void {
  if (!fileConfig.enabled) {
    return;
  }

  // Determine log level based on status
  const level: string = status >= 400 ? 'ERROR' : 'INFO';

  const entry: FileLogEntry = {
    timestamp: new Date().toISOString(),
    level,
    toolName,
    message: `Response: ${status} (${duration}ms)`,
    response: {
      status,
      headers: fileConfig.logResponseHeaders ? headers : undefined,
      body: fileConfig.logResponseBody ? body : undefined,
      duration,
    },
  };

  writeToFile(entry);
}

/**
 * Log error to file
 *
 * @param toolName - Tool name
 * @param error - Error message or object
 * @param duration - Request duration in ms
 *
 * @author lvdaxianerplus
 * @date 2026-04-18
 */
export function logErrorToFile(
  toolName: string,
  error: unknown,
  duration: number
): void {
  if (!fileConfig.enabled) {
    return;
  }

  const errorMessage = error instanceof Error ? error.message : String(error);

  const entry: FileLogEntry = {
    timestamp: new Date().toISOString(),
    level: 'ERROR',
    toolName,
    message: `Error: ${errorMessage} (${duration}ms)`,
    response: {
      status: 0,
      body: { error: errorMessage },
      duration,
    },
  };

  writeToFile(entry);
}

/**
 * Close file logger
 *
 * @author lvdaxianerplus
 * @date 2026-04-18
 */
export function closeFileLogger(): void {
  if (loggerState && loggerState.writeStream) {
    loggerState.writeStream.end();
    loggerState.writeStream = null;
  }
}

/**
 * Get current log file path
 *
 * @returns Current log file path or null
 *
 * @author lvdaxianerplus
 * @date 2026-04-18
 */
export function getCurrentLogFile(): string | null {
  return loggerState?.currentFile ?? null;
}