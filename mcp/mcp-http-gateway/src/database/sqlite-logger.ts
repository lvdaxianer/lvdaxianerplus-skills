/**
 * SQLite logger for request/error logs
 *
 * Features:
 * - Batch write optimization
 * - Daily statistics aggregation
 * - Query by date/tool
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */

import type Database from 'better-sqlite3';
import { getDatabase, getDatabasePath } from './connection.js';
import { logger } from '../middleware/logger.js';

// Batch write buffer
interface RequestLogEntry {
  timestamp: string;
  date_key: string;
  level: string;
  tool_name: string;
  message: string;
  method?: string;
  url?: string;
  request_headers?: string;
  request_body?: string;
  response_status?: number;
  response_headers?: string;
  response_body?: string;
  duration?: number;
}

interface ErrorLogEntry {
  timestamp: string;
  date_key: string;
  level: string;
  tool_name: string;
  message: string;
  error_type?: string;
  error_stack?: string;
  request_method?: string;
  request_url?: string;
  request_headers?: string;
  request_body?: string;
  duration?: number;
}

// Batch buffers
const requestLogBuffer: RequestLogEntry[] = [];
const errorLogBuffer: ErrorLogEntry[] = [];

// Configuration
let batchSize = 100;
let flushTimeout = 5000; // 5 seconds
let flushTimer: ReturnType<typeof setInterval> | null = null;

/**
 * Initialize SQLite logger with batch configuration
 *
 * @param config - SQLite logging config
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
export function initSqliteLogger(config: {
  batchSize?: number;
  syncInterval?: number;
}): void {
  batchSize = config.batchSize ?? 100;
  flushTimeout = config.syncInterval ?? 5000;

  // Start periodic flush timer
  if (flushTimer) {
    clearInterval(flushTimer);
  }
  flushTimer = setInterval(() => {
    flushBuffers();
  }, flushTimeout);

  logger.info('[SQLite Logger] Initialized', { batchSize, flushTimeout });
}

/**
 * Log request to SQLite (with batch optimization)
 *
 * @param toolName - Tool name
 * @param method - HTTP method
 * @param url - Request URL
 * @param headers - Request headers
 * @param body - Request body
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
export function logRequestToSqlite(
  toolName: string,
  method: string,
  url: string,
  headers: Record<string, string>,
  body?: unknown
): void {
  const now = new Date();
  const timestamp = now.toISOString();
  const date_key = timestamp.split('T')[0];

  const entry: RequestLogEntry = {
    timestamp,
    date_key,
    level: 'info',
    tool_name: toolName,
    message: `Request: ${method} ${url}`,
    method,
    url,
    request_headers: JSON.stringify(headers),
    request_body: body ? JSON.stringify(body) : undefined,
  };

  requestLogBuffer.push(entry);

  // Flush if buffer is full
  if (requestLogBuffer.length >= batchSize) {
    flushRequestBuffer();
  }
}

/**
 * Log response to SQLite
 *
 * @param toolName - Tool name
 * @param status - HTTP status code
 * @param duration - Request duration in ms
 * @param body - Response body
 * @param headers - Response headers
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
export function logResponseToSqlite(
  toolName: string,
  status: number,
  duration: number,
  body?: unknown,
  headers?: Record<string, string>
): void {
  const now = new Date();
  const timestamp = now.toISOString();
  const date_key = timestamp.split('T')[0];

  const entry: RequestLogEntry = {
    timestamp,
    date_key,
    level: status >= 200 && status < 300 ? 'info' : 'warn',
    tool_name: toolName,
    message: `Response: ${status}`,
    response_status: status,
    response_headers: headers ? JSON.stringify(headers) : undefined,
    response_body: body ? JSON.stringify(body) : undefined,
    duration,
  };

  requestLogBuffer.push(entry);

  // Update daily stats
  updateDailyStats(date_key, toolName, status, duration);

  // Flush if buffer is full
  if (requestLogBuffer.length >= batchSize) {
    flushRequestBuffer();
  }
}

/**
 * Log error to SQLite
 *
 * @param toolName - Tool name
 * @param error - Error object or message
 * @param duration - Request duration in ms
 * @param method - Request method
 * @param url - Request URL
 * @param headers - Request headers
 * @param body - Request body
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
export function logErrorToSqlite(
  toolName: string,
  error: unknown,
  duration: number,
  method?: string,
  url?: string,
  headers?: Record<string, string>,
  body?: unknown
): void {
  const now = new Date();
  const timestamp = now.toISOString();
  const date_key = timestamp.split('T')[0];

  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;

  const entry: ErrorLogEntry = {
    timestamp,
    date_key,
    level: 'error',
    tool_name: toolName,
    message: `Error: ${errorMessage}`,
    error_type: error instanceof Error ? error.constructor.name : 'Unknown',
    error_stack: errorStack,
    request_method: method,
    request_url: url,
    request_headers: headers ? JSON.stringify(headers) : undefined,
    request_body: body ? JSON.stringify(body) : undefined,
    duration,
  };

  errorLogBuffer.push(entry);

  // Update daily stats (error)
  updateDailyStats(date_key, toolName, 0, duration, true);

  // Flush if buffer is full
  if (errorLogBuffer.length >= batchSize) {
    flushErrorBuffer();
  }
}

/**
 * Flush all buffers immediately
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
export function flushBuffers(): void {
  flushRequestBuffer();
  flushErrorBuffer();
}

/**
 * Flush request log buffer to database
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
function flushRequestBuffer(): void {
  const db = getDatabase();
  if (!db) {
    logger.error('[SQLite Logger] Database not available for flushing');
    return;
  }

  if (requestLogBuffer.length === 0) {
    logger.debug('[SQLite Logger] Request buffer empty, skip flush');
    return;
  }

  logger.info('[SQLite Logger] Flushing request buffer', { count: requestLogBuffer.length });

  // Use prepared statement with proper binding
  const insert = db.prepare(`
    INSERT INTO request_logs (
      timestamp, date_key, level, tool_name, message,
      method, url, request_headers, request_body,
      response_status, response_headers, response_body, duration
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  try {
    for (const entry of requestLogBuffer) {
      insert.run(
        entry.timestamp,
        entry.date_key,
        entry.level,
        entry.tool_name,
        entry.message,
        entry.method ?? null,
        entry.url ?? null,
        entry.request_headers ?? null,
        entry.request_body ?? null,
        entry.response_status ?? null,
        entry.response_headers ?? null,
        entry.response_body ?? null,
        entry.duration ?? null
      );
    }
    requestLogBuffer.length = 0;
  } catch (error) {
    logger.error('[SQLite Logger] Failed to flush request buffer', { error });
  }
}

/**
 * Flush error log buffer to database
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
function flushErrorBuffer(): void {
  const db = getDatabase();
  if (!db || errorLogBuffer.length === 0) {
    return;
  }

  const insert = db.prepare(`
    INSERT INTO error_logs (
      timestamp, date_key, level, tool_name, message,
      error_type, error_stack, request_method, request_url,
      request_headers, request_body, duration
    ) VALUES (
      @timestamp, @date_key, @level, @tool_name, @message,
      @error_type, @error_stack, @request_method, @request_url,
      @request_headers, @request_body, @duration
    )
  `);

  const insertMany = db.transaction((entries: ErrorLogEntry[]) => {
    for (const entry of entries) {
      insert.run(entry);
    }
  });

  try {
    insertMany([...errorLogBuffer]);
    errorLogBuffer.length = 0;
  } catch (error) {
    logger.error('[SQLite Logger] Failed to flush error buffer', { error });
  }
}

/**
 * Update daily statistics
 *
 * @param dateKey - Date key (YYYY-MM-DD)
 * @param toolName - Tool name
 * @param status - HTTP status code (0 for error)
 * @param duration - Request duration in ms
 * @param isError - Whether this is an error
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
function updateDailyStats(
  dateKey: string,
  toolName: string,
  status: number,
  duration: number,
  isError: boolean = false
): void {
  const db = getDatabase();
  if (!db) {
    return;
  }

  // Get existing stats for the day
  const existing = db.prepare(
    'SELECT * FROM daily_stats WHERE date_key = ?'
  ).get(dateKey) as {
    date_key: string;
    total_requests: number;
    total_successes: number;
    total_errors: number;
    avg_duration: number;
    tool_stats: string;
  } | undefined;

  if (existing) {
    // Update existing stats
    const toolStats: Record<string, { requests: number; successes: number; errors: number; avgDuration: number }> =
      existing.tool_stats ? JSON.parse(existing.tool_stats) : {};

    // Update tool stats
    if (!toolStats[toolName]) {
      toolStats[toolName] = { requests: 0, successes: 0, errors: 0, avgDuration: 0 };
    }
    toolStats[toolName].requests++;
    // 条件： isError 或 status >= 400 或 status = 0 表示失败请求
    if (isError || status >= 400 || status === 0) {
      toolStats[toolName].errors++;
    } else if (status >= 200 && status < 300) {
      toolStats[toolName].successes++;
    }
    // Update rolling average duration
    toolStats[toolName].avgDuration =
      (toolStats[toolName].avgDuration * (toolStats[toolName].requests - 1) + duration) /
      toolStats[toolName].requests;

    // Calculate new totals
    const totalRequests = existing.total_requests + 1;
    // 条件： isError 或 status >= 400 或 status = 0 表示失败请求
    const isSuccess = !isError && status >= 200 && status < 300;
    const isFailed = isError || status >= 400 || status === 0;
    const totalSuccesses = isSuccess ? existing.total_successes + 1 : existing.total_successes;
    const totalErrors = isFailed ? existing.total_errors + 1 : existing.total_errors;
    const avgDuration = (existing.avg_duration * existing.total_requests + duration) / totalRequests;

    db.prepare(`
      UPDATE daily_stats SET
        total_requests = ?,
        total_successes = ?,
        total_errors = ?,
        avg_duration = ?,
        tool_stats = ?,
        updated_at = datetime('now')
      WHERE date_key = ?
    `).run(totalRequests, totalSuccesses, totalErrors, avgDuration, JSON.stringify(toolStats), dateKey);
  } else {
    // Create new stats entry
    // 条件： isError 或 status >= 400 或 status = 0 表示失败请求
    const isSuccess = !isError && status >= 200 && status < 300;
    const isFailed = isError || status >= 400 || status === 0;
    const toolStats: Record<string, { requests: number; successes: number; errors: number; avgDuration: number }> = {
      [toolName]: {
        requests: 1,
        successes: isSuccess ? 1 : 0,
        errors: isFailed ? 1 : 0,
        avgDuration: duration,
      },
    };

    db.prepare(`
      INSERT INTO daily_stats (
        date_key, total_requests, total_successes, total_errors, avg_duration, tool_stats
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      dateKey,
      1,
      isSuccess ? 1 : 0,
      isFailed ? 1 : 0,
      duration,
      JSON.stringify(toolStats)
    );
  }
}

/**
 * Query request logs by date
 *
 * @param date - Date key (YYYY-MM-DD)
 * @param limit - Maximum results
 * @returns Request logs
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
export function getRequestLogsByDate(date: string, limit: number = 100): RequestLogEntry[] {
  const db = getDatabase();
  if (!db) {
    return [];
  }

  return db.prepare(`
    SELECT * FROM request_logs
    WHERE date_key = ?
    ORDER BY timestamp DESC
    LIMIT ?
  `).all(date, limit) as RequestLogEntry[];
}

/**
 * Query request logs by tool name
 *
 * @param toolName - Tool name
 * @param limit - Maximum results
 * @returns Request logs
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
export function getRequestLogsByTool(toolName: string, limit: number = 100): RequestLogEntry[] {
  const db = getDatabase();
  if (!db) {
    return [];
  }

  return db.prepare(`
    SELECT * FROM request_logs
    WHERE tool_name = ?
    ORDER BY timestamp DESC
    LIMIT ?
  `).all(toolName, limit) as RequestLogEntry[];
}

/**
 * Query error logs by date
 *
 * @param date - Date key (YYYY-MM-DD)
 * @param limit - Maximum results
 * @returns Error logs
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
export function getErrorLogsByDate(date: string, limit: number = 100): ErrorLogEntry[] {
  const db = getDatabase();
  if (!db) {
    return [];
  }

  return db.prepare(`
    SELECT * FROM error_logs
    WHERE date_key = ?
    ORDER BY timestamp DESC
    LIMIT ?
  `).all(date, limit) as ErrorLogEntry[];
}

/**
 * 获取失败请求日志（response_status >= 400 或 error）
 *
 * @param date - Date key (YYYY-MM-DD)
 * @param limit - Maximum results
 * @returns Failed request logs
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
export function getFailedRequestLogs(
  date: string,
  limit: number = 100
): Array<{
  id: number;
  timestamp: string;
  date_key: string;
  level: string;
  tool_name: string;
  message: string;
  method?: string;
  url?: string;
  request_headers?: string;
  request_body?: string;
  response_status?: number;
  response_headers?: string;
  response_body?: string;
  duration?: number;
}> {
  const db = getDatabase();
  if (!db) {
    return [];
  }

  // 查询 request_logs 表中 response_status >= 400 的记录
  return db.prepare(`
    SELECT * FROM request_logs
    WHERE date_key = ? AND (response_status >= 400 OR response_status = 0 OR level = 'error')
    ORDER BY timestamp DESC
    LIMIT ?
  `).all(date, limit) as Array<{
    id: number;
    timestamp: string;
    date_key: string;
    level: string;
    tool_name: string;
    message: string;
    method?: string;
    url?: string;
    request_headers?: string;
    request_body?: string;
    response_status?: number;
    response_headers?: string;
    response_body?: string;
    duration?: number;
  }>;
}

/**
 * 获取所有错误和失败请求（合并 error_logs 和 request_logs）
 *
 * @param date - Date key (YYYY-MM-DD)
 * @param limit - Maximum results per type
 * @returns Combined error logs
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
export function getAllErrorLogs(
  date: string,
  limit: number = 50
): Array<{
  id: number;
  timestamp: string;
  date_key: string;
  level: string;
  tool_name: string;
  message: string;
  type: 'error' | 'failed_request';
  method?: string;
  url?: string;
  request_method?: string;
  request_url?: string;
  request_headers?: string;
  request_body?: string;
  response_status?: number;
  response_body?: string;
  error_type?: string;
  error_stack?: string;
  duration?: number;
}> {
  const db = getDatabase();
  if (!db) {
    return [];
  }

  // 查询 error_logs 表
  const errorLogs = db.prepare(`
    SELECT id, timestamp, date_key, level, tool_name, message,
           request_method as method, request_url as url,
           request_headers, request_body, duration,
           error_type, error_stack
    FROM error_logs
    WHERE date_key = ?
    ORDER BY timestamp DESC
    LIMIT ?
  `).all(date, limit) as Array<{
    id: number;
    timestamp: string;
    date_key: string;
    level: string;
    tool_name: string;
    message: string;
    method?: string;
    url?: string;
    request_headers?: string;
    request_body?: string;
    duration?: number;
    error_type?: string;
    error_stack?: string;
  }>;

  // 查询 request_logs 表中的失败请求
  const failedRequests = db.prepare(`
    SELECT id, timestamp, date_key, level, tool_name, message,
           method, url, request_headers, request_body,
           response_status, response_body, duration
    FROM request_logs
    WHERE date_key = ? AND (response_status >= 400 OR response_status = 0 OR level = 'error')
    ORDER BY timestamp DESC
    LIMIT ?
  `).all(date, limit) as Array<{
    id: number;
    timestamp: string;
    date_key: string;
    level: string;
    tool_name: string;
    message: string;
    method?: string;
    url?: string;
    request_headers?: string;
    request_body?: string;
    response_status?: number;
    response_body?: string;
    duration?: number;
  }>;

  // 合并并排序
  const combined: Array<{
    id: number;
    timestamp: string;
    date_key: string;
    level: string;
    tool_name: string;
    message: string;
    type: 'error' | 'failed_request';
    method?: string;
    url?: string;
    request_headers?: string;
    request_body?: string;
    response_status?: number;
    response_body?: string;
    error_type?: string;
    error_stack?: string;
    duration?: number;
  }> = [
    ...errorLogs.map(log => ({ ...log, type: 'error' as const })),
    ...failedRequests.map(log => ({ ...log, type: 'failed_request' as const })),
  ];

  // 按时间戳降序排序
  combined.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  return combined.slice(0, limit);
}

/**
 * Query daily statistics
 *
 * @param startDate - Start date (YYYY-MM-DD)
 * @param endDate - End date (YYYY-MM-DD)
 * @returns Daily stats
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
export function getDailyStats(
  startDate: string,
  endDate: string
): Array<{
  date_key: string;
  total_requests: number;
  total_successes: number;
  total_errors: number;
  avg_duration: number;
  tool_stats: string;
}> {
  const db = getDatabase();
  if (!db) {
    return [];
  }

  return db.prepare(`
    SELECT * FROM daily_stats
    WHERE date_key BETWEEN ? AND ?
    ORDER BY date_key DESC
  `).all(startDate, endDate) as Array<{
    date_key: string;
    total_requests: number;
    total_successes: number;
    total_errors: number;
    avg_duration: number;
    tool_stats: string;
  }>;
}

/**
 * Get recent logs for dashboard
 *
 * @param count - Number of logs to return
 * @returns Recent logs (both requests and errors)
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
export function getRecentLogs(count: number = 100): Array<{
  id: number;
  timestamp: string;
  date_key: string;
  level: string;
  tool_name: string;
  message: string;
  method?: string;
  url?: string;
  response_status?: number;
  duration?: number;
  type: 'request' | 'error';
}> {
  const db = getDatabase();
  if (!db) {
    return [];
  }

  // Get recent request logs
  const requestLogs = db.prepare(`
    SELECT id, timestamp, date_key, level, tool_name, message,
           method, url, response_status, duration
    FROM request_logs
    ORDER BY timestamp DESC
    LIMIT ?
  `).all(count / 2) as Array<{
    id: number;
    timestamp: string;
    date_key: string;
    level: string;
    tool_name: string;
    message: string;
    method?: string;
    url?: string;
    response_status?: number;
    duration?: number;
  }>;

  // Get recent error logs
  const errorLogs = db.prepare(`
    SELECT id, timestamp, date_key, level, tool_name, message,
           request_method as method, request_url as url, duration
    FROM error_logs
    ORDER BY timestamp DESC
    LIMIT ?
  `).all(count / 2) as Array<{
    id: number;
    timestamp: string;
    date_key: string;
    level: string;
    tool_name: string;
    message: string;
    method?: string;
    url?: string;
    duration?: number;
  }>;

  // Combine and sort by timestamp
  const combined = [
    ...requestLogs.map(log => ({ ...log, type: 'request' as const })),
    ...errorLogs.map(log => ({ ...log, response_status: undefined, type: 'error' as const })),
  ];

  combined.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  return combined.slice(0, count);
}

/**
 * Get today's statistics summary
 *
 * @returns Today's stats summary
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
export function getTodayStats(): {
  date_key: string;
  total_requests: number;
  total_successes: number;
  total_errors: number;
  avg_duration: number;
  tool_stats: Record<string, { requests: number; successes: number; errors: number; avgDuration: number }>;
} {
  const db = getDatabase();
  const today = new Date().toISOString().split('T')[0];

  if (!db) {
    return {
      date_key: today,
      total_requests: 0,
      total_successes: 0,
      total_errors: 0,
      avg_duration: 0,
      tool_stats: {},
    };
  }

  const stats = db.prepare(`
    SELECT * FROM daily_stats WHERE date_key = ?
  `).get(today) as {
    date_key: string;
    total_requests: number;
    total_successes: number;
    total_errors: number;
    avg_duration: number;
    tool_stats: string;
  } | undefined;

  if (!stats) {
    return {
      date_key: today,
      total_requests: 0,
      total_successes: 0,
      total_errors: 0,
      avg_duration: 0,
      tool_stats: {},
    };
  }

  return {
    ...stats,
    tool_stats: stats.tool_stats ? JSON.parse(stats.tool_stats) : {},
  };
}

/**
 * Stop flush timer and flush remaining buffers
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
export function stopSqliteLogger(): void {
  if (flushTimer) {
    clearInterval(flushTimer);
    flushTimer = null;
  }
  flushBuffers();
  logger.info('[SQLite Logger] Stopped and flushed remaining buffers');
}