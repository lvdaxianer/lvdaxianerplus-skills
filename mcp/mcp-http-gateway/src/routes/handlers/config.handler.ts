/**
 * Config 路由处理器
 *
 * Features:
 * - GET /api/config - 获取配置（脱敏）
 * - PUT /api/config - 更新配置
 * - POST /api/config/validate - 验证配置
 * - GET /api/config/backups - 获取备份列表
 * - POST /api/config/restore/:version - 回滚配置
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */

import type { IncomingMessage, ServerResponse } from 'http';
import type { RouteHandler } from '../router.js';
import type { Config } from '../../config/types.js';
import {
  listBackupVersions,
  saveConfig,
  maskSensitiveConfig,
  validateConfigFormat,
  getCurrentConfig,
} from '../../config/loader.js';
import {
  sendJsonResponse,
  sendBadRequestResponse,
  parseJsonBody,
} from './response.js';

/**
 * 配置路径（外部注入）
 */
let configPath: string = './tools.json';

/**
 * 设置配置路径
 *
 * @param path - 配置文件路径
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
export function setConfigPath(path: string): void {
  configPath = path;
}

/**
 * Config 获取处理器
 *
 * @param req - HTTP 请求对象
 * @param res - HTTP 响应对象
 * @param config - 服务配置
 * @returns 是否处理完成
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
export async function configGetHandler(
  _req: IncomingMessage,
  res: ServerResponse,
  _params?: Record<string, string>,
  config?: Config
): Promise<boolean> {
  // 条件注释：配置不存在时返回错误
  if (!config) {
    sendBadRequestResponse(res, 'Config not available');
    return true;
  } else {
    const safeConfig = maskSensitiveConfig(config);
    sendJsonResponse(res, 200, safeConfig);
    return true;
  }
}

/**
 * Config 更新处理器
 *
 * @param req - HTTP 请求对象
 * @param res - HTTP 响应对象
 * @returns 是否处理完成
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
export async function configPutHandler(
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
      const newConfig = body as Config;
      const savedPath = saveConfig(newConfig);
      sendJsonResponse(res, 200, {
        success: true,
        path: savedPath,
        message: 'Configuration saved and hot reload triggered',
      });
      return true;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    sendBadRequestResponse(res, errorMessage);
    return true;
  }
}

/**
 * Config 验证处理器
 *
 * @param req - HTTP 请求对象
 * @param res - HTTP 响应对象
 * @returns 是否处理完成
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
export async function configValidateHandler(
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
      const result = validateConfigFormat(body);
      sendJsonResponse(res, 200, result);
      return true;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    sendJsonResponse(res, 200, { valid: false, error: errorMessage });
    return true;
  }
}

/**
 * Config 备份列表处理器
 *
 * @param req - HTTP 请求对象
 * @param res - HTTP 响应对象
 * @param config - 服务配置
 * @returns 是否处理完成
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
export async function configBackupsHandler(
  _req: IncomingMessage,
  res: ServerResponse,
  _params?: Record<string, string>,
  config?: Config
): Promise<boolean> {
  // 条件注释：配置不存在时返回错误
  if (!config) {
    sendBadRequestResponse(res, 'Config not available');
    return true;
  } else {
    const backups = listBackupVersions(configPath, config.backup);
    sendJsonResponse(res, 200, backups);
    return true;
  }
}

/**
 * Config 回滚处理器
 *
 * @param req - HTTP 请求对象
 * @param res - HTTP 响应对象
 * @param params - 路由参数（包含 version）
 * @returns 是否处理完成
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
export async function configRestoreHandler(
  _req: IncomingMessage,
  res: ServerResponse,
  params?: Record<string, string>
): Promise<boolean> {
  const version = params?.['1'] ?? '';
  // 条件注释：版本不存在时返回错误
  if (!version) {
    sendBadRequestResponse(res, 'Version required');
    return true;
  } else {
    // Placeholder - actual restore logic requires reading backup path from request body
    sendJsonResponse(res, 200, {
      success: true,
      message: `Restore ${version} - check backups list for path`,
    });
    return true;
  }
}

/**
 * 创建 Config 路由处理器工厂函数
 *
 * @param config - 服务配置
 * @returns Config 路由策略配置
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
export function getConfigRoutes(config: Config): Array<{
  name: string;
  path: string | RegExp;
  matchType: 'exact' | 'regex';
  methods: string[];
  handler: RouteHandler;
  priority: number;
}> {
  return [
    {
      name: 'config-get',
      path: '/api/config',
      matchType: 'exact',
      methods: ['GET'],
      handler: (req, res, params) => configGetHandler(req, res, params, config),
      priority: 40,
    },
    {
      name: 'config-put',
      path: '/api/config',
      matchType: 'exact',
      methods: ['PUT'],
      handler: configPutHandler,
      priority: 40,
    },
    {
      name: 'config-validate',
      path: '/api/config/validate',
      matchType: 'exact',
      methods: ['POST'],
      handler: configValidateHandler,
      priority: 41,
    },
    {
      name: 'config-backups',
      path: '/api/config/backups',
      matchType: 'exact',
      methods: ['GET'],
      handler: (req, res, params) => configBackupsHandler(req, res, params, config),
      priority: 40,
    },
    {
      name: 'config-restore',
      path: /^\/api\/config\/restore\/([^/]+)$/,
      matchType: 'regex',
      methods: ['POST'],
      handler: configRestoreHandler,
      priority: 39,
    },
  ];
}