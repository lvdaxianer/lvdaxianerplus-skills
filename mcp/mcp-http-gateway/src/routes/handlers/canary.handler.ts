/**
 * 灰度发布路由处理器
 *
 * Dashboard API:
 * - /api/canary - 灰度发布统计
 * - /api/canary/list - 灰度发布列表
 * - /api/canary/:id - 获取指定灰度发布
 * - /api/canary/create - 创建灰度发布
 * - /api/canary/pause - 暂停灰度发布
 * - /api/canary/resume - 恢复灰度发布
 * - /api/canary/complete - 完成灰度发布
 * - /api/canary/rollback - 回滚灰度发布
 * - /api/canary/metrics - 获取灰度指标
 *
 * @author lvdaxianerplus
 * @date 2026-04-22
 */

import type { IncomingMessage, ServerResponse } from 'http';
import type { RouteHandler } from '../router.js';
import type { Config } from '../../config/types.js';
import type { CanaryRelease } from '../../features/canary.js';
import {
  getCanaryStats,
  getCanaryList,
  getCanaryById,
  createCanary,
  pauseCanary,
  resumeCanary,
  completeCanary,
  rollbackCanary,
  deleteCanary,
  getCanaryMetrics,
  recordCanaryMetrics,
} from '../../features/canary.js';
import { sendJsonResponse } from './response.js';

/**
 * 创建灰度发布统计处理器
 *
 * @param config - 服务配置
 * @returns RouteHandler
 *
 * @author lvdaxianerplus
 * @date 2026-04-22
 */
export function createCanaryStatsHandler(config: Config): RouteHandler {
  return async function canaryStatsHandler(
    _req: IncomingMessage,
    res: ServerResponse
  ): Promise<boolean> {
    const stats = getCanaryStats();
    sendJsonResponse(res, 200, stats);
    return true;
  };
}

/**
 * 创建灰度发布列表处理器
 *
 * @param config - 服务配置
 * @returns RouteHandler
 *
 * @author lvdaxianerplus
 * @date 2026-04-22
 */
export function createCanaryListHandler(config: Config): RouteHandler {
  return async function canaryListHandler(
    req: IncomingMessage,
    res: ServerResponse
  ): Promise<boolean> {
    // 条件注释：解析查询参数
    const url = new URL(req.url ?? '/', `http://${req.headers.host}`);
    const status = url.searchParams.get('status') as CanaryRelease['status'] | null;

    // 条件注释：获取灰度发布列表
    const canaries = getCanaryList(status ?? undefined);

    sendJsonResponse(res, 200, {
      total: canaries.length,
      status,
      canaries,
    });
    return true;
  };
}

/**
 * 创建获取指定灰度发布处理器
 *
 * @param config - 服务配置
 * @returns RouteHandler
 *
 * @author lvdaxianerplus
 * @date 2026-04-22
 */
export function createCanaryGetHandler(config: Config): RouteHandler {
  return async function canaryGetHandler(
    req: IncomingMessage,
    res: ServerResponse
  ): Promise<boolean> {
    // 条件注释：从路径中提取灰度 ID
    const url = new URL(req.url ?? '/', `http://${req.headers.host}`);
    const pathParts = url.pathname.split('/');
    const canaryId = pathParts[pathParts.length - 1];

    if (!canaryId) {
      sendJsonResponse(res, 400, { error: 'Missing canary ID' });
      return true;
    }

    // 条件注释：获取指定灰度发布
    const canary = getCanaryById(canaryId);

    if (!canary) {
      sendJsonResponse(res, 404, { error: `Canary ${canaryId} not found` });
      return true;
    }

    // 条件注释：获取关联指标
    const metrics = getCanaryMetrics(canaryId, 10);

    sendJsonResponse(res, 200, {
      canary,
      recentMetrics: metrics,
    });
    return true;
  };
}

/**
 * 创建灰度发布创建处理器
 *
 * @param config - 服务配置
 * @returns RouteHandler
 *
 * @author lvdaxianerplus
 * @date 2026-04-22
 */
export function createCanaryCreateHandler(config: Config): RouteHandler {
  return async function canaryCreateHandler(
    req: IncomingMessage,
    res: ServerResponse
  ): Promise<boolean> {
    // 条件注释：只支持 POST 方法
    if (req.method !== 'POST') {
      sendJsonResponse(res, 405, { error: 'Method not allowed' });
      return true;
    }

    // 条件注释：解析请求体
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        const canaryData = JSON.parse(body) as {
          enabled?: boolean;
          name: string;
          description?: string;
          strategy: { type: 'percentage' | 'user' | 'tool'; value: number | string[] };
          targetConfig: string;
          baselineConfig: string;
          endTime?: string;
          autoRollbackThreshold?: number;
        };

        // 条件注释：验证必需参数
        if (!canaryData.name || !canaryData.strategy || !canaryData.targetConfig || !canaryData.baselineConfig) {
          sendJsonResponse(res, 400, {
            success: false,
            error: 'Missing required parameters: name, strategy, targetConfig, baselineConfig',
          });
          return;
        }

        // 条件注释：创建灰度发布
        const newCanary = createCanary({
          enabled: canaryData.enabled ?? true,
          name: canaryData.name,
          description: canaryData.description ?? '',
          strategy: canaryData.strategy,
          targetConfig: canaryData.targetConfig,
          baselineConfig: canaryData.baselineConfig,
          endTime: canaryData.endTime,
          autoRollbackThreshold: canaryData.autoRollbackThreshold,
        });

        if (newCanary) {
          sendJsonResponse(res, 200, {
            success: true,
            message: 'Canary created successfully',
            canary: newCanary,
          });
        } else {
          sendJsonResponse(res, 500, {
            success: false,
            error: 'Failed to create canary',
          });
        }
      } catch (error) {
        sendJsonResponse(res, 400, {
          success: false,
          error: 'Invalid JSON body',
        });
      }
    });

    return true;
  };
}

/**
 * 创建灰度发布暂停处理器
 *
 * @param config - 服务配置
 * @returns RouteHandler
 *
 * @author lvdaxianerplus
 * @date 2026-04-22
 */
export function createCanaryPauseHandler(config: Config): RouteHandler {
  return async function canaryPauseHandler(
    req: IncomingMessage,
    res: ServerResponse
  ): Promise<boolean> {
    // 条件注释：只支持 POST 方法
    if (req.method !== 'POST') {
      sendJsonResponse(res, 405, { error: 'Method not allowed' });
      return true;
    }

    // 条件注释：解析请求体
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        const { canaryId } = JSON.parse(body) as { canaryId?: string };

        if (!canaryId) {
          sendJsonResponse(res, 400, { error: 'Missing canary ID' });
          return;
        }

        const success = pauseCanary(canaryId);

        sendJsonResponse(res, 200, {
          success,
          message: success ? `Canary ${canaryId} paused` : 'Failed to pause canary',
          canaryId,
        });
      } catch (error) {
        sendJsonResponse(res, 400, { error: 'Invalid JSON body' });
      }
    });

    return true;
  };
}

/**
 * 创建灰度发布恢复处理器
 *
 * @param config - 服务配置
 * @returns RouteHandler
 *
 * @author lvdaxianerplus
 * @date 2026-04-22
 */
export function createCanaryResumeHandler(config: Config): RouteHandler {
  return async function canaryResumeHandler(
    req: IncomingMessage,
    res: ServerResponse
  ): Promise<boolean> {
    // 条件注释：只支持 POST 方法
    if (req.method !== 'POST') {
      sendJsonResponse(res, 405, { error: 'Method not allowed' });
      return true;
    }

    // 条件注释：解析请求体
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        const { canaryId } = JSON.parse(body) as { canaryId?: string };

        if (!canaryId) {
          sendJsonResponse(res, 400, { error: 'Missing canary ID' });
          return;
        }

        const success = resumeCanary(canaryId);

        sendJsonResponse(res, 200, {
          success,
          message: success ? `Canary ${canaryId} resumed` : 'Failed to resume canary',
          canaryId,
        });
      } catch (error) {
        sendJsonResponse(res, 400, { error: 'Invalid JSON body' });
      }
    });

    return true;
  };
}

/**
 * 创建灰度发布完成处理器
 *
 * @param config - 服务配置
 * @returns RouteHandler
 *
 * @author lvdaxianerplus
 * @date 2026-04-22
 */
export function createCanaryCompleteHandler(config: Config): RouteHandler {
  return async function canaryCompleteHandler(
    req: IncomingMessage,
    res: ServerResponse
  ): Promise<boolean> {
    // 条件注释：只支持 POST 方法
    if (req.method !== 'POST') {
      sendJsonResponse(res, 405, { error: 'Method not allowed' });
      return true;
    }

    // 条件注释：解析请求体
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        const { canaryId } = JSON.parse(body) as { canaryId?: string };

        if (!canaryId) {
          sendJsonResponse(res, 400, { error: 'Missing canary ID' });
          return;
        }

        const success = completeCanary(canaryId);

        sendJsonResponse(res, 200, {
          success,
          message: success ? `Canary ${canaryId} completed` : 'Failed to complete canary',
          canaryId,
        });
      } catch (error) {
        sendJsonResponse(res, 400, { error: 'Invalid JSON body' });
      }
    });

    return true;
  };
}

/**
 * 创建灰度发布回滚处理器
 *
 * @param config - 服务配置
 * @returns RouteHandler
 *
 * @author lvdaxianerplus
 * @date 2026-04-22
 */
export function createCanaryRollbackHandler(config: Config): RouteHandler {
  return async function canaryRollbackHandler(
    req: IncomingMessage,
    res: ServerResponse
  ): Promise<boolean> {
    // 条件注释：只支持 POST 方法
    if (req.method !== 'POST') {
      sendJsonResponse(res, 405, { error: 'Method not allowed' });
      return true;
    }

    // 条件注释：解析请求体
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        const { canaryId } = JSON.parse(body) as { canaryId?: string };

        if (!canaryId) {
          sendJsonResponse(res, 400, { error: 'Missing canary ID' });
          return;
        }

        const success = rollbackCanary(canaryId);

        sendJsonResponse(res, 200, {
          success,
          message: success ? `Canary ${canaryId} rolled back` : 'Failed to rollback canary',
          canaryId,
        });
      } catch (error) {
        sendJsonResponse(res, 400, { error: 'Invalid JSON body' });
      }
    });

    return true;
  };
}

/**
 * 创建灰度发布删除处理器
 *
 * @param config - 服务配置
 * @returns RouteHandler
 *
 * @author lvdaxianerplus
 * @date 2026-04-22
 */
export function createCanaryDeleteHandler(config: Config): RouteHandler {
  return async function canaryDeleteHandler(
    req: IncomingMessage,
    res: ServerResponse
  ): Promise<boolean> {
    // 条件注释：只支持 DELETE 方法
    if (req.method !== 'DELETE') {
      sendJsonResponse(res, 405, { error: 'Method not allowed' });
      return true;
    }

    // 条件注释：从路径中提取灰度 ID
    const url = new URL(req.url ?? '/', `http://${req.headers.host}`);
    const pathParts = url.pathname.split('/');
    const canaryId = pathParts[pathParts.length - 1];

    if (!canaryId) {
      sendJsonResponse(res, 400, { error: 'Missing canary ID' });
      return true;
    }

    const success = deleteCanary(canaryId);

    sendJsonResponse(res, 200, {
      success,
      message: success ? `Canary ${canaryId} deleted` : 'Failed to delete canary',
      canaryId,
    });

    return true;
  };
}

/**
 * 创建灰度指标处理器
 *
 * @param config - 服务配置
 * @returns RouteHandler
 *
 * @author lvdaxianerplus
 * @date 2026-04-22
 */
export function createCanaryMetricsHandler(config: Config): RouteHandler {
  return async function canaryMetricsHandler(
    req: IncomingMessage,
    res: ServerResponse
  ): Promise<boolean> {
    // 条件注释：解析查询参数
    const url = new URL(req.url ?? '/', `http://${req.headers.host}`);
    const canaryId = url.searchParams.get('canaryId');
    const limit = parseInt(url.searchParams.get('limit') ?? '100', 10);

    if (!canaryId) {
      sendJsonResponse(res, 400, { error: 'Missing canary ID' });
      return true;
    }

    // 条件注释：获取灰度指标
    const metrics = getCanaryMetrics(canaryId, limit);

    sendJsonResponse(res, 200, {
      canaryId,
      total: metrics.length,
      limit,
      metrics,
    });

    return true;
  };
}

/**
 * 灰度发布路由策略配置
 *
 * @param config - 服务配置
 * @returns 路由策略数组
 *
 * @author lvdaxianerplus
 * @date 2026-04-22
 */
export function getCanaryRoutes(config: Config): Array<{
  name: string;
  path: string;
  matchType: 'exact' | 'prefix';
  methods: string[];
  handler: RouteHandler;
  priority: number;
}> {
  return [
    {
      name: 'canary-stats',
      path: '/api/canary',
      matchType: 'exact',
      methods: ['GET'],
      handler: createCanaryStatsHandler(config),
      priority: 100,
    },
    {
      name: 'canary-list',
      path: '/api/canary/list',
      matchType: 'exact',
      methods: ['GET'],
      handler: createCanaryListHandler(config),
      priority: 100,
    },
    {
      name: 'canary-create',
      path: '/api/canary/create',
      matchType: 'exact',
      methods: ['POST'],
      handler: createCanaryCreateHandler(config),
      priority: 100,
    },
    {
      name: 'canary-pause',
      path: '/api/canary/pause',
      matchType: 'exact',
      methods: ['POST'],
      handler: createCanaryPauseHandler(config),
      priority: 100,
    },
    {
      name: 'canary-resume',
      path: '/api/canary/resume',
      matchType: 'exact',
      methods: ['POST'],
      handler: createCanaryResumeHandler(config),
      priority: 100,
    },
    {
      name: 'canary-complete',
      path: '/api/canary/complete',
      matchType: 'exact',
      methods: ['POST'],
      handler: createCanaryCompleteHandler(config),
      priority: 100,
    },
    {
      name: 'canary-rollback',
      path: '/api/canary/rollback',
      matchType: 'exact',
      methods: ['POST'],
      handler: createCanaryRollbackHandler(config),
      priority: 100,
    },
    {
      name: 'canary-metrics',
      path: '/api/canary/metrics',
      matchType: 'exact',
      methods: ['GET'],
      handler: createCanaryMetricsHandler(config),
      priority: 100,
    },
    {
      name: 'canary-get',
      path: '/api/canary/',
      matchType: 'prefix',
      methods: ['GET'],
      handler: createCanaryGetHandler(config),
      priority: 90,
    },
    {
      name: 'canary-delete',
      path: '/api/canary/',
      matchType: 'prefix',
      methods: ['DELETE'],
      handler: createCanaryDeleteHandler(config),
      priority: 90,
    },
  ];
}