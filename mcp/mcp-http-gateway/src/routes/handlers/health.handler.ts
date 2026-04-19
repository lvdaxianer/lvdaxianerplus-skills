/**
 * Health 检查路由处理器
 *
 * Features:
 * - /health - 健康检查
 * - /health/ready - 就绪检查
 * - /health/live - 存活检查
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */

import type { IncomingMessage, ServerResponse } from 'http';
import type { RouteHandler } from '../router.js';
import type { Config } from '../../config/types.js';
import { handleHealthCheck } from '../health.js';
import { sendJsonResponse } from './response.js';

/**
 * 创建 Health 处理器
 *
 * @param config - 服务配置
 * @returns RouteHandler
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
export function createHealthHandler(config: Config): RouteHandler {
  return async function healthHandler(
    _req: IncomingMessage,
    res: ServerResponse
  ): Promise<boolean> {
    const health = handleHealthCheck(config);
    sendJsonResponse(res, 200, health);
    return true;
  };
}

/**
 * Health 路由策略配置
 *
 * @param config - 服务配置
 * @returns 路由策略数组
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
export function getHealthRoutes(config: Config): Array<{
  name: string;
  path: string;
  matchType: 'exact';
  methods: string[];
  handler: RouteHandler;
  priority: number;
}> {
  const handler = createHealthHandler(config);

  return [
    {
      name: 'health',
      path: '/health',
      matchType: 'exact',
      methods: ['GET'],
      handler,
      priority: 100,
    },
    {
      name: 'health-ready',
      path: '/health/ready',
      matchType: 'exact',
      methods: ['GET'],
      handler,
      priority: 100,
    },
    {
      name: 'health-live',
      path: '/health/live',
      matchType: 'exact',
      methods: ['GET'],
      handler,
      priority: 100,
    },
  ];
}