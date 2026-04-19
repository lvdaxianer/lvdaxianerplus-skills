/**
 * Cache 路由处理器
 *
 * Features:
 * - GET /api/cache - 获取缓存统计
 * - DELETE /api/cache - 清空所有缓存
 * - GET /api/cache/entries - 获取缓存数据内容
 * - DELETE /api/cache/:toolName - 清空指定工具缓存
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */

import type { IncomingMessage, ServerResponse } from 'http';
import type { RouteHandler } from '../router.js';
import {
  clearCache,
  clearCacheByTool,
  getCacheStats,
  getAllCacheEntries,
} from '../../features/cache.js';
import {
  sendJsonResponse,
  sendMethodNotAllowedResponse,
} from './response.js';

/**
 * Cache 统计处理器（GET）
 *
 * @param _req - HTTP 请求对象
 * @param res - HTTP 响应对象
 * @returns 是否处理完成
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
export async function cacheStatsHandler(
  _req: IncomingMessage,
  res: ServerResponse
): Promise<boolean> {
  const stats = getCacheStats();
  sendJsonResponse(res, 200, stats);
  return true;
}

/**
 * Cache 清空处理器（DELETE）
 *
 * @param _req - HTTP 请求对象
 * @param res - HTTP 响应对象
 * @returns 是否处理完成
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
export async function cacheClearHandler(
  _req: IncomingMessage,
  res: ServerResponse
): Promise<boolean> {
  clearCache();
  sendJsonResponse(res, 200, { success: true, message: 'All cache cleared' });
  return true;
}

/**
 * Cache 主路由处理器（根据方法分发）
 *
 * @param req - HTTP 请求对象
 * @param res - HTTP 响应对象
 * @returns 是否处理完成
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
export async function cacheHandler(
  req: IncomingMessage,
  res: ServerResponse
): Promise<boolean> {
  const method = req.method ?? 'GET';

  // 条件注释：GET 方法返回统计，DELETE 方法清空缓存，其他方法返回 405
  if (method === 'GET') {
    return cacheStatsHandler(req, res);
  } else if (method === 'DELETE') {
    return cacheClearHandler(req, res);
  } else {
    sendMethodNotAllowedResponse(res);
    return true;
  }
}

/**
 * Cache 数据内容处理器
 *
 * @param _req - HTTP 请求对象
 * @param res - HTTP 响应对象
 * @returns 是否处理完成
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
export async function cacheEntriesHandler(
  _req: IncomingMessage,
  res: ServerResponse
): Promise<boolean> {
  const entries = getAllCacheEntries();
  sendJsonResponse(res, 200, entries);
  return true;
}

/**
 * Cache 按工具清空处理器
 *
 * @param req - HTTP 请求对象
 * @param res - HTTP 响应对象
 * @param params - 路由参数（包含 toolName）
 * @returns 是否处理完成
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
export async function cacheByToolHandler(
  _req: IncomingMessage,
  res: ServerResponse,
  params?: Record<string, string>
): Promise<boolean> {
  const toolName = params?.['1'] ?? '';
  // 条件注释：工具名存在时清空，不存在时返回错误
  if (toolName) {
    const cleared = clearCacheByTool(toolName);
    sendJsonResponse(res, 200, {
      success: true,
      cleared,
      message: `Cleared ${cleared} cache entries for tool: ${toolName}`,
    });
    return true;
  } else {
    sendJsonResponse(res, 400, { success: false, error: 'Tool name required' });
    return true;
  }
}

/**
 * Cache 路由策略配置
 *
 * @returns 路由策略数组
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
export function getCacheRoutes(): Array<{
  name: string;
  path: string | RegExp;
  matchType: 'exact' | 'regex';
  methods?: string[];
  handler: RouteHandler;
  priority: number;
}> {
  return [
    {
      name: 'cache',
      path: '/api/cache',
      matchType: 'exact',
      handler: cacheHandler,
      priority: 90,
    },
    {
      name: 'cache-entries',
      path: '/api/cache/entries',
      matchType: 'exact',
      methods: ['GET'],
      handler: cacheEntriesHandler,
      priority: 91, // 优先级高于 cache-by-tool
    },
    {
      name: 'cache-by-tool',
      path: /^\/api\/cache\/([^/]+)$/,
      matchType: 'regex',
      methods: ['DELETE'],
      handler: cacheByToolHandler,
      priority: 85,
    },
  ];
}