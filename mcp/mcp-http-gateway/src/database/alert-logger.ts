/**
 * Alert logger for system alerts and warnings
 *
 * Features:
 * - Circuit breaker alerts
 * - Error rate monitoring
 * - Severity classification
 * - Resolution tracking
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */

import { getDatabase } from './connection.js';
import { logger } from '../middleware/logger.js';
import fs from 'fs';
import path from 'path';

// Alert types
export type AlertType =
  | 'CIRCUIT_OPEN'
  | 'CIRCUIT_HALF_OPEN'
  | 'CIRCUIT_CLOSED'
  | 'HIGH_ERROR_RATE'
  | 'CACHE_EVICTED'
  | 'CONFIG_INVALID'
  | 'SERVICE_UNAVAILABLE'
  | 'BACKUP_FAILED';

// Alert severity
export type AlertSeverity = 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';

// Alert log directory
let alertLogDir = './logs';
let alertLogFile = 'alerts.log';

/**
 * Initialize alert logger
 *
 * @param config - Alert configuration
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
export function initAlertLogger(config: {
  logDir?: string;
}): void {
  alertLogDir = config.logDir ?? './logs';

  // Ensure log directory exists
  if (!fs.existsSync(alertLogDir)) {
    fs.mkdirSync(alertLogDir, { recursive: true });
  }

  alertLogFile = path.join(alertLogDir, 'alerts.log');
  logger.info('[Alert Logger] Initialized', { alertLogFile });
}

/**
 * Log an alert
 *
 * @param alertType - Alert type
 * @param severity - Alert severity
 * @param toolName - Tool name (optional)
 * @param message - Alert message
 * @param details - Additional details (optional)
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
export function logAlert(
  alertType: AlertType,
  severity: AlertSeverity,
  toolName: string | undefined,
  message: string,
  details: Record<string, unknown> | undefined
): void {
  const db = getDatabase();
  const now = new Date();
  const timestamp = now.toISOString();
  const date_key = timestamp.split('T')[0];

  // Log to SQLite
  if (db) {
    try {
      db.prepare(`
        INSERT INTO alert_logs (
          timestamp, date_key, alert_type, severity, tool_name,
          message, details
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        timestamp,
        date_key,
        alertType,
        severity,
        toolName ?? null,
        message,
        details ? JSON.stringify(details) : null
      );
    } catch (error) {
      logger.error('[Alert Logger] Failed to log alert to SQLite', { error });
    }
  }

  // Log to separate file
  const alertEntry = {
    timestamp,
    date_key,
    alert_type: alertType,
    severity,
    tool_name: toolName,
    message,
    details,
  };

  try {
    fs.appendFileSync(alertLogFile, JSON.stringify(alertEntry) + '\n');
  } catch (error) {
    logger.error('[Alert Logger] Failed to write alert to file', { error, alertLogFile });
  }

  // Also log to main logger based on severity
  const logMessage = `[Alert] ${alertType}: ${message}`;
  if (severity === 'CRITICAL') {
    logger.error(logMessage, { toolName, details });
  } else if (severity === 'ERROR') {
    logger.error(logMessage, { toolName, details });
  } else if (severity === 'WARN') {
    logger.warn(logMessage, { toolName, details });
  } else {
    logger.info(logMessage, { toolName, details });
  }
}

/**
 * Mark an alert as resolved
 *
 * @param alertId - Alert ID
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
export function resolveAlert(alertId: number): void {
  const db = getDatabase();
  if (!db) {
    return;
  }

  const now = new Date().toISOString();

  try {
    db.prepare(`
      UPDATE alert_logs SET resolved_at = ? WHERE id = ?
    `).run(now, alertId);
    logger.info('[Alert Logger] Alert resolved', { alertId, resolvedAt: now });
  } catch (error) {
    logger.error('[Alert Logger] Failed to resolve alert', { error, alertId });
  }
}

/**
 * Get unresolved alerts
 *
 * @returns Unresolved alerts
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
export function getUnresolvedAlerts(): Array<{
  id: number;
  timestamp: string;
  date_key: string;
  alert_type: string;
  severity: string;
  tool_name: string | null;
  message: string;
  details: string | null;
}> {
  const db = getDatabase();
  if (!db) {
    return [];
  }

  return db.prepare(`
    SELECT * FROM alert_logs
    WHERE resolved_at IS NULL
    ORDER BY timestamp DESC
  `).all() as Array<{
    id: number;
    timestamp: string;
    date_key: string;
    alert_type: string;
    severity: string;
    tool_name: string | null;
    message: string;
    details: string | null;
  }>;
}

/**
 * Get alerts by date
 *
 * @param date - Date key (YYYY-MM-DD)
 * @param limit - Maximum results
 * @returns Alerts
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
export function getAlertsByDate(
  date: string,
  limit: number = 100
): Array<{
  id: number;
  timestamp: string;
  date_key: string;
  alert_type: string;
  severity: string;
  tool_name: string | null;
  message: string;
  details: string | null;
  resolved_at: string | null;
}> {
  const db = getDatabase();
  if (!db) {
    return [];
  }

  return db.prepare(`
    SELECT * FROM alert_logs
    WHERE date_key = ?
    ORDER BY timestamp DESC
    LIMIT ?
  `).all(date, limit) as Array<{
    id: number;
    timestamp: string;
    date_key: string;
    alert_type: string;
    severity: string;
    tool_name: string | null;
    message: string;
    details: string | null;
    resolved_at: string | null;
  }>;
}

/**
 * Get alert summary for a date range
 *
 * @param startDate - Start date (YYYY-MM-DD)
 * @param endDate - End date (YYYY-MM-DD)
 * @returns Alert summary
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
export function getAlertSummary(
  startDate: string,
  endDate: string
): {
  startDate: string;
  endDate: string;
  totalAlerts: number;
  unresolvedAlerts: number;
  severityBreakdown: Record<string, number>;
  typeBreakdown: Record<string, number>;
} {
  const db = getDatabase();
  if (!db) {
    return {
      startDate,
      endDate,
      totalAlerts: 0,
      unresolvedAlerts: 0,
      severityBreakdown: {},
      typeBreakdown: {},
    };
  }

  const alerts = db.prepare(`
    SELECT * FROM alert_logs
    WHERE date_key BETWEEN ? AND ?
  `).all(startDate, endDate) as Array<{
    id: number;
    alert_type: string;
    severity: string;
    resolved_at: string | null;
  }>;

  const totalAlerts = alerts.length;
  const unresolvedAlerts = alerts.filter(a => !a.resolved_at).length;

  // Severity breakdown
  const severityBreakdown: Record<string, number> = {};
  for (const alert of alerts) {
    severityBreakdown[alert.severity] = (severityBreakdown[alert.severity] ?? 0) + 1;
  }

  // Type breakdown
  const typeBreakdown: Record<string, number> = {};
  for (const alert of alerts) {
    typeBreakdown[alert.alert_type] = (typeBreakdown[alert.alert_type] ?? 0) + 1;
  }

  return {
    startDate,
    endDate,
    totalAlerts,
    unresolvedAlerts,
    severityBreakdown,
    typeBreakdown,
  };
}

/**
 * Alert helper functions for common scenarios
 */

/**
 * Log circuit breaker open alert
 *
 * @param toolName - Tool name
 * @param failureCount - Number of failures
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
export function alertCircuitBreakerOpen(toolName: string, failureCount: number): void {
  logAlert(
    'CIRCUIT_OPEN',
    'ERROR',
    toolName,
    `Circuit breaker opened for tool ${toolName}`,
    { failureCount }
  );
}

/**
 * Log circuit breaker half-open alert
 *
 * @param toolName - Tool name
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
export function alertCircuitBreakerHalfOpen(toolName: string): void {
  logAlert(
    'CIRCUIT_HALF_OPEN',
    'WARN',
    toolName,
    `Circuit breaker entering half-open state for tool ${toolName}`,
    undefined
  );
}

/**
 * Log circuit breaker closed alert
 *
 * @param toolName - Tool name
 * @param successCount - Number of successes
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
export function alertCircuitBreakerClosed(toolName: string, successCount: number): void {
  logAlert(
    'CIRCUIT_CLOSED',
    'INFO',
    toolName,
    `Circuit breaker closed for tool ${toolName}`,
    { successCount }
  );
}

/**
 * Log high error rate alert
 *
 * @param toolName - Tool name (optional, null for global)
 * @param errorRate - Error rate percentage
 * @param threshold - Threshold percentage
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
export function alertHighErrorRate(
  toolName: string | undefined,
  errorRate: number,
  threshold: number
): void {
  logAlert(
    'HIGH_ERROR_RATE',
    errorRate > 50 ? 'CRITICAL' : 'ERROR',
    toolName,
    `Error rate ${errorRate.toFixed(2)}% exceeds threshold ${threshold}%`,
    { errorRate, threshold }
  );
}

/**
 * Log service unavailable alert
 *
 * @param toolName - Tool name
 * @param errorMessage - Error message
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
export function alertServiceUnavailable(toolName: string, errorMessage: string): void {
  logAlert(
    'SERVICE_UNAVAILABLE',
    'CRITICAL',
    toolName,
    `Service unavailable for tool ${toolName}`,
    { errorMessage }
  );
}

/**
 * Log config invalid alert
 *
 * @param configPath - Config file path
 * @param errorMessage - Error message
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
export function alertConfigInvalid(configPath: string, errorMessage: string): void {
  logAlert(
    'CONFIG_INVALID',
    'CRITICAL',
    undefined,
    `Configuration file invalid: ${configPath}`,
    { configPath, errorMessage }
  );
}

/**
 * Log backup failed alert
 *
 * @param backupPath - Backup path
 * @param errorMessage - Error message
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
export function alertBackupFailed(backupPath: string, errorMessage: string): void {
  logAlert(
    'BACKUP_FAILED',
    'ERROR',
    undefined,
    `Configuration backup failed`,
    { backupPath, errorMessage }
  );
}