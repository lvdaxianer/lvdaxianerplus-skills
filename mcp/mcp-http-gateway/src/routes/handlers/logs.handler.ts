/**
 * Logs 路由处理器
 *
 * Features:
 * - GET /api/logs - 查询请求日志
 * - GET /api/logs/paginated - 分页查询日志
 * - GET /api/errors - 查询错误日志
 * - GET /api/latency - 延迟百分位数
 * - GET /api/stats - 统计数据
 * - GET /api/database/stats - 数据库统计
 * - GET /api/trend - 历史趋势
 * - GET /api/top-tools - 工具排行
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */

import type { IncomingMessage, ServerResponse } from 'http';
import type { RouteHandler } from '../router.js';
import {
  getRequestLogsByDate,
  getRequestLogsByTool,
  getErrorLogsByDate,
  getAllErrorLogs,
  getDailyStats,
  getRecentLogs,
  getTodayStats,
  getRequestLogsPaginated,
  getDurationPercentiles,
  getTrendData,
  getTopNToolsByRequests,
  getTopNToolsByErrors,
  getTopNToolsByDuration,
} from '../../database/sqlite-logger.js';
import { getDatabaseStats } from '../../database/connection.js';
import {
  sendJsonResponse,
  getQueryParam,
  getQueryParamAsNumber,
} from './response.js';

/**
 * Logs 查询处理器
 *
 * @param req - HTTP 请求对象
 * @param res - HTTP 响应对象
 * @returns 是否处理完成
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
export async function logsHandler(
  req: IncomingMessage,
  res: ServerResponse
): Promise<boolean> {
  const url = new URL(req.url ?? '/', 'http://localhost');
  const date = getQueryParam(url, 'date');
  const tool = getQueryParam(url, 'tool');
  const limit = getQueryParamAsNumber(url, 'limit', 100);

  let logs;
  // 条件注释：按工具名过滤时使用工具查询，按日期过滤时使用日期查询，否则返回最近日志
  if (tool) {
    logs = getRequestLogsByTool(tool, limit);
  } else if (date) {
    logs = getRequestLogsByDate(date, limit);
  } else {
    logs = getRecentLogs(limit);
  }

  sendJsonResponse(res, 200, logs);
  return true;
}

/**
 * Logs 分页查询处理器
 *
 * @param req - HTTP 请求对象
 * @param res - HTTP 响应对象
 * @returns 是否处理完成
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
export async function logsPaginatedHandler(
  req: IncomingMessage,
  res: ServerResponse
): Promise<boolean> {
  const url = new URL(req.url ?? '/', 'http://localhost');
  const page = getQueryParamAsNumber(url, 'page', 1);
  const pageSize = getQueryParamAsNumber(url, 'pageSize', 20);
  const date = getQueryParam(url, 'date');
  const tool = getQueryParam(url, 'tool');
  const level = getQueryParam(url, 'level');
  const startDate = getQueryParam(url, 'startDate');
  const endDate = getQueryParam(url, 'endDate');

  const result = getRequestLogsPaginated(
    { page, pageSize },
    { date, tool, level, startDate, endDate }
  );

  sendJsonResponse(res, 200, result);
  return true;
}

/**
 * Errors 查询处理器
 *
 * @param req - HTTP 请求对象
 * @param res - HTTP 响应对象
 * @returns 是否处理完成
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
export async function errorsHandler(
  req: IncomingMessage,
  res: ServerResponse
): Promise<boolean> {
  const url = new URL(req.url ?? '/', 'http://localhost');
  const date = getQueryParam(url, 'date') ?? new Date().toISOString().split('T')[0];
  const limit = getQueryParamAsNumber(url, 'limit', 100);

  const logs = getAllErrorLogs(date, limit);
  sendJsonResponse(res, 200, logs);
  return true;
}

/**
 * Latency 百分位数处理器
 *
 * @param req - HTTP 请求对象
 * @param res - HTTP 响应对象
 * @returns 是否处理完成
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
export async function latencyHandler(
  req: IncomingMessage,
  res: ServerResponse
): Promise<boolean> {
  const url = new URL(req.url ?? '/', 'http://localhost');
  const tool = getQueryParam(url, 'tool');
  const date = getQueryParam(url, 'date');
  const percentiles = getDurationPercentiles(tool, date);
  sendJsonResponse(res, 200, percentiles);
  return true;
}

/**
 * Stats 统计处理器
 *
 * @param req - HTTP 请求对象
 * @param res - HTTP 响应对象
 * @returns 是否处理完成
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
export async function statsHandler(
  req: IncomingMessage,
  res: ServerResponse
): Promise<boolean> {
  const url = new URL(req.url ?? '/', 'http://localhost');
  const startDate = getQueryParam(url, 'startDate');
  const endDate = getQueryParam(url, 'endDate');

  // 条件注释：有日期范围时查询多日统计，否则返回今日统计
  if (startDate && endDate) {
    const stats = getDailyStats(startDate, endDate);
    sendJsonResponse(res, 200, stats);
    return true;
  } else {
    const stats = getTodayStats();
    sendJsonResponse(res, 200, stats);
    return true;
  }
}

/**
 * Database 统计处理器
 *
 * @param _req - HTTP 请求对象
 * @param res - HTTP 响应对象
 * @returns 是否处理完成
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
export async function databaseStatsHandler(
  _req: IncomingMessage,
  res: ServerResponse
): Promise<boolean> {
  const stats = getDatabaseStats();
  sendJsonResponse(res, 200, stats);
  return true;
}

/**
 * Trend 趋势数据处理器
 *
 * @param req - HTTP 请求对象
 * @param res - HTTP 响应对象
 * @returns 是否处理完成
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
export async function trendHandler(
  req: IncomingMessage,
  res: ServerResponse
): Promise<boolean> {
  const url = new URL(req.url ?? '/', 'http://localhost');
  const days = getQueryParamAsNumber(url, 'days', 7);
  const trendData = getTrendData(days);
  sendJsonResponse(res, 200, trendData);
  return true;
}

/**
 * Top Tools 排行处理器
 *
 * @param req - HTTP 请求对象
 * @param res - HTTP 响应对象
 * @returns 是否处理完成
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
export async function topToolsHandler(
  req: IncomingMessage,
  res: ServerResponse
): Promise<boolean> {
  const url = new URL(req.url ?? '/', 'http://localhost');
  const limit = getQueryParamAsNumber(url, 'limit', 10);
  const date = getQueryParam(url, 'date');
  const type = getQueryParam(url, 'type') ?? 'requests';

  let topTools;
  // 条件注释：按类型选择不同的排行维度
  if (type === 'requests') {
    topTools = getTopNToolsByRequests(limit, date);
  } else if (type === 'errors') {
    topTools = getTopNToolsByErrors(limit, date);
  } else {
    topTools = getTopNToolsByDuration(limit, date);
  }

  sendJsonResponse(res, 200, topTools);
  return true;
}

/**
 * Logs 路由策略配置
 *
 * @returns 路由策略数组
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
export function getLogsRoutes(): Array<{
  name: string;
  path: string;
  matchType: 'exact';
  methods: string[];
  handler: RouteHandler;
  priority: number;
}> {
  return [
    {
      name: 'logs',
      path: '/api/logs',
      matchType: 'exact',
      methods: ['GET'],
      handler: logsHandler,
      priority: 80,
    },
    {
      name: 'logs-paginated',
      path: '/api/logs/paginated',
      matchType: 'exact',
      methods: ['GET'],
      handler: logsPaginatedHandler,
      priority: 81,
    },
    {
      name: 'errors',
      path: '/api/errors',
      matchType: 'exact',
      methods: ['GET'],
      handler: errorsHandler,
      priority: 80,
    },
    {
      name: 'latency',
      path: '/api/latency',
      matchType: 'exact',
      methods: ['GET'],
      handler: latencyHandler,
      priority: 80,
    },
    {
      name: 'stats',
      path: '/api/stats',
      matchType: 'exact',
      methods: ['GET'],
      handler: statsHandler,
      priority: 80,
    },
    {
      name: 'database-stats',
      path: '/api/database/stats',
      matchType: 'exact',
      methods: ['GET'],
      handler: databaseStatsHandler,
      priority: 80,
    },
    {
      name: 'trend',
      path: '/api/trend',
      matchType: 'exact',
      methods: ['GET'],
      handler: trendHandler,
      priority: 80,
    },
    {
      name: 'top-tools',
      path: '/api/top-tools',
      matchType: 'exact',
      methods: ['GET'],
      handler: topToolsHandler,
      priority: 80,
    },
  ];
}