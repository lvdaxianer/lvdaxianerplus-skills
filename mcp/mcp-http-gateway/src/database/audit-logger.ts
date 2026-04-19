/**
 * Audit logger for compliance and security auditing
 *
 * Features:
 * - Session tracking
 * - Sensitive parameter masking
 * - Operation chain recording
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */

import { getDatabase } from './connection.js';
import { logger } from '../middleware/logger.js';

// Sensitive fields to mask
const SENSITIVE_FIELDS = [
  'password',
  'token',
  'apiKey',
  'api_key',
  'secret',
  'authorization',
  'credential',
  'accessToken',
  'refreshToken',
];

/**
 * Mask sensitive fields in arguments
 *
 * @param args - Arguments object
 * @returns Masked arguments
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
function maskSensitiveArgs(args: Record<string, unknown>): Record<string, unknown> {
  const masked: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(args)) {
    // Check if key is sensitive
    const lowerKey = key.toLowerCase();
    const isSensitive = SENSITIVE_FIELDS.some(field => lowerKey.includes(field.toLowerCase()));

    if (isSensitive) {
      masked[key] = '[REDACTED]';
    } else {
      masked[key] = value;
    }
  }

  return masked;
}

/**
 * Log audit entry
 *
 * @param sessionId - MCP session ID
 * @param clientInfo - Client information
 * @param toolName - Tool name
 * @param action - Action type (call_tool, list_tools)
 * @param args - Request arguments
 * @param resultStatus - Result status (success, failed)
 * @param duration - Request duration in ms
 * @param ipAddress - Client IP address
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
export function logAuditEntry(
  sessionId: string | undefined,
  clientInfo: Record<string, unknown> | undefined,
  toolName: string,
  action: string,
  args: Record<string, unknown> | undefined,
  resultStatus: 'success' | 'failed',
  duration: number,
  ipAddress: string | undefined
): void {
  const db = getDatabase();
  if (!db) {
    return;
  }

  const now = new Date();
  const timestamp = now.toISOString();
  const date_key = timestamp.split('T')[0];

  // Mask sensitive arguments
  const maskedArgs = args ? maskSensitiveArgs(args) : undefined;

  try {
    db.prepare(`
      INSERT INTO audit_logs (
        timestamp, date_key, session_id, client_info, tool_name,
        action, arguments, result_status, duration, ip_address
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      timestamp,
      date_key,
      sessionId ?? null,
      clientInfo ? JSON.stringify(clientInfo) : null,
      toolName,
      action,
      maskedArgs ? JSON.stringify(maskedArgs) : null,
      resultStatus,
      duration,
      ipAddress ?? null
    );
  } catch (error) {
    logger.error('[Audit Logger] Failed to log audit entry', { error });
  }
}

/**
 * Query audit logs by date
 *
 * @param date - Date key (YYYY-MM-DD)
 * @param limit - Maximum results
 * @returns Audit logs
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
export function getAuditLogsByDate(
  date: string,
  limit: number = 100
): Array<{
  id: number;
  timestamp: string;
  date_key: string;
  session_id: string | null;
  client_info: string | null;
  tool_name: string;
  action: string;
  arguments: string | null;
  result_status: string;
  duration: number | null;
  ip_address: string | null;
}> {
  const db = getDatabase();
  if (!db) {
    return [];
  }

  return db.prepare(`
    SELECT * FROM audit_logs
    WHERE date_key = ?
    ORDER BY timestamp DESC
    LIMIT ?
  `).all(date, limit) as Array<{
    id: number;
    timestamp: string;
    date_key: string;
    session_id: string | null;
    client_info: string | null;
    tool_name: string;
    action: string;
    arguments: string | null;
    result_status: string;
    duration: number | null;
    ip_address: string | null;
  }>;
}

/**
 * Query audit logs by session ID
 *
 * @param sessionId - Session ID
 * @returns Audit logs for the session
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
export function getAuditLogsBySession(
  sessionId: string
): Array<{
  id: number;
  timestamp: string;
  date_key: string;
  session_id: string | null;
  client_info: string | null;
  tool_name: string;
  action: string;
  arguments: string | null;
  result_status: string;
  duration: number | null;
  ip_address: string | null;
}> {
  const db = getDatabase();
  if (!db) {
    return [];
  }

  return db.prepare(`
    SELECT * FROM audit_logs
    WHERE session_id = ?
    ORDER BY timestamp ASC
  `).all(sessionId) as Array<{
    id: number;
    timestamp: string;
    date_key: string;
    session_id: string | null;
    client_info: string | null;
    tool_name: string;
    action: string;
    arguments: string | null;
    result_status: string;
    duration: number | null;
    ip_address: string | null;
  }>;
}

/**
 * Generate audit report for a date range
 *
 * @param startDate - Start date (YYYY-MM-DD)
 * @param endDate - End date (YYYY-MM-DD)
 * @returns Audit report summary
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
export function getAuditReport(
  startDate: string,
  endDate: string
): {
  startDate: string;
  endDate: string;
  totalOperations: number;
  successCount: number;
  failedCount: number;
  avgDuration: number;
  toolSummary: Record<string, { count: number; successRate: number; avgDuration: number }>;
  sessionCount: number;
} {
  const db = getDatabase();
  if (!db) {
    return {
      startDate,
      endDate,
      totalOperations: 0,
      successCount: 0,
      failedCount: 0,
      avgDuration: 0,
      toolSummary: {},
      sessionCount: 0,
    };
  }

  // Get all audit logs in range
  const logs = db.prepare(`
    SELECT * FROM audit_logs
    WHERE date_key BETWEEN ? AND ?
  `).all(startDate, endDate) as Array<{
    id: number;
    timestamp: string;
    date_key: string;
    session_id: string | null;
    tool_name: string;
    action: string;
    result_status: string;
    duration: number | null;
  }>;

  // Calculate summary
  const totalOperations = logs.length;
  const successCount = logs.filter(l => l.result_status === 'success').length;
  const failedCount = logs.filter(l => l.result_status === 'failed').length;
  const avgDuration = logs.reduce((sum, l) => sum + (l.duration ?? 0), 0) / totalOperations || 0;
  const uniqueSessions = new Set(logs.filter(l => l.session_id).map(l => l.session_id));

  // Tool summary
  const toolSummary: Record<string, { count: number; successRate: number; avgDuration: number }> = {};
  for (const log of logs) {
    if (!toolSummary[log.tool_name]) {
      toolSummary[log.tool_name] = { count: 0, successRate: 0, avgDuration: 0 };
    }
    toolSummary[log.tool_name].count++;
  }

  // Calculate success rate and avg duration for each tool
  for (const toolName of Object.keys(toolSummary)) {
    const toolLogs = logs.filter(l => l.tool_name === toolName);
    const toolSuccess = toolLogs.filter(l => l.result_status === 'success').length;
    toolSummary[toolName].successRate = toolSuccess / toolLogs.length || 0;
    toolSummary[toolName].avgDuration = toolLogs.reduce((sum, l) => sum + (l.duration ?? 0), 0) / toolLogs.length || 0;
  }

  return {
    startDate,
    endDate,
    totalOperations,
    successCount,
    failedCount,
    avgDuration,
    toolSummary,
    sessionCount: uniqueSessions.size,
  };
}

/**
 * Get unique sessions for a date
 *
 * @param date - Date key (YYYY-MM-DD)
 * @returns Session IDs
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
export function getSessionsByDate(date: string): string[] {
  const db = getDatabase();
  if (!db) {
    return [];
  }

  const result = db.prepare(`
    SELECT DISTINCT session_id FROM audit_logs
    WHERE date_key = ? AND session_id IS NOT NULL
  `).all(date) as Array<{ session_id: string }>;

  return result.map(r => r.session_id);
}