/**
 * 灰度发布模块
 *
 * Features:
 * - 灰度策略：按百分比、按用户、按工具
 * - 灰度规则：新旧配置对比
 * - 灰度监控：实时监控灰度效果
 * - 灰度回滚：快速回滚到旧版本
 *
 * @author lvdaxianerplus
 * @date 2026-04-22
 */

import type { Config } from '../config/types.js';
import { logger } from '../middleware/logger.js';
import { getDatabase } from '../database/connection.js';

/**
 * 灰度策略类型
 *
 * @param type - 策略类型：percentage/user/tool
 * @param value - 策略值（百分比、用户列表、工具列表）
 *
 * @author lvdaxianerplus
 * @date 2026-04-22
 */
export interface CanaryStrategy {
  type: 'percentage' | 'user' | 'tool';
  value: number | string[];
}

/**
 * 灰度发布配置
 *
 * @param enabled - 是否启用灰度
 * @param name - 灰度名称
 * @param description - 灰度描述
 * @param strategy - 灰度策略
 * @param targetConfig - 目标配置（灰度版本）
 * @param baselineConfig - 基线配置（稳定版本）
 * @param startTime - 开始时间
 * @param endTime - 结束时间（可选）
 * @param autoRollbackThreshold - 自动回滚阈值（错误率）
 * @param status - 灰度状态：running/paused/completed/rolled_back
 *
 * @author lvdaxianerplus
 * @date 2026-04-22
 */
export interface CanaryRelease {
  id: string;
  enabled: boolean;
  name: string;
  description: string;
  strategy: CanaryStrategy;
  targetConfig: string;
  baselineConfig: string;
  startTime: string;
  endTime?: string;
  autoRollbackThreshold?: number;
  status: 'running' | 'paused' | 'completed' | 'rolled_back';
}

/**
 * 灰度发布指标
 *
 * @param requestCount - 请求总数
 * @param successCount - 成功数
 * @param errorCount - 错误数
 * @param errorRate - 错误率
 * @param avgDuration - 平均耗时
 * @param p99Duration - P99 耗时
 *
 * @author lvdaxianerplus
 * @date 2026-04-22
 */
export interface CanaryMetrics {
  requestCount: number;
  successCount: number;
  errorCount: number;
  errorRate: number;
  avgDuration: number;
  p99Duration: number;
}

/**
 * 灰度发布选项
 *
 * @param enabled - 是否启用灰度发布功能
 * @param autoMonitorInterval - 自动监控间隔（毫秒）
 * @param defaultThreshold - 默认自动回滚阈值（错误率百分比）
 *
 * @author lvdaxianerplus
 * @date 2026-04-22
 */
export interface CanaryOptions {
  enabled: boolean;
  autoMonitorInterval?: number;
  defaultThreshold?: number;
}

const CANARY_RELEASES_TABLE = 'canary_releases';
const CANARY_METRICS_TABLE = 'canary_metrics';

let canaryOptions: CanaryOptions = { enabled: true };
const activeCanaries: Map<string, CanaryRelease> = new Map();

/**
 * 初始化灰度发布模块
 *
 * @param options - 灰度发布选项
 *
 * @author lvdaxianerplus
 * @date 2026-04-22
 */
export function initCanary(options: CanaryOptions): void {
  canaryOptions = {
    enabled: options.enabled ?? true,
    autoMonitorInterval: options.autoMonitorInterval ?? 30000,
    defaultThreshold: options.defaultThreshold ?? 10,
  };

  // 条件注释：灰度发布启用时创建数据库表
  if (canaryOptions.enabled) {
    createCanaryTables();
    loadActiveCanaries();
    logger.info('[灰度发布] Canary release initialized', {
      enabled: canaryOptions.enabled,
      autoMonitorInterval: canaryOptions.autoMonitorInterval,
    });
  } else {
    logger.info('[灰度发布] Canary release disabled');
  }
}

/**
 * 创建灰度发布数据库表
 *
 * @author lvdaxianerplus
 * @date 2026-04-22
 */
function createCanaryTables(): void {
  const db = getDatabase();
  if (!db) {
    logger.warn('[灰度发布] Database not connected, cannot create canary tables');
    return;
  }

  // 条件注释：创建灰度发布表
  db.exec(`
    CREATE TABLE IF NOT EXISTS ${CANARY_RELEASES_TABLE} (
      id TEXT PRIMARY KEY,
      enabled INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      strategy_type TEXT NOT NULL,
      strategy_value TEXT NOT NULL,
      target_config TEXT NOT NULL,
      baseline_config TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT,
      auto_rollback_threshold REAL,
      status TEXT NOT NULL
    )
  `);

  // 条件注释：创建灰度指标表
  db.exec(`
    CREATE TABLE IF NOT EXISTS ${CANARY_METRICS_TABLE} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      canary_id TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      request_count INTEGER NOT NULL,
      success_count INTEGER NOT NULL,
      error_count INTEGER NOT NULL,
      error_rate REAL NOT NULL,
      avg_duration REAL NOT NULL,
      p99_duration REAL NOT NULL
    )
  `);

  // 创建索引
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_canary_status ON ${CANARY_RELEASES_TABLE}(status);
    CREATE INDEX IF NOT EXISTS idx_canary_metrics_id ON ${CANARY_METRICS_TABLE}(canary_id);
    CREATE INDEX IF NOT EXISTS idx_canary_metrics_time ON ${CANARY_METRICS_TABLE}(timestamp);
  `);

  logger.info('[灰度发布] Canary tables created');
}

/**
 * 加载活跃的灰度发布
 *
 * @author lvdaxianerplus
 * @date 2026-04-22
 */
function loadActiveCanaries(): void {
  const db = getDatabase();
  if (!db) {
    return;
  }

  try {
    const query = db.prepare(`SELECT * FROM ${CANARY_RELEASES_TABLE} WHERE status = 'running'`);
    const rows = query.all() as Array<{
      id: string;
      enabled: number;
      name: string;
      description: string | null;
      strategy_type: string;
      strategy_value: string;
      target_config: string;
      baseline_config: string;
      start_time: string;
      end_time: string | null;
      auto_rollback_threshold: number | null;
      status: string;
    }>;

    for (const row of rows) {
      const canary: CanaryRelease = {
        id: row.id,
        enabled: row.enabled === 1,
        name: row.name,
        description: row.description ?? '',
        strategy: {
          type: row.strategy_type as CanaryStrategy['type'],
          value: row.strategy_type === 'percentage'
            ? parseInt(row.strategy_value, 10)
            : JSON.parse(row.strategy_value),
        },
        targetConfig: row.target_config,
        baselineConfig: row.baseline_config,
        startTime: row.start_time,
        endTime: row.end_time ?? undefined,
        autoRollbackThreshold: row.auto_rollback_threshold ?? canaryOptions.defaultThreshold,
        status: row.status as CanaryRelease['status'],
      };
      activeCanaries.set(canary.id, canary);
    }

    logger.info('[灰度发布] Active canaries loaded', { count: activeCanaries.size });
  } catch (error) {
    logger.error('[灰度发布] Failed to load active canaries', { error });
  }
}

/**
 * 创建灰度发布
 *
 * @param canary - 灰度发布配置
 * @returns 创建的灰度发布
 *
 * @author lvdaxianerplus
 * @date 2026-04-22
 */
export function createCanary(canary: Omit<CanaryRelease, 'id' | 'startTime' | 'status'>): CanaryRelease | null {
  // 条件注释：灰度发布未启用时跳过
  if (!canaryOptions.enabled) {
    logger.warn('[灰度发布] Canary release disabled, cannot create');
    return null;
  }

  const db = getDatabase();
  if (!db) {
    return null;
  }

  try {
    const id = `canary-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const startTime = new Date().toISOString();
    const status: CanaryRelease['status'] = 'running';

    // 条件注释：序列化策略值
    const strategyValue = canary.strategy.type === 'percentage'
      ? String(canary.strategy.value)
      : JSON.stringify(canary.strategy.value);

    // 条件注释：插入数据库
    const insert = db.prepare(`
      INSERT INTO ${CANARY_RELEASES_TABLE} (id, enabled, name, description, strategy_type, strategy_value, target_config, baseline_config, start_time, end_time, auto_rollback_threshold, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insert.run(
      id,
      canary.enabled ? 1 : 0,
      canary.name,
      canary.description,
      canary.strategy.type,
      strategyValue,
      canary.targetConfig,
      canary.baselineConfig,
      startTime,
      canary.endTime ?? null,
      canary.autoRollbackThreshold ?? canaryOptions.defaultThreshold,
      status
    );

    // 条件注释：添加到活跃灰度列表
    const newCanary: CanaryRelease = {
      id,
      enabled: canary.enabled,
      name: canary.name,
      description: canary.description,
      strategy: canary.strategy,
      targetConfig: canary.targetConfig,
      baselineConfig: canary.baselineConfig,
      startTime,
      endTime: canary.endTime ?? undefined,
      autoRollbackThreshold: canary.autoRollbackThreshold ?? canaryOptions.defaultThreshold,
      status,
    };

    activeCanaries.set(id, newCanary);

    logger.info('[灰度发布] Canary created', { id, name: canary.name, strategy: canary.strategy.type });

    return newCanary;
  } catch (error) {
    logger.error('[灰度发布] Failed to create canary', { error });
    return null;
  }
}

/**
 * 判断请求是否命中灰度
 *
 * @param canaryId - 灰度发布 ID
 * @param context - 请求上下文（用户、工具等）
 * @returns 是否命中灰度
 *
 * @author lvdaxianerplus
 * @date 2026-04-22
 */
export function shouldHitCanary(
  canaryId: string,
  context: { userId?: string; toolName?: string }
): boolean {
  const canary = activeCanaries.get(canaryId);
  if (!canary || !canary.enabled || canary.status !== 'running') {
    return false;
  }

  // 条件注释：根据策略判断
  switch (canary.strategy.type) {
    case 'percentage':
      // 条件注释：按百分比灰度（基于哈希值）
      const percentage = canary.strategy.value as number;
      const hash = hashString(context.userId ?? context.toolName ?? 'default');
      return (hash % 100) < percentage;

    case 'user':
      // 条件注释：按用户灰度
      const users = canary.strategy.value as string[];
      return users.includes(context.userId ?? '');

    case 'tool':
      // 条件注释：按工具灰度
      const tools = canary.strategy.value as string[];
      return tools.includes(context.toolName ?? '');

    default:
      return false;
  }
}

/**
 * 获取灰度配置
 *
 * @param canaryId - 灰度发布 ID
 * @returns 目标配置（灰度版本）或基线配置
 *
 * @author lvdaxianerplus
 * @date 2026-04-22
 */
export function getCanaryConfig(canaryId: string, hitCanary: boolean): Config | null {
  const canary = activeCanaries.get(canaryId);
  if (!canary) {
    return null;
  }

  try {
    // 条件注释：命中灰度返回目标配置，否则返回基线配置
    const configContent = hitCanary ? canary.targetConfig : canary.baselineConfig;
    return JSON.parse(configContent) as Config;
  } catch (error) {
    logger.error('[灰度发布] Failed to parse canary config', { error, canaryId });
    return null;
  }
}

/**
 * 更新灰度发布状态
 *
 * @param canaryId - 灰度发布 ID
 * @param status - 新状态
 * @returns 是否成功更新
 *
 * @author lvdaxianerplus
 * @date 2026-04-22
 */
export function updateCanaryStatus(
  canaryId: string,
  status: CanaryRelease['status']
): boolean {
  const db = getDatabase();
  if (!db) {
    return false;
  }

  try {
    const update = db.prepare(`UPDATE ${CANARY_RELEASES_TABLE} SET status = ? WHERE id = ?`);
    update.run(status, canaryId);

    // 条件注释：更新活跃列表中的状态
    const canary = activeCanaries.get(canaryId);
    if (canary) {
      canary.status = status;

      // 条件注释：如果不是 running，从活跃列表移除
      if (status !== 'running') {
        activeCanaries.delete(canaryId);
      }
    }

    logger.info('[灰度发布] Canary status updated', { canaryId, status });

    return true;
  } catch (error) {
    logger.error('[灰度发布] Failed to update canary status', { error });
    return false;
  }
}

/**
 * 暂停灰度发布
 *
 * @param canaryId - 灰度发布 ID
 * @returns 是否成功暂停
 *
 * @author lvdaxianerplus
 * @date 2026-04-22
 */
export function pauseCanary(canaryId: string): boolean {
  return updateCanaryStatus(canaryId, 'paused');
}

/**
 * 恢复灰度发布
 *
 * @param canaryId - 灰度发布 ID
 * @returns 是否成功恢复
 *
 * @author lvdaxianerplus
 * @date 2026-04-22
 */
export function resumeCanary(canaryId: string): boolean {
  return updateCanaryStatus(canaryId, 'running');
}

/**
 * 完成灰度发布
 *
 * @param canaryId - 灰度发布 ID
 * @returns 是否成功完成
 *
 * @author lvdaxianerplus
 * @date 2026-04-22
 */
export function completeCanary(canaryId: string): boolean {
  return updateCanaryStatus(canaryId, 'completed');
}

/**
 * 回滚灰度发布
 *
 * @param canaryId - 灰度发布 ID
 * @returns 是否成功回滚
 *
 * @author lvdaxianerplus
 * @date 2026-04-22
 */
export function rollbackCanary(canaryId: string): boolean {
  return updateCanaryStatus(canaryId, 'rolled_back');
}

/**
 * 记录灰度指标
 *
 * @param canaryId - 灰度发布 ID
 * @param metrics - 灰度指标
 *
 * @author lvdaxianerplus
 * @date 2026-04-22
 */
export function recordCanaryMetrics(canaryId: string, metrics: CanaryMetrics): void {
  const db = getDatabase();
  if (!db) {
    return;
  }

  try {
    const insert = db.prepare(`
      INSERT INTO ${CANARY_METRICS_TABLE} (canary_id, timestamp, request_count, success_count, error_count, error_rate, avg_duration, p99_duration)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insert.run(
      canaryId,
      new Date().toISOString(),
      metrics.requestCount,
      metrics.successCount,
      metrics.errorCount,
      metrics.errorRate,
      metrics.avgDuration,
      metrics.p99Duration
    );
  } catch (error) {
    logger.error('[灰度发布] Failed to record canary metrics', { error });
  }
}

/**
 * 获取灰度发布指标
 *
 * @param canaryId - 灰度发布 ID
 * @param limit - 返回数量限制
 * @returns 指标列表
 *
 * @author lvdaxianerplus
 * @date 2026-04-22
 */
export function getCanaryMetrics(canaryId: string, limit: number = 100): CanaryMetrics[] {
  const db = getDatabase();
  if (!db) {
    return [];
  }

  try {
    const query = db.prepare(`
      SELECT * FROM ${CANARY_METRICS_TABLE} WHERE canary_id = ? ORDER BY timestamp DESC LIMIT ?
    `);
    const rows = query.all(canaryId, limit) as Array<{
      canary_id: string;
      timestamp: string;
      request_count: number;
      success_count: number;
      error_count: number;
      error_rate: number;
      avg_duration: number;
      p99_duration: number;
    }>;

    return rows.map(row => ({
      requestCount: row.request_count,
      successCount: row.success_count,
      errorCount: row.error_count,
      errorRate: row.error_rate,
      avgDuration: row.avg_duration,
      p99Duration: row.p99_duration,
    }));
  } catch (error) {
    logger.error('[灰度发布] Failed to get canary metrics', { error });
    return [];
  }
}

/**
 * 获取灰度发布列表
 *
 * @param status - 状态过滤（可选）
 * @returns 灰度发布列表
 *
 * @author lvdaxianerplus
 * @date 2026-04-22
 */
export function getCanaryList(status?: CanaryRelease['status']): CanaryRelease[] {
  const db = getDatabase();
  if (!db) {
    return Array.from(activeCanaries.values());
  }

  try {
    let sql = `SELECT * FROM ${CANARY_RELEASES_TABLE}`;
    if (status) {
      sql += ` WHERE status = '${status}'`;
    }
    sql += ' ORDER BY start_time DESC';

    const query = db.prepare(sql);
    const rows = query.all() as Array<{
      id: string;
      enabled: number;
      name: string;
      description: string | null;
      strategy_type: string;
      strategy_value: string;
      target_config: string;
      baseline_config: string;
      start_time: string;
      end_time: string | null;
      auto_rollback_threshold: number | null;
      status: string;
    }>;

    return rows.map(row => ({
      id: row.id,
      enabled: row.enabled === 1,
      name: row.name,
      description: row.description ?? '',
      strategy: {
        type: row.strategy_type as CanaryStrategy['type'],
        value: row.strategy_type === 'percentage'
          ? parseInt(row.strategy_value, 10)
          : JSON.parse(row.strategy_value),
      },
      targetConfig: row.target_config,
      baselineConfig: row.baseline_config,
      startTime: row.start_time,
      endTime: row.end_time ?? undefined,
      autoRollbackThreshold: row.auto_rollback_threshold ?? canaryOptions.defaultThreshold,
      status: row.status as CanaryRelease['status'],
    }));
  } catch (error) {
    logger.error('[灰度发布] Failed to get canary list', { error });
    return [];
  }
}

/**
 * 获取灰度发布详情
 *
 * @param canaryId - 灰度发布 ID
 * @returns 灰度发布详情
 *
 * @author lvdaxianerplus
 * @date 2026-04-22
 */
export function getCanaryById(canaryId: string): CanaryRelease | null {
  const canary = activeCanaries.get(canaryId);
  if (canary) {
    return canary;
  }

  const db = getDatabase();
  if (!db) {
    return null;
  }

  try {
    const query = db.prepare(`SELECT * FROM ${CANARY_RELEASES_TABLE} WHERE id = ?`);
    const row = query.get(canaryId) as {
      id: string;
      enabled: number;
      name: string;
      description: string | null;
      strategy_type: string;
      strategy_value: string;
      target_config: string;
      baseline_config: string;
      start_time: string;
      end_time: string | null;
      auto_rollback_threshold: number | null;
      status: string;
    } | undefined;

    if (!row) {
      return null;
    }

    return {
      id: row.id,
      enabled: row.enabled === 1,
      name: row.name,
      description: row.description ?? '',
      strategy: {
        type: row.strategy_type as CanaryStrategy['type'],
        value: row.strategy_type === 'percentage'
          ? parseInt(row.strategy_value, 10)
          : JSON.parse(row.strategy_value),
      },
      targetConfig: row.target_config,
      baselineConfig: row.baseline_config,
      startTime: row.start_time,
      endTime: row.end_time ?? undefined,
      autoRollbackThreshold: row.auto_rollback_threshold ?? canaryOptions.defaultThreshold,
      status: row.status as CanaryRelease['status'],
    };
  } catch (error) {
    logger.error('[灰度发布] Failed to get canary by id', { error });
    return null;
  }
}

/**
 * 删除灰度发布
 *
 * @param canaryId - 灰度发布 ID
 * @returns 是否成功删除
 *
 * @author lvdaxianerplus
 * @date 2026-04-22
 */
export function deleteCanary(canaryId: string): boolean {
  const db = getDatabase();
  if (!db) {
    return false;
  }

  try {
    // 条件注释：删除灰度发布记录
    const deleteCanary = db.prepare(`DELETE FROM ${CANARY_RELEASES_TABLE} WHERE id = ?`);
    deleteCanary.run(canaryId);

    // 条件注释：删除关联的指标记录
    const deleteMetrics = db.prepare(`DELETE FROM ${CANARY_METRICS_TABLE} WHERE canary_id = ?`);
    deleteMetrics.run(canaryId);

    // 条件注释：从活跃列表移除
    activeCanaries.delete(canaryId);

    logger.info('[灰度发布] Canary deleted', { canaryId });

    return true;
  } catch (error) {
    logger.error('[灰度发布] Failed to delete canary', { error });
    return false;
  }
}

/**
 * 获取灰度发布统计
 *
 * @returns 统计数据
 *
 * @author lvdaxianerplus
 * @date 2026-04-22
 */
export function getCanaryStats(): {
  enabled: boolean;
  activeCount: number;
  totalCount: number;
  runningCount: number;
  pausedCount: number;
  completedCount: number;
  rolledBackCount: number;
} {
  const db = getDatabase();

  let totalCount = 0;
  let runningCount = 0;
  let pausedCount = 0;
  let completedCount = 0;
  let rolledBackCount = 0;

  if (db) {
    try {
      const countQuery = db.prepare(`SELECT status, COUNT(*) as count FROM ${CANARY_RELEASES_TABLE} GROUP BY status`);
      const rows = countQuery.all() as Array<{ status: string; count: number }>;

      for (const row of rows) {
        totalCount += row.count;
        switch (row.status) {
          case 'running':
            runningCount = row.count;
            break;
          case 'paused':
            pausedCount = row.count;
            break;
          case 'completed':
            completedCount = row.count;
            break;
          case 'rolled_back':
            rolledBackCount = row.count;
            break;
        }
      }
    } catch (error) {
      logger.error('[灰度发布] Failed to get canary stats', { error });
    }
  }

  return {
    enabled: canaryOptions.enabled,
    activeCount: activeCanaries.size,
    totalCount,
    runningCount,
    pausedCount,
    completedCount,
    rolledBackCount,
  };
}

/**
 * 字符串哈希函数
 *
 * @param str - 字符串
 * @returns 哈希值
 *
 * @author lvdaxianerplus
 * @date 2026-04-22
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}