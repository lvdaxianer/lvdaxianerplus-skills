/**
 * 配置版本控制路由处理器
 *
 * Dashboard API:
 * - /api/config-version - 版本控制统计
 * - /api/config-version/list - 版本列表
 * - /api/config-version/:version - 获取指定版本
 * - /api/config-version/compare - 比较版本差异
 * - /api/config-version/rollback - 回滚配置
 * - /api/config-version/export - 导出配置
 *
 * @author lvdaxianerplus
 * @date 2026-04-22
 */

import type { IncomingMessage, ServerResponse } from 'http';
import type { RouteHandler } from '../router.js';
import type { Config } from '../../config/types.js';
import {
  getConfigVersionStats,
  getConfigVersions,
  getConfigByVersion,
  rollbackConfig,
  compareConfigVersions,
  exportConfigVersion,
} from '../../features/config-version.js';
import { sendJsonResponse } from './response.js';

/**
 * 创建版本控制统计处理器
 *
 * @param config - 服务配置
 * @returns RouteHandler
 *
 * @author lvdaxianerplus
 * @date 2026-04-22
 */
export function createConfigVersionStatsHandler(config: Config): RouteHandler {
  return async function configVersionStatsHandler(
    _req: IncomingMessage,
    res: ServerResponse
  ): Promise<boolean> {
    const stats = getConfigVersionStats();
    sendJsonResponse(res, 200, stats);
    return true;
  };
}

/**
 * 创建版本列表处理器
 *
 * @param config - 服务配置
 * @returns RouteHandler
 *
 * @author lvdaxianerplus
 * @date 2026-04-22
 */
export function createConfigVersionListHandler(config: Config): RouteHandler {
  return async function configVersionListHandler(
    req: IncomingMessage,
    res: ServerResponse
  ): Promise<boolean> {
    // 条件注释：解析查询参数
    const url = new URL(req.url ?? '/', `http://${req.headers.host}`);
    const limit = parseInt(url.searchParams.get('limit') ?? '20', 10);
    const configPath = url.searchParams.get('configPath') ?? undefined;

    // 条件注释：获取版本列表
    const versions = getConfigVersions(limit, configPath);

    sendJsonResponse(res, 200, {
      total: versions.length,
      limit,
      configPath,
      versions,
    });
    return true;
  };
}

/**
 * 创建获取指定版本处理器
 *
 * @param config - 服务配置
 * @returns RouteHandler
 *
 * @author lvdaxianerplus
 * @date 2026-04-22
 */
export function createConfigVersionGetHandler(config: Config): RouteHandler {
  return async function configVersionGetHandler(
    req: IncomingMessage,
    res: ServerResponse
  ): Promise<boolean> {
    // 条件注释：从路径中提取版本号
    const url = new URL(req.url ?? '/', `http://${req.headers.host}`);
    const pathParts = url.pathname.split('/');
    const versionStr = pathParts[pathParts.length - 1];
    const version = parseInt(versionStr, 10);

    // 条件注释：验证版本号
    if (isNaN(version)) {
      sendJsonResponse(res, 400, { error: 'Invalid version number' });
      return true;
    }

    // 条件注释：获取指定版本
    const versionRecord = getConfigByVersion(version);

    if (!versionRecord) {
      sendJsonResponse(res, 404, { error: `Version ${version} not found` });
      return true;
    }

    sendJsonResponse(res, 200, versionRecord);
    return true;
  };
}

/**
 * 创建版本比较处理器
 *
 * @param config - 服务配置
 * @returns RouteHandler
 *
 * @author lvdaxianerplus
 * @date 2026-04-22
 */
export function createConfigVersionCompareHandler(config: Config): RouteHandler {
  return async function configVersionCompareHandler(
    req: IncomingMessage,
    res: ServerResponse
  ): Promise<boolean> {
    // 条件注释：解析查询参数
    const url = new URL(req.url ?? '/', `http://${req.headers.host}`);
    const version1 = parseInt(url.searchParams.get('version1') ?? '0', 10);
    const version2 = parseInt(url.searchParams.get('version2') ?? '0', 10);

    // 条件注释：验证版本号
    if (isNaN(version1) || isNaN(version2)) {
      sendJsonResponse(res, 400, { error: 'Invalid version numbers' });
      return true;
    }

    // 条件注释：比较版本
    const comparison = compareConfigVersions(version1, version2);

    if (!comparison) {
      sendJsonResponse(res, 404, { error: 'One or both versions not found' });
      return true;
    }

    sendJsonResponse(res, 200, comparison);
    return true;
  };
}

/**
 * 创建版本回滚处理器
 *
 * @param config - 服务配置
 * @returns RouteHandler
 *
 * @author lvdaxianerplus
 * @date 2026-04-22
 */
export function createConfigVersionRollbackHandler(config: Config): RouteHandler {
  return async function configVersionRollbackHandler(
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
        const { version, configPath } = JSON.parse(body) as {
          version?: number;
          configPath?: string;
        };

        // 条件注释：验证必需参数
        if (!version || !configPath) {
          sendJsonResponse(res, 400, { error: 'Missing required parameters: version and configPath' });
          return;
        }

        // 条件注释：执行回滚
        const success = rollbackConfig(version, configPath);

        if (success) {
          sendJsonResponse(res, 200, {
            success: true,
            message: `Config rolled back to version ${version}`,
            version,
            configPath,
          });
        } else {
          sendJsonResponse(res, 500, {
            success: false,
            error: 'Failed to rollback config',
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
 * 创建配置导出处理器
 *
 * @param config - 服务配置
 * @returns RouteHandler
 *
 * @author lvdaxianerplus
 * @date 2026-04-22
 */
export function createConfigVersionExportHandler(config: Config): RouteHandler {
  return async function configVersionExportHandler(
    req: IncomingMessage,
    res: ServerResponse
  ): Promise<boolean> {
    // 条件注释：解析查询参数
    const url = new URL(req.url ?? '/', `http://${req.headers.host}`);
    const version = parseInt(url.searchParams.get('version') ?? '0', 10);
    const outputPath = url.searchParams.get('outputPath');

    // 条件注释：验证版本号
    if (isNaN(version)) {
      sendJsonResponse(res, 400, { error: 'Invalid version number' });
      return true;
    }

    // 条件注释：如果没有指定输出路径，直接返回配置内容
    if (!outputPath) {
      const versionRecord = getConfigByVersion(version);

      if (!versionRecord) {
        sendJsonResponse(res, 404, { error: `Version ${version} not found` });
        return true;
      }

      // 条件注释：返回配置内容（可下载）
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="config-v${version}.json"`,
      });
      res.end(versionRecord.configContent);
      return true;
    }

    // 条件注释：导出到指定路径
    const success = exportConfigVersion(version, outputPath);

    if (success) {
      sendJsonResponse(res, 200, {
        success: true,
        message: `Config version ${version} exported to ${outputPath}`,
        version,
        outputPath,
      });
    } else {
      sendJsonResponse(res, 500, {
        success: false,
        error: 'Failed to export config',
      });
    }

    return true;
  };
}

/**
 * 配置版本控制路由策略配置
 *
 * @param config - 服务配置
 * @returns 路由策略数组
 *
 * @author lvdaxianerplus
 * @date 2026-04-22
 */
export function getConfigVersionRoutes(config: Config): Array<{
  name: string;
  path: string;
  matchType: 'exact' | 'prefix';
  methods: string[];
  handler: RouteHandler;
  priority: number;
}> {
  return [
    {
      name: 'config-version-stats',
      path: '/api/config-version',
      matchType: 'exact',
      methods: ['GET'],
      handler: createConfigVersionStatsHandler(config),
      priority: 100,
    },
    {
      name: 'config-version-list',
      path: '/api/config-version/list',
      matchType: 'exact',
      methods: ['GET'],
      handler: createConfigVersionListHandler(config),
      priority: 100,
    },
    {
      name: 'config-version-get',
      path: '/api/config-version/',
      matchType: 'prefix',
      methods: ['GET'],
      handler: createConfigVersionGetHandler(config),
      priority: 90,
    },
    {
      name: 'config-version-compare',
      path: '/api/config-version/compare',
      matchType: 'exact',
      methods: ['GET'],
      handler: createConfigVersionCompareHandler(config),
      priority: 100,
    },
    {
      name: 'config-version-rollback',
      path: '/api/config-version/rollback',
      matchType: 'exact',
      methods: ['POST'],
      handler: createConfigVersionRollbackHandler(config),
      priority: 100,
    },
    {
      name: 'config-version-export',
      path: '/api/config-version/export',
      matchType: 'exact',
      methods: ['GET'],
      handler: createConfigVersionExportHandler(config),
      priority: 100,
    },
  ];
}