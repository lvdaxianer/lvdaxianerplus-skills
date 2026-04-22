/**
 * Tool Cache 路由处理器
 *
 * Features:
 * - GET /api/cache/tools - 获取所有工具缓存配置
 * - PUT /api/cache/tools/:toolName - 更新单个工具缓存配置
 * - DELETE /api/cache/tools/:toolName - 删除单个工具缓存配置
 * - 首次启动时同步配置文件到 SQLite
 * - 后续启动时使用 SQLite 配置（忽略配置文件）
 *
 * @author lvdaxianerplus
 * @date 2026-04-21
 */

import type { IncomingMessage, ServerResponse } from 'http';
import type { RouteHandler } from '../router.js';
import type { Config, ToolConfig, CacheConfig } from '../../config/types.js';
import { getDatabase } from '../../database/connection.js';
import Database from 'better-sqlite3';
import {
  sendJsonResponse,
  sendBadRequestResponse,
  sendMethodNotAllowedResponse,
  parseJsonBody,
} from './response.js';
import { logger } from '../../middleware/logger.js';

/**
 * 工具缓存配置类型
 *
 * @param enabled - 是否启用缓存
 * @param ttl - 缓存有效期（毫秒）
 *
 * @author lvdaxianerplus
 * @date 2026-04-21
 */
interface ToolCacheConfig {
  enabled: boolean;
  ttl?: number;
}

/**
 * 内存缓存的工具缓存配置
 *
 * @author lvdaxianerplus
 * @date 2026-04-21
 */
let toolCacheConfigs: Record<string, ToolCacheConfig> = {};

/**
 * 从数据库加载工具缓存配置
 *
 * 优先级机制：
 * 1. 首次启动（数据库无配置）：同步配置文件到 SQLite
 * 2. 后续启动（数据库有配置）：使用 SQLite 配置，忽略配置文件
 *
 * @param config - 全局配置（用于首次同步）
 *
 * @author lvdaxianerplus
 * @date 2026-04-21
 */
export function loadToolCacheConfigs(config?: Config): void {
  const db = getDatabase();

  // 条件注释：数据库不可用时跳过加载
  if (!db) {
    logger.warn('[工具缓存] Database not available, using memory only');
    return;
  } else {
    // 数据库可用，检查是否有配置
    try {
      const countRow = db.prepare(`
        SELECT COUNT(*) as count FROM tool_cache_configs
      `).get() as { count: number };

      // 条件注释：数据库中没有配置，首次启动时同步配置文件
      if (countRow.count === 0 && config) {
        logger.info('[工具缓存] Database empty, syncing from config file');
        syncToolCacheConfigsFromConfigFile(config, db);
      } else {
        // 条件注释：数据库中有配置，直接使用数据库配置（忽略配置文件）
        logger.info('[工具缓存] Using database configs, ignoring config file');
      }

      // 从数据库加载配置到内存
      const rows = db.prepare(`
        SELECT tool_name, enabled, ttl
        FROM tool_cache_configs
      `).all() as Array<{
        tool_name: string;
        enabled: number;
        ttl: number;
      }>;

      for (const row of rows) {
        toolCacheConfigs[row.tool_name] = {
          enabled: row.enabled === 1,
          ttl: row.ttl
        };
      }

      logger.info('[工具缓存] Loaded configs from database', { count: rows.length });
    } catch (error) {
      logger.error('[工具缓存] Failed to load configs', { error });
    }
  }
}

/**
 * 同步配置文件中的工具缓存配置到 SQLite
 *
 * 条件注释：仅在数据库无配置时调用（首次启动）
 *
 * @param config - 全局配置
 * @param db - 数据库连接（已确保不为 null）
 *
 * @author lvdaxianerplus
 * @date 2026-04-22
 */
function syncToolCacheConfigsFromConfigFile(config: Config, db: Database.Database): void {
  // 条件注释：遍历所有工具，检查是否有 cache 配置
  for (const [toolName, toolConfig] of Object.entries(config.tools)) {
    // 条件注释：工具配置中有 cache 字段时同步到数据库
    if (toolConfig.cache && toolConfig.cache.enabled) {
      const enabled = toolConfig.cache.enabled ? 1 : 0;
      const ttl = toolConfig.cache.ttl ?? 60000;

      try {
        db.prepare(`
          INSERT INTO tool_cache_configs (tool_name, enabled, ttl, created_at, updated_at)
          VALUES (?, ?, ?, datetime('now'), datetime('now'))
        `).run(toolName, enabled, ttl);

        logger.info('[工具缓存] Synced tool cache config from config file', { toolName, enabled, ttl });
      } catch (error) {
        logger.error('[工具缓存] Failed to sync tool cache config', { error, toolName });
      }
    } else {
      // 工具配置中无 cache 字段，跳过
    }
  }
}

/**
 * 检查工具是否启用缓存
 *
 * @param toolName - 工具名称
 * @returns 是否启用缓存
 *
 * @author lvdaxianerplus
 * @date 2026-04-21
 */
export function isToolCacheEnabled(toolName: string): boolean {
  return toolCacheConfigs[toolName]?.enabled ?? false;
}

/**
 * 获取工具缓存 TTL
 *
 * @param toolName - 工具名称
 * @returns 缓存 TTL（毫秒）
 *
 * @author lvdaxianerplus
 * @date 2026-04-21
 */
export function getToolCacheTtl(toolName: string): number | undefined {
  return toolCacheConfigs[toolName]?.ttl;
}

/**
 * 保存工具缓存配置到数据库
 *
 * @param toolName - 工具名称
 * @param config - 缓存配置
 *
 * @author lvdaxianerplus
 * @date 2026-04-21
 */
function saveToolCacheConfig(toolName: string, config: ToolCacheConfig): void {
  const db = getDatabase();

  // 更新内存缓存
  toolCacheConfigs[toolName] = config;

  // 条件注释：数据库不可用时仅更新内存
  if (!db) {
    logger.warn('[工具缓存] Database not available, only cached in memory');
    return;
  } else {
    // 数据库可用，持久化配置
    try {
      const enabled = config.enabled ? 1 : 0;
      const ttl = config.ttl ?? 60000;

      db.prepare(`
        INSERT OR REPLACE INTO tool_cache_configs (tool_name, enabled, ttl, updated_at)
        VALUES (?, ?, ?, datetime('now'))
      `).run(toolName, enabled, ttl);

      logger.info('[工具缓存] Saved config to database', { toolName, enabled, ttl });
    } catch (error) {
      logger.error('[工具缓存] Failed to save config', { error, toolName });
    }
  }
}

/**
 * 删除工具缓存配置
 *
 * @param toolName - 工具名称
 *
 * @author lvdaxianerplus
 * @date 2026-04-21
 */
function deleteToolCacheConfig(toolName: string): void {
  // 删除内存缓存
  delete toolCacheConfigs[toolName];

  const db = getDatabase();

  // 条件注释：数据库可用时删除持久化配置
  if (db) {
    try {
      db.prepare('DELETE FROM tool_cache_configs WHERE tool_name = ?').run(toolName);
      logger.info('[工具缓存] Deleted config from database', { toolName });
    } catch (error) {
      logger.error('[工具缓存] Failed to delete config', { error, toolName });
    }
  } else {
    // 数据库不可用，仅删除内存缓存
  }
}

/**
 * 获取所有工具缓存配置处理器
 *
 * @param req - HTTP 请求对象
 * @param res - HTTP 响应对象
 * @returns 是否处理完成
 *
 * @author lvdaxianerplus
 * @date 2026-04-21
 */
export async function toolCacheListHandler(
  _req: IncomingMessage,
  res: ServerResponse
): Promise<boolean> {
  sendJsonResponse(res, 200, {
    configs: toolCacheConfigs
  });
  return true;
}

/**
 * 单个工具缓存配置处理器（根据方法分发）
 *
 * @param req - HTTP 请求对象
 * @param res - HTTP 响应对象
 * @param params - 路由参数
 * @returns 是否处理完成
 *
 * @author lvdaxianerplus
 * @date 2026-04-21
 */
export async function toolCacheHandler(
  req: IncomingMessage,
  res: ServerResponse,
  params?: Record<string, string>
): Promise<boolean> {
  const toolName = params?.['1'] ?? '';

  // 条件注释：工具名不存在时返回错误
  if (!toolName) {
    sendBadRequestResponse(res, 'Tool name required');
    return true;
  } else {
    const method = req.method ?? 'GET';

    // 条件注释：根据方法分发到不同处理器
    if (method === 'PUT') {
      return toolCachePutHandler(req, res, toolName);
    } else if (method === 'DELETE') {
      return toolCacheDeleteHandler(req, res, toolName);
    } else if (method === 'GET') {
      return toolCacheGetHandler(req, res, toolName);
    } else {
      sendMethodNotAllowedResponse(res);
      return true;
    }
  }
}

/**
 * 获取单个工具缓存配置处理器
 *
 * @param req - HTTP 请求对象
 * @param res - HTTP 响应对象
 * @param toolName - 工具名称
 * @returns 是否处理完成
 *
 * @author lvdaxianerplus
 * @date 2026-04-21
 */
async function toolCacheGetHandler(
  _req: IncomingMessage,
  res: ServerResponse,
  toolName: string
): Promise<boolean> {
  const config = toolCacheConfigs[toolName];

  // 条件注释：配置不存在时返回默认配置，存在时返回实际配置
  if (!config) {
    sendJsonResponse(res, 200, {
      toolName,
      enabled: false,
      ttl: 60000,
      message: 'No cache config for this tool'
    });
    return true;
  } else {
    sendJsonResponse(res, 200, {
      toolName,
      ...config
    });
    return true;
  }
}

/**
 * 更新单个工具缓存配置处理器
 *
 * @param req - HTTP 请求对象
 * @param res - HTTP 响应对象
 * @param toolName - 工具名称
 * @returns 是否处理完成
 *
 * @author lvdaxianerplus
 * @date 2026-04-21
 */
async function toolCachePutHandler(
  req: IncomingMessage,
  res: ServerResponse,
  toolName: string
): Promise<boolean> {
  try {
    const body = await parseJsonBody(req);

    // 条件注释：请求体不存在时返回错误
    if (!body) {
      sendBadRequestResponse(res, 'Request body required');
      return true;
    } else {
      const config = body as ToolCacheConfig;

      // 条件注释：enabled 字段不存在时返回错误
      if (typeof config.enabled !== 'boolean') {
        sendBadRequestResponse(res, 'enabled must be a boolean');
        return true;
      } else {
        // 验证通过，保存配置
        saveToolCacheConfig(toolName, config);

        logger.info('[工具缓存 API] Configuration saved', { toolName, enabled: config.enabled });

        sendJsonResponse(res, 200, {
          success: true,
          message: 'Tool cache config saved',
          toolName,
          config
        });
        return true;
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    sendBadRequestResponse(res, errorMessage);
    return true;
  }
}

/**
 * 删除单个工具缓存配置处理器
 *
 * @param req - HTTP 请求对象
 * @param res - HTTP 响应对象
 * @param toolName - 工具名称
 * @returns 是否处理完成
 *
 * @author lvdaxianerplus
 * @date 2026-04-21
 */
async function toolCacheDeleteHandler(
  _req: IncomingMessage,
  res: ServerResponse,
  toolName: string
): Promise<boolean> {
  deleteToolCacheConfig(toolName);

  sendJsonResponse(res, 200, {
    success: true,
    message: 'Tool cache config deleted',
    toolName
  });
  return true;
}

/**
 * 创建 Tool Cache 路由处理器工厂函数
 *
 * @returns Tool Cache 路由策略配置
 *
 * @author lvdaxianerplus
 * @date 2026-04-21
 */
export function getToolCacheRoutes(): Array<{
  name: string;
  path: string | RegExp;
  matchType: 'exact' | 'regex';
  methods?: string[];
  handler: RouteHandler;
  priority: number;
}> {
  return [
    {
      name: 'tool-cache-list',
      path: '/api/cache/tools',
      matchType: 'exact',
      methods: ['GET'],
      handler: toolCacheListHandler,
      priority: 80,
    },
    {
      name: 'tool-cache',
      path: /^\/api\/cache\/tools\/([^/]+)$/,
      matchType: 'regex',
      handler: toolCacheHandler,
      priority: 81,
    },
  ];
}