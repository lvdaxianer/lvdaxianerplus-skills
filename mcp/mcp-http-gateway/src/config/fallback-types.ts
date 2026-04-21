/**
 * 服务降级类型定义
 *
 * 定义 MCP HTTP Gateway 的服务降级策略。
 *
 * 降级链：
 * 真实服务 → 缓存降级（忽略 TTL） → Mock 降级 → 错误
 *
 * @author lvdaxianerplus
 * @date 2026-04-21
 */

/**
 * 降级条件配置
 *
 * 定义基于返回值的降级判断条件。
 * 支持 JSONPath 表达式判断返回值是否触发降级。
 *
 * 使用场景：
 * - HTTP 状态码正常但返回值异常（如 $.data == false）
 * - 业务逻辑错误需要降级（如 $.code != 200）
 *
 * @param enabled - 是否启用返回值降级判断
 * @param conditions - 降级条件列表（满足任一条件即触发降级）
 *
 * 条件表达式语法：
 * - $.data == false  // data 字段为 false
 * - $.code != 200    // code 不等于 200
 * - $.success == false  // success 为 false
 * - $.data.length == 0  // data 数组为空
 *
 * @author lvdaxianerplus
 * @date 2026-04-21
 */
export interface FallbackConditionConfig {
  enabled: boolean;
  conditions: FallbackCondition[];
}

/**
 * 单个降级条件
 *
 * @param expression - JSONPath 表达式（如 $.data）
 * @param operator - 比较操作符：==、!=、>、<、>=、<=、contains、empty
 * @param value - 比较值
 * @param description - 条件描述（用于日志和提示）
 *
 * @author lvdaxianerplus
 * @date 2026-04-21
 */
export interface FallbackCondition {
  expression: string;
  operator: '==' | '!=' | '>' | '<' | '>=' | '<=' | 'contains' | 'empty' | 'not_empty';
  value: unknown;
  description?: string;
}

/**
 * 降级配置
 *
 * 定义服务调用失败时的降级策略。
 *
 * 降级流程：
 * 1. 真实服务调用失败
 * 2. 尝试使用缓存数据（即使已过期）
 * 3. 尝试使用 Mock 数据
 * 4. 返回错误信息
 *
 * @param enabled - 是否启用降级机制
 * @param useExpiredCache - 是否使用过期缓存降级（默认 true）
 * @param useMockAsFallback - 是否使用 Mock 降级（默认 true）
 * @param responseConditions - 返回值降级条件配置
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
export interface FallbackConfig {
  enabled: boolean;
  useExpiredCache: boolean;
  useMockAsFallback: boolean;
  responseConditions?: FallbackConditionConfig;
}

/**
 * 执行结果来源标识
 *
 * 标识响应数据的来源，用于追踪降级路径。
 *
 * 取值：
 * - 'real': 真实服务调用成功
 * - 'fallback_cache': 缓存降级（服务失败）
 * - 'fallback_mock': Mock 降级（服务 + 缓存失败）
 * - 'error': 所有降级耗尽，返回错误
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
export type ResultSource = 'real' | 'fallback_cache' | 'fallback_mock' | 'error';

/**
 * 默认降级配置
 *
 * 缓存 GET 数据用于快速降级备用，非查询加速。
 * 过期缓存数据在降级场景仍有价值。
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
export const DEFAULT_FALLBACK: FallbackConfig = {
  enabled: true,
  useExpiredCache: true,
  useMockAsFallback: true,
};