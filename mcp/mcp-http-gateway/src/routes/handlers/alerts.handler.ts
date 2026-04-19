/**
 * Alerts 路由处理器
 *
 * Features:
 * - GET /api/alerts - 查询告警
 * - POST /api/alerts/:id/resolve - 解决告警
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */

import type { IncomingMessage, ServerResponse } from 'http';
import type { RouteHandler } from '../router.js';
import {
  getAlertsByDate,
  getUnresolvedAlerts,
  resolveAlert,
  getAlertSummary,
} from '../../database/alert-logger.js';
import {
  sendJsonResponse,
  getQueryParam,
  getQueryParamAsNumber,
} from './response.js';

/**
 * Alerts 查询处理器
 *
 * @param req - HTTP 请求对象
 * @param res - HTTP 响应对象
 * @returns 是否处理完成
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
export async function alertsHandler(
  req: IncomingMessage,
  res: ServerResponse
): Promise<boolean> {
  const url = new URL(req.url ?? '/', 'http://localhost');
  const unresolved = getQueryParam(url, 'unresolved');
  const date = getQueryParam(url, 'date');
  const limit = getQueryParamAsNumber(url, 'limit', 100);

  // 条件注释：查询未解决告警、按日期查询或返回摘要
  if (unresolved === 'true') {
    const alerts = getUnresolvedAlerts();
    sendJsonResponse(res, 200, alerts);
    return true;
  } else if (date) {
    const alerts = getAlertsByDate(date, limit);
    sendJsonResponse(res, 200, alerts);
    return true;
  } else {
    // Alert summary
    const startDate = getQueryParam(url, 'startDate') ?? new Date().toISOString().split('T')[0];
    const endDate = getQueryParam(url, 'endDate') ?? new Date().toISOString().split('T')[0];
    const summary = getAlertSummary(startDate, endDate);
    sendJsonResponse(res, 200, summary);
    return true;
  }
}

/**
 * Alert 解决处理器
 *
 * @param _req - HTTP 请求对象
 * @param res - HTTP 响应对象
 * @param params - 路由参数（包含 alertId）
 * @returns 是否处理完成
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
export async function alertResolveHandler(
  _req: IncomingMessage,
  res: ServerResponse,
  params?: Record<string, string>
): Promise<boolean> {
  const alertIdStr = params?.['1'] ?? '';
  // 条件注释：alertId 存在时解决，不存在时返回错误
  if (alertIdStr) {
    const alertId = parseInt(alertIdStr, 10);
    // 条件注释：解析成功时解决告警，失败时返回错误
    if (!isNaN(alertId)) {
      resolveAlert(alertId);
      sendJsonResponse(res, 200, { success: true, message: `Alert ${alertId} resolved` });
      return true;
    } else {
      sendJsonResponse(res, 400, { success: false, error: 'Invalid alert ID' });
      return true;
    }
  } else {
    sendJsonResponse(res, 400, { success: false, error: 'Alert ID required' });
    return true;
  }
}

/**
 * Alerts 路由策略配置
 *
 * @returns 路由策略数组
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
export function getAlertsRoutes(): Array<{
  name: string;
  path: string | RegExp;
  matchType: 'exact' | 'regex';
  methods: string[];
  handler: RouteHandler;
  priority: number;
}> {
  return [
    {
      name: 'alerts',
      path: '/api/alerts',
      matchType: 'exact',
      methods: ['GET'],
      handler: alertsHandler,
      priority: 70,
    },
    {
      name: 'alert-resolve',
      path: /^\/api\/alerts\/(\d+)\/resolve$/,
      matchType: 'regex',
      methods: ['POST'],
      handler: alertResolveHandler,
      priority: 71,
    },
  ];
}