/**
 * Metrics 路由处理器
 *
 * Features:
 * - /metrics - 性能指标
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */

import type { IncomingMessage, ServerResponse } from 'http';
import type { RouteHandler } from '../router.js';
import { handleMetrics } from '../health.js';
import { sendJsonResponse } from './response.js';

/**
 * Metrics 处理器
 *
 * @param req - HTTP 请求对象
 * @param res - HTTP 响应对象
 * @returns 是否处理完成
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
export async function metricsHandler(
  _req: IncomingMessage,
  res: ServerResponse
): Promise<boolean> {
  const metrics = handleMetrics();
  sendJsonResponse(res, 200, metrics);
  return true;
}

/**
 * Metrics 路由策略配置
 *
 * @returns 路由策略数组
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
export function getMetricsRoutes(): Array<{
  name: string;
  path: string;
  matchType: 'exact';
  methods: string[];
  handler: RouteHandler;
  priority: number;
}> {
  return [
    {
      name: 'metrics',
      path: '/metrics',
      matchType: 'exact',
      methods: ['GET'],
      handler: metricsHandler,
      priority: 100,
    },
  ];
}