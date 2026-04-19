/**
 * 路由策略模块 - 定义路由匹配和处理策略
 *
 * Features:
 * - 路由策略表模式替代 if-else 链
 * - 支持路径匹配（精确匹配、正则匹配、前缀匹配）
 * - 方法过滤（GET、POST、PUT、DELETE）
 * - 统一的请求处理接口
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */

import type { IncomingMessage, ServerResponse } from 'http';

/**
 * 路由处理函数类型
 *
 * @param req - HTTP 请求对象
 * @param res - HTTP 响应对象
 * @param params - 路由参数（正则匹配时提取的参数）
 * @returns 是否处理完成
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
export type RouteHandler = (
  req: IncomingMessage,
  res: ServerResponse,
  params?: Record<string, string>
) => Promise<boolean> | boolean;

/**
 * 路由匹配类型
 * - exact: 精确匹配路径
 * - regex: 正则表达式匹配
 * - prefix: 前缀匹配（路径开头）
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
export type RouteMatchType = 'exact' | 'regex' | 'prefix';

/**
 * 路由策略配置
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
export interface RouteStrategy {
  /**
   * 路由名称（用于日志和调试）
   */
  name: string;

  /**
   * 路径匹配规则
   */
  path: string | RegExp;

  /**
   * 匹配类型
   */
  matchType: RouteMatchType;

  /**
   * 允许的 HTTP 方法（不设置则允许所有方法）
   */
  methods?: string[];

  /**
   * 处理函数
   */
  handler: RouteHandler;

  /**
   * 路由优先级（数字越大优先级越高）
   */
  priority?: number;
}

/**
 * 路由策略表 - 使用策略模式管理所有路由
 *
 * Usage:
 * ```typescript
 * const router = new RouterStrategyTable();
 * router.register({
 *   name: 'health',
 *   path: '/health',
 *   matchType: 'exact',
 *   methods: ['GET'],
 *   handler: healthHandler
 * });
 * router.handle(req, res);
 * ```
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
export class RouterStrategyTable {
  /**
   * 路由策略列表（按优先级排序）
   *
   * @author lvdaxianerplus
   * @date 2026-04-19
   */
  private routes: RouteStrategy[] = [];

  /**
   * 注册路由策略
   *
   * @param strategy - 路由策略配置
   *
   * @author lvdaxianerplus
   * @date 2026-04-19
   */
  register(strategy: RouteStrategy): void {
    // 条件注释：已有优先级设置时直接添加，未设置时使用默认优先级
    if (strategy.priority) {
      this.routes.push(strategy);
    } else {
      // 未设置优先级，使用默认值 0
      strategy.priority = 0;
      this.routes.push(strategy);
    }

    // 按优先级排序（数字越大优先级越高）
    this.routes.sort((a, b) => {
      const priorityA = a.priority ?? 0;
      const priorityB = b.priority ?? 0;
      // 条件注释：比较优先级，降序排列
      if (priorityA > priorityB) {
        return -1;
      } else if (priorityA < priorityB) {
        return 1;
      } else {
        // 优先级相同，保持原有顺序
        return 0;
      }
    });
  }

  /**
   * 批量注册路由策略
   *
   * @param strategies - 路由策略配置数组
   *
   * @author lvdaxianerplus
   * @date 2026-04-19
   */
  registerAll(strategies: RouteStrategy[]): void {
    strategies.forEach((strategy) => this.register(strategy));
  }

  /**
   * 匹配路由并执行处理
   *
   * @param pathname - 请求路径
   * @param method - HTTP 方法
   * @param req - HTTP 请求对象
   * @param res - HTTP 响应对象
   * @returns 是否找到匹配路由
   *
   * @author lvdaxianerplus
   * @date 2026-04-19
   */
  async matchAndHandle(
    pathname: string,
    method: string,
    req: IncomingMessage,
    res: ServerResponse
  ): Promise<boolean> {
    // 遍历所有路由策略（已按优先级排序）
    for (const route of this.routes) {
      // 条件注释：方法不匹配时跳过，匹配时继续路径匹配
      if (route.methods && !route.methods.includes(method)) {
        // 方法不匹配，继续下一个路由
        continue;
      } else {
        // 方法匹配或无方法限制，进行路径匹配
      }

      // 路径匹配
      const matchResult = this.matchPath(route, pathname);
      // 条件注释：路径匹配成功时执行处理器，失败时继续下一个路由
      if (matchResult.matched) {
        const handled = await route.handler(req, res, matchResult.params);
        // 条件注释：处理器返回 true 表示已处理，false 表示继续匹配
        if (handled) {
          return true;
        } else {
          // 处理器未处理，继续匹配下一个路由
          continue;
        }
      } else {
        // 路径不匹配，继续下一个路由
        continue;
      }
    }

    // 未找到匹配路由
    return false;
  }

  /**
   * 路径匹配（根据匹配类型）
   *
   * @param route - 路由策略
   * @param pathname - 请求路径
   * @returns 匹配结果（是否匹配、提取参数）
   *
   * @author lvdaxianerplus
   * @date 2026-04-19
   */
  private matchPath(
    route: RouteStrategy,
    pathname: string
  ): { matched: boolean; params?: Record<string, string> } {
    // 条件注释：根据匹配类型选择不同匹配策略
    if (route.matchType === 'exact') {
      // 精确匹配：路径完全相等
      const matched = pathname === route.path;
      // 条件注释：匹配成功返回 true，失败返回 false
      if (matched) {
        return { matched: true, params: {} };
      } else {
        return { matched: false };
      }
    } else if (route.matchType === 'regex') {
      // 正则匹配：提取参数
      const regex = route.path as RegExp;
      const result = regex.exec(pathname);
      // 条件注释：正则匹配成功时提取参数，失败时返回不匹配
      if (result) {
        const params: Record<string, string> = {};
        // 提取命名捕获组
        for (const [key, value] of Object.entries(result.groups ?? {})) {
          params[key] = value;
        }
        // 提取位置捕获组
        for (let i = 1; i < result.length; i++) {
          params[i.toString()] = result[i];
        }
        return { matched: true, params };
      } else {
        return { matched: false };
      }
    } else if (route.matchType === 'prefix') {
      // 前缀匹配：路径开头匹配
      const prefix = route.path as string;
      const matched = pathname.startsWith(prefix);
      // 条件注释：前缀匹配成功返回 true 和剩余路径，失败返回不匹配
      if (matched) {
        const remaining = pathname.slice(prefix.length);
        return { matched: true, params: { remaining } };
      } else {
        return { matched: false };
      }
    } else {
      // 未知的匹配类型，返回不匹配
      return { matched: false };
    }
  }

  /**
   * 获取所有路由（用于调试）
   *
   * @returns 路由策略列表
   *
   * @author lvdaxianerplus
   * @date 2026-04-19
   */
  getRoutes(): RouteStrategy[] {
    return this.routes;
  }

  /**
   * 清空所有路由
   *
   * @author lvdaxianerplus
   * @date 2026-04-19
   */
  clear(): void {
    this.routes = [];
  }
}

/**
 * 创建路由策略的辅助函数
 *
 * @param config - 路由策略配置
 * @returns 路由策略对象
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
export function createRoute(config: RouteStrategy): RouteStrategy {
  return config;
}

/**
 * 创建精确匹配路由的辅助函数
 *
 * @param name - 路由名称
 * @param path - 路径
 * @param methods - HTTP 方法
 * @param handler - 处理函数
 * @param priority - 优先级
 * @returns 路由策略对象
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
export function exactRoute(
  name: string,
  path: string,
  methods: string[],
  handler: RouteHandler,
  priority: number = 0
): RouteStrategy {
  return createRoute({
    name,
    path,
    matchType: 'exact',
    methods,
    handler,
    priority,
  });
}

/**
 * 创建正则匹配路由的辅助函数
 *
 * @param name - 路由名称
 * @param pattern - 正则表达式
 * @param methods - HTTP 方法
 * @param handler - 处理函数
 * @param priority - 优先级
 * @returns 路由策略对象
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
export function regexRoute(
  name: string,
  pattern: RegExp,
  methods: string[],
  handler: RouteHandler,
  priority: number = 0
): RouteStrategy {
  return createRoute({
    name,
    path: pattern,
    matchType: 'regex',
    methods,
    handler,
    priority,
  });
}

/**
 * 创建前缀匹配路由的辅助函数
 *
 * @param name - 路由名称
 * @param prefix - 前缀路径
 * @param methods - HTTP 方法
 * @param handler - 处理函数
 * @param priority - 优先级
 * @returns 路由策略对象
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
export function prefixRoute(
  name: string,
  prefix: string,
  methods: string[],
  handler: RouteHandler,
  priority: number = 0
): RouteStrategy {
  return createRoute({
    name,
    path: prefix,
    matchType: 'prefix',
    methods,
    handler,
    priority,
  });
}