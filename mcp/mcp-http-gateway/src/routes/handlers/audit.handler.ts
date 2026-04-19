/**
 * Audit 路由处理器
 *
 * Features:
 * - GET /api/audit - 查询审计日志
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */

import type { IncomingMessage, ServerResponse } from 'http';
import type { RouteHandler } from '../router.js';
import {
  getAuditLogsByDate,
  getAuditLogsBySession,
  getAuditReport,
} from '../../database/audit-logger.js';
import {
  sendJsonResponse,
  sendBadRequestResponse,
  getQueryParam,
} from './response.js';

/**
 * Audit 查询处理器
 *
 * @param req - HTTP 请求对象
 * @param res - HTTP 响应对象
 * @returns 是否处理完成
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
export async function auditHandler(
  req: IncomingMessage,
  res: ServerResponse
): Promise<boolean> {
  const url = new URL(req.url ?? '/', 'http://localhost');
  const sessionId = getQueryParam(url, 'session');
  const date = getQueryParam(url, 'date');
  const startDate = getQueryParam(url, 'startDate');
  const endDate = getQueryParam(url, 'endDate');

  // 条件注释：根据参数类型选择不同查询方式
  if (sessionId) {
    const logs = getAuditLogsBySession(sessionId);
    sendJsonResponse(res, 200, logs);
    return true;
  } else if (date) {
    const logs = getAuditLogsByDate(date);
    sendJsonResponse(res, 200, logs);
    return true;
  } else if (startDate && endDate) {
    const report = getAuditReport(startDate, endDate);
    sendJsonResponse(res, 200, report);
    return true;
  } else {
    sendBadRequestResponse(
      res,
      'Missing required parameter: date, session, or startDate/endDate'
    );
    return true;
  }
}

/**
 * Audit 路由策略配置
 *
 * @returns 路由策略数组
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
export function getAuditRoutes(): Array<{
  name: string;
  path: string;
  matchType: 'exact';
  methods: string[];
  handler: RouteHandler;
  priority: number;
}> {
  return [
    {
      name: 'audit',
      path: '/api/audit',
      matchType: 'exact',
      methods: ['GET'],
      handler: auditHandler,
      priority: 30,
    },
  ];
}