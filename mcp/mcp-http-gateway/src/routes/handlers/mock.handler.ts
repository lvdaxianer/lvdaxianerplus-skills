/**
 * Mock 路由处理器
 *
 * Features:
 * - GET /api/mock - 获取全局 Mock 状态
 * - POST /api/mock - 更新全局 Mock 状态
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */

import type { IncomingMessage, ServerResponse } from 'http';
import type { RouteHandler } from '../router.js';
import {
  getAllMockData,
  setGlobalMockEnabled,
  getGlobalMockEnabled,
} from '../../features/mock.js';
import {
  sendJsonResponse,
  sendMethodNotAllowedResponse,
  sendBadRequestResponse,
  parseJsonBody,
} from './response.js';

/**
 * Mock 获取处理器（GET）
 *
 * @param _req - HTTP 请求对象
 * @param res - HTTP 响应对象
 * @returns 是否处理完成
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
export async function mockGetHandler(
  _req: IncomingMessage,
  res: ServerResponse
): Promise<boolean> {
  const mockData = getAllMockData();
  const enabled = getGlobalMockEnabled();
  sendJsonResponse(res, 200, { enabled, mockData });
  return true;
}

/**
 * Mock 更新处理器（POST）
 *
 * @param req - HTTP 请求对象
 * @param res - HTTP 响应对象
 * @returns 是否处理完成
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
export async function mockPostHandler(
  req: IncomingMessage,
  res: ServerResponse
): Promise<boolean> {
  try {
    const body = await parseJsonBody(req);
    // 条件注释：请求体不存在时返回错误
    if (!body) {
      sendBadRequestResponse(res, 'Request body required');
      return true;
    } else {
      const data = body as { enabled?: boolean };
      // 条件注释：enabled 字段存在时更新状态，不存在时保持当前状态
      if (data.enabled !== undefined) {
        setGlobalMockEnabled(data.enabled);
      } else {
        // 未提供 enabled 字段，不改变当前状态
      }
      sendJsonResponse(res, 200, { success: true, enabled: getGlobalMockEnabled() });
      return true;
    }
  } catch {
    sendBadRequestResponse(res, 'Invalid JSON');
    return true;
  }
}

/**
 * Mock 主路由处理器（根据方法分发）
 *
 * @param req - HTTP 请求对象
 * @param res - HTTP 响应对象
 * @returns 是否处理完成
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
export async function mockHandler(
  req: IncomingMessage,
  res: ServerResponse
): Promise<boolean> {
  const method = req.method ?? 'GET';

  // 条件注释：GET 方法返回状态，POST 方法更新状态，其他方法返回 405
  if (method === 'GET') {
    return mockGetHandler(req, res);
  } else if (method === 'POST') {
    return mockPostHandler(req, res);
  } else {
    sendMethodNotAllowedResponse(res);
    return true;
  }
}

/**
 * Mock 路由策略配置
 *
 * @returns 路由策略数组
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
export function getMockRoutes(): Array<{
  name: string;
  path: string;
  matchType: 'exact';
  handler: RouteHandler;
  priority: number;
}> {
  return [
    {
      name: 'mock',
      path: '/api/mock',
      matchType: 'exact',
      handler: mockHandler,
      priority: 50,
    },
  ];
}