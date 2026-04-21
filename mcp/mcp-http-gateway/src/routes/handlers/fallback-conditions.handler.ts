/**
 * Fallback Conditions 路由处理器
 *
 * Features:
 * - GET /api/fallback/conditions - 获取降级条件配置
 * - PUT /api/fallback/conditions - 更新降级条件配置
 *
 * @author lvdaxianerplus
 * @date 2026-04-21
 */

import type { IncomingMessage, ServerResponse } from 'http';
import type { RouteHandler } from '../router.js';
import type { FallbackConditionConfig } from '../../config/types.js';
import {
  loadFallbackConditions,
  saveFallbackConditions,
  getCachedFallbackConditions,
} from '../../utils/fallback-evaluator.js';
import {
  sendJsonResponse,
  sendBadRequestResponse,
  parseJsonBody,
} from './response.js';
import { logger } from '../../middleware/logger.js';

/**
 * Fallback Conditions 获取处理器
 *
 * @param req - HTTP 请求对象
 * @param res - HTTP 响应对象
 * @returns 是否处理完成
 *
 * @author lvdaxianerplus
 * @date 2026-04-21
 */
export async function fallbackConditionsGetHandler(
  _req: IncomingMessage,
  res: ServerResponse
): Promise<boolean> {
  // 从数据库加载配置
  const conditions = loadFallbackConditions();

  // 条件注释：配置不存在时返回默认空配置，存在时返回实际配置
  if (!conditions) {
    // 返回默认空配置
    sendJsonResponse(res, 200, {
      enabled: false,
      conditions: [],
      message: 'No fallback conditions configured'
    });
    return true;
  } else {
    // 返回实际配置
    sendJsonResponse(res, 200, conditions);
    return true;
  }
}

/**
 * Fallback Conditions 更新处理器
 *
 * @param req - HTTP 请求对象
 * @param res - HTTP 响应对象
 * @returns 是否处理完成
 *
 * @author lvdaxianerplus
 * @date 2026-04-21
 */
export async function fallbackConditionsPutHandler(
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
      // 验证配置格式
      const config = body as FallbackConditionConfig;

      // 条件注释：conditions 字段不存在时返回错误
      if (!Array.isArray(config.conditions)) {
        sendBadRequestResponse(res, 'conditions must be an array');
        return true;
      } else {
        // 验证每个条件的格式
        for (const condition of config.conditions) {
          // 条件注释：条件缺少必要字段时返回错误
          if (!condition.expression || !condition.operator) {
            sendBadRequestResponse(res, 'Each condition must have expression and operator');
            return true;
          } else {
            // 条件格式正确，继续验证下一个
          }
        }

        // 所有验证通过，保存配置
        saveFallbackConditions(config);

        logger.info('[降级条件 API] Configuration saved', {
          enabled: config.enabled,
          count: config.conditions.length
        });

        sendJsonResponse(res, 200, {
          success: true,
          message: 'Fallback conditions saved',
          conditions: config
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
 * 创建 Fallback Conditions 路由处理器工厂函数
 *
 * @returns Fallback Conditions 路由策略配置
 *
 * @author lvdaxianerplus
 * @date 2026-04-21
 */
export function getFallbackConditionsRoutes(): Array<{
  name: string;
  path: string | RegExp;
  matchType: 'exact' | 'regex';
  methods?: string[];
  handler: RouteHandler;
  priority: number;
}> {
  return [
    {
      name: 'fallback-conditions-get',
      path: '/api/fallback/conditions',
      matchType: 'exact',
      methods: ['GET'],
      handler: fallbackConditionsGetHandler,
      priority: 70,
    },
    {
      name: 'fallback-conditions-put',
      path: '/api/fallback/conditions',
      matchType: 'exact',
      methods: ['PUT'],
      handler: fallbackConditionsPutHandler,
      priority: 71,
    },
  ];
}