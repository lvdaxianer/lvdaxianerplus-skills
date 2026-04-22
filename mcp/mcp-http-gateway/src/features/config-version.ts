/**
 * 配置版本控制模块
 *
 * Features:
 * - 配置变更记录：版本号、变更内容、变更时间、变更人
 * - 配置回滚：支持回滚到指定版本
 * - 配置比较：比较不同版本的差异
 * - 配置导出：导出指定版本的配置
 *
 * @author lvdaxianerplus
 * @date 2026-04-22
 */

import type { Config } from '../config/types.js';
import { logger } from '../middleware/logger.js';
import { getDatabase } from '../database/connection.js';
import { loadConfig } from '../config/loader.js';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

/**
 * 配置版本记录类型
 *
 * @param id - 版本 ID
 * @param version - 版本号（自增）
 * @param configPath - 配置文件路径
 * @param configContent - 配置内容（JSON）
 * @param changeType - 变更类型：create/update/rollback/import
 * @param changeDescription - 变更描述
 * @param changedBy - 变更人
 * @param timestamp - 变更时间
 * @param checksum - 配置内容校验和
 *
 * @author lvdaxianerplus
 * @date 2026-04-22
 */
export interface ConfigVersion {
  id: string;
  version: number;
  configPath: string;
  configContent: string;
  changeType: 'create' | 'update' | 'rollback' | 'import';
  changeDescription: string;
  changedBy: string;
  timestamp: string;
  checksum: string;
}

/**
 * 配置版本控制选项
 *
 * @param enabled - 是否启用版本控制
 * @param maxVersions - 最大版本数（默认 50）
 * @param backupDir - 备份目录（默认 ./backups/config）
 *
 * @author lvdaxianerplus
 * @date 2026-04-22
 */
export interface ConfigVersionOptions {
  enabled: boolean;
  maxVersions?: number;
  backupDir?: string;
}

const CONFIG_VERSIONS_TABLE = 'config_versions';
let versionOptions: ConfigVersionOptions = { enabled: true };

/**
 * 初始化配置版本控制
 *
 * @param options - 版本控制选项
 *
 * @author lvdaxianerplus
 * @date 2026-04-22
 */
export function initConfigVersion(options: ConfigVersionOptions): void {
  versionOptions = {
    enabled: options.enabled ?? true,
    maxVersions: options.maxVersions ?? 50,
    backupDir: options.backupDir ?? './backups/config',
  };

  // 条件注释：版本控制启用时创建数据库表
  if (versionOptions.enabled) {
    createConfigVersionsTable();
    logger.info('[配置版本] Config version control initialized', {
      enabled: versionOptions.enabled,
      maxVersions: versionOptions.maxVersions,
    });
  } else {
    logger.info('[配置版本] Config version control disabled');
  }
}

/**
 * 创建配置版本表
 *
 * @author lvdaxianerplus
 * @date 2026-04-22
 */
function createConfigVersionsTable(): void {
  const db = getDatabase();
  if (!db) {
    logger.warn('[配置版本] Database not connected, cannot create config_versions table');
    return;
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS ${CONFIG_VERSIONS_TABLE} (
      id TEXT PRIMARY KEY,
      version INTEGER NOT NULL UNIQUE,
      config_path TEXT NOT NULL,
      config_content TEXT NOT NULL,
      change_type TEXT NOT NULL,
      change_description TEXT,
      changed_by TEXT,
      timestamp TEXT NOT NULL,
      checksum TEXT NOT NULL
    )
  `);

  // 创建索引
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_config_version ON ${CONFIG_VERSIONS_TABLE}(version);
    CREATE INDEX IF NOT EXISTS idx_config_timestamp ON ${CONFIG_VERSIONS_TABLE}(timestamp);
    CREATE INDEX IF NOT EXISTS idx_config_path ON ${CONFIG_VERSIONS_TABLE}(config_path);
  `);

  logger.info('[配置版本] Config versions table created');
}

/**
 * 记录配置变更
 *
 * @param configPath - 配置文件路径
 * @param configContent - 配置内容
 * @param changeType - 变更类型
 * @param changeDescription - 变更描述
 * @param changedBy - 变更人（可选）
 * @returns 版本记录
 *
 * @author lvdaxianerplus
 * @date 2026-04-22
 */
export function recordConfigChange(
  configPath: string,
  configContent: string,
  changeType: ConfigVersion['changeType'],
  changeDescription: string,
  changedBy?: string
): ConfigVersion | null {
  // 条件注释：版本控制未启用时跳过记录
  if (!versionOptions.enabled) {
    return null;
  }

  const db = getDatabase();
  if (!db) {
    logger.warn('[配置版本] Database not connected, cannot record config change');
    return null;
  }

  try {
    // 条件注释：获取当前最大版本号
    const maxVersionQuery = db.prepare(`SELECT MAX(version) as max_version FROM ${CONFIG_VERSIONS_TABLE}`);
    const result = maxVersionQuery.get() as { max_version: number | null };
    const nextVersion = (result?.max_version ?? 0) + 1;

    // 条件注释：生成校验和
    const checksum = generateChecksum(configContent);

    // 条件注释：生成版本 ID
    const id = `config-v${nextVersion}-${Date.now()}`;

    const timestamp = new Date().toISOString();

    // 条件注释：插入版本记录
    const insert = db.prepare(`
      INSERT INTO ${CONFIG_VERSIONS_TABLE} (id, version, config_path, config_content, change_type, change_description, changed_by, timestamp, checksum)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insert.run(
      id,
      nextVersion,
      configPath,
      configContent,
      changeType,
      changeDescription,
      changedBy ?? 'system',
      timestamp,
      checksum
    );

    // 条件注释：清理超过最大版本数的旧版本
    cleanOldVersions();

    logger.info('[配置版本] Config change recorded', {
      version: nextVersion,
      changeType,
      configPath,
    });

    return {
      id,
      version: nextVersion,
      configPath,
      configContent,
      changeType,
      changeDescription,
      changedBy: changedBy ?? 'system',
      timestamp,
      checksum,
    };
  } catch (error) {
    logger.error('[配置版本] Failed to record config change', { error });
    return null;
  }
}

/**
 * 获取配置版本列表
 *
 * @param limit - 返回数量限制
 * @param configPath - 配置文件路径过滤（可选）
 * @returns 版本列表
 *
 * @author lvdaxianerplus
 * @date 2026-04-22
 */
export function getConfigVersions(limit: number = 20, configPath?: string): ConfigVersion[] {
  const db = getDatabase();
  if (!db) {
    return [];
  }

  try {
    let sql = `SELECT * FROM ${CONFIG_VERSIONS_TABLE}`;
    const params: (string | number)[] = [];

    if (configPath) {
      sql += ' WHERE config_path = ?';
      params.push(configPath);
    }

    sql += ' ORDER BY version DESC LIMIT ?';
    params.push(limit);

    const query = db.prepare(sql);
    const rows = query.all(...params) as Array<{
      id: string;
      version: number;
      config_path: string;
      config_content: string;
      change_type: string;
      change_description: string | null;
      changed_by: string | null;
      timestamp: string;
      checksum: string;
    }>;

    return rows.map(row => ({
      id: row.id,
      version: row.version,
      configPath: row.config_path,
      configContent: row.config_content,
      changeType: row.change_type as ConfigVersion['changeType'],
      changeDescription: row.change_description ?? '',
      changedBy: row.changed_by ?? 'system',
      timestamp: row.timestamp,
      checksum: row.checksum,
    }));
  } catch (error) {
    logger.error('[配置版本] Failed to get config versions', { error });
    return [];
  }
}

/**
 * 获取指定版本配置
 *
 * @param version - 版本号
 * @returns 版本记录
 *
 * @author lvdaxianerplus
 * @date 2026-04-22
 */
export function getConfigByVersion(version: number): ConfigVersion | null {
  const db = getDatabase();
  if (!db) {
    return null;
  }

  try {
    const query = db.prepare(`SELECT * FROM ${CONFIG_VERSIONS_TABLE} WHERE version = ?`);
    const row = query.get(version) as {
      id: string;
      version: number;
      config_path: string;
      config_content: string;
      change_type: string;
      change_description: string | null;
      changed_by: string | null;
      timestamp: string;
      checksum: string;
    } | undefined;

    if (!row) {
      return null;
    }

    return {
      id: row.id,
      version: row.version,
      configPath: row.config_path,
      configContent: row.config_content,
      changeType: row.change_type as ConfigVersion['changeType'],
      changeDescription: row.change_description ?? '',
      changedBy: row.changed_by ?? 'system',
      timestamp: row.timestamp,
      checksum: row.checksum,
    };
  } catch (error) {
    logger.error('[配置版本] Failed to get config by version', { error, version });
    return null;
  }
}

/**
 * 回滚配置到指定版本
 *
 * @param version - 目标版本号
 * @param configPath - 配置文件路径
 * @returns 是否成功回滚
 *
 * @author lvdaxianerplus
 * @date 2026-04-22
 */
export function rollbackConfig(version: number, configPath: string): boolean {
  // 条件注释：获取目标版本配置
  const targetVersion = getConfigByVersion(version);
  if (!targetVersion) {
    logger.error('[配置版本] Target version not found', { version });
    return false;
  }

  try {
    // 条件注释：写入配置文件
    writeFileSync(configPath, targetVersion.configContent, 'utf-8');

    // 条件注释：记录回滚操作
    recordConfigChange(
      configPath,
      targetVersion.configContent,
      'rollback',
      `Rollback to version ${version}`,
      'system'
    );

    logger.info('[配置版本] Config rolled back successfully', {
      fromVersion: 'current',
      toVersion: version,
      configPath,
    });

    return true;
  } catch (error) {
    logger.error('[配置版本] Failed to rollback config', { error, version });
    return false;
  }
}

/**
 * 比较两个版本配置差异
 *
 * @param version1 - 版本1
 * @param version2 - 版本2
 * @returns 差异描述
 *
 * @author lvdaxianerplus
 * @date 2026-04-22
 */
export function compareConfigVersions(version1: number, version2: number): {
  version1: ConfigVersion | null;
  version2: ConfigVersion | null;
  differences: Array<{ path: string; oldValue: unknown; newValue: unknown }>;
} | null {
  const v1 = getConfigByVersion(version1);
  const v2 = getConfigByVersion(version2);

  if (!v1 || !v2) {
    return null;
  }

  try {
    // 条件注释：解析配置内容
    const config1 = JSON.parse(v1.configContent);
    const config2 = JSON.parse(v2.configContent);

    // 条件注释：比较差异
    const differences = findDifferences(config1, config2);

    return {
      version1: v1,
      version2: v2,
      differences,
    };
  } catch (error) {
    logger.error('[配置版本] Failed to compare configs', { error });
    return null;
  }
}

/**
 * 查找两个对象的差异
 *
 * @param obj1 - 对象1
 * @param obj2 - 对象2
 * @param path - 当前路径
 * @returns 差异列表
 *
 * @author lvdaxianerplus
 * @date 2026-04-22
 */
function findDifferences(
  obj1: Record<string, unknown>,
  obj2: Record<string, unknown>,
  path: string = ''
): Array<{ path: string; oldValue: unknown; newValue: unknown }> {
  const differences: Array<{ path: string; oldValue: unknown; newValue: unknown }> = [];

  // 条件注释：遍历对象1的所有键
  for (const key of Object.keys(obj1)) {
    const currentPath = path ? `${path}.${key}` : key;

    // 条件注释：检查键是否存在于对象2
    if (!(key in obj2)) {
      differences.push({
        path: currentPath,
        oldValue: obj1[key],
        newValue: undefined,
      });
      continue;
    }

    // 条件注释：比较值类型
    const val1 = obj1[key];
    const val2 = obj2[key];

    if (typeof val1 !== typeof val2) {
      differences.push({
        path: currentPath,
        oldValue: val1,
        newValue: val2,
      });
      continue;
    }

    // 条件注释：如果是对象，递归比较
    if (typeof val1 === 'object' && val1 !== null && val2 !== null) {
      const nestedDiffs = findDifferences(
        val1 as Record<string, unknown>,
        val2 as Record<string, unknown>,
        currentPath
      );
      differences.push(...nestedDiffs);
      continue;
    }

    // 条件注释：比较值
    if (val1 !== val2) {
      differences.push({
        path: currentPath,
        oldValue: val1,
        newValue: val2,
      });
    }
  }

  // 条件注释：检查对象2中新增的键
  for (const key of Object.keys(obj2)) {
    if (!(key in obj1)) {
      const currentPath = path ? `${path}.${key}` : key;
      differences.push({
        path: currentPath,
        oldValue: undefined,
        newValue: obj2[key],
      });
    }
  }

  return differences;
}

/**
 * 导出配置到文件
 *
 * @param version - 版本号
 * @param outputPath - 输出文件路径
 * @returns 是否成功导出
 *
 * @author lvdaxianerplus
 * @date 2026-04-22
 */
export function exportConfigVersion(version: number, outputPath: string): boolean {
  const targetVersion = getConfigByVersion(version);
  if (!targetVersion) {
    logger.error('[配置版本] Target version not found for export', { version });
    return false;
  }

  try {
    writeFileSync(outputPath, targetVersion.configContent, 'utf-8');
    logger.info('[配置版本] Config exported successfully', { version, outputPath });
    return true;
  } catch (error) {
    logger.error('[配置版本] Failed to export config', { error, version });
    return false;
  }
}

/**
 * 导入配置并创建新版本
 *
 * @param inputPath - 输入文件路径
 * @param configPath - 目标配置文件路径
 * @param changeDescription - 变更描述
 * @returns 版本记录
 *
 * @author lvdaxianerplus
 * @date 2026-04-22
 */
export function importConfigVersion(
  inputPath: string,
  configPath: string,
  changeDescription: string
): ConfigVersion | null {
  try {
    // 条件注释：读取配置文件
    const configContent = readFileSync(inputPath, 'utf-8');

    // 条件注释：验证配置格式
    JSON.parse(configContent); // 验证是否为有效 JSON

    // 条件注释：写入目标配置文件
    writeFileSync(configPath, configContent, 'utf-8');

    // 条件注释：记录导入操作
    const version = recordConfigChange(
      configPath,
      configContent,
      'import',
      changeDescription,
      'system'
    );

    logger.info('[配置版本] Config imported successfully', { inputPath, configPath });

    return version;
  } catch (error) {
    logger.error('[配置版本] Failed to import config', { error, inputPath });
    return null;
  }
}

/**
 * 获取版本控制统计
 *
 * @returns 统计数据
 *
 * @author lvdaxianerplus
 * @date 2026-04-22
 */
export function getConfigVersionStats(): {
  enabled: boolean;
  totalVersions: number;
  maxVersions: number;
  lastVersion: number | null;
  lastChangeTime: string | null;
} {
  const db = getDatabase();

  let totalVersions = 0;
  let lastVersion: number | null = null;
  let lastChangeTime: string | null = null;

  if (db) {
    try {
      const countQuery = db.prepare(`SELECT COUNT(*) as count FROM ${CONFIG_VERSIONS_TABLE}`);
      totalVersions = (countQuery.get() as { count: number })?.count ?? 0;

      const lastQuery = db.prepare(`
        SELECT version, timestamp FROM ${CONFIG_VERSIONS_TABLE} ORDER BY version DESC LIMIT 1
      `);
      const lastRow = lastQuery.get() as { version: number; timestamp: string } | undefined;
      lastVersion = lastRow?.version ?? null;
      lastChangeTime = lastRow?.timestamp ?? null;
    } catch (error) {
      logger.error('[配置版本] Failed to get stats', { error });
    }
  }

  return {
    enabled: versionOptions.enabled,
    totalVersions,
    maxVersions: versionOptions.maxVersions ?? 50,
    lastVersion,
    lastChangeTime,
  };
}

/**
 * 清理超过最大版本数的旧版本
 *
 * @author lvdaxianerplus
 * @date 2026-04-22
 */
function cleanOldVersions(): void {
  const db = getDatabase();
  if (!db) {
    return;
  }

  const maxVersions = versionOptions.maxVersions ?? 50;

  try {
    // 条件注释：检查是否超过最大版本数
    const countQuery = db.prepare(`SELECT COUNT(*) as count FROM ${CONFIG_VERSIONS_TABLE}`);
    const count = (countQuery.get() as { count: number })?.count ?? 0;

    if (count <= maxVersions) {
      return;
    }

    // 条件注释：删除最旧的版本
    const deleteCount = count - maxVersions;
    const deleteQuery = db.prepare(`
      DELETE FROM ${CONFIG_VERSIONS_TABLE} WHERE id IN (
        SELECT id FROM ${CONFIG_VERSIONS_TABLE} ORDER BY version ASC LIMIT ?
      )
    `);
    deleteQuery.run(deleteCount);

    logger.info('[配置版本] Cleaned old config versions', { deleteCount, maxVersions });
  } catch (error) {
    logger.error('[配置版本] Failed to clean old versions', { error });
  }
}

/**
 * 生成配置内容校验和
 *
 * @param content - 配置内容
 * @returns 校验和
 *
 * @author lvdaxianerplus
 * @date 2026-04-22
 */
function generateChecksum(content: string): string {
  // 条件注释：简单校验和（基于字符码点求和）
  let sum = 0;
  for (let i = 0; i < content.length; i++) {
    sum += content.charCodeAt(i);
  }
  return sum.toString(16);
}