/**
 * 降级条件评估器
 *
 * 用于判断 HTTP 响应是否满足降级条件。
 * 支持 JSONPath 表达式和多种比较操作符。
 *
 * @author lvdaxianerplus
 * @date 2026-04-21
 */

import type { FallbackCondition, FallbackConditionConfig } from '../config/types.js';
import { logger } from '../middleware/logger.js';
import { getDatabase } from '../database/connection.js';

/**
 * 降级条件评估结果
 *
 * @param shouldFallback - 是否应该触发降级
 * @param matchedCondition - 匹配的条件（如果有）
 * @param reason - 降级原因描述
 *
 * @author lvdaxianerplus
 * @date 2026-04-21
 */
export interface FallbackEvalResult {
  shouldFallback: boolean;
  matchedCondition?: FallbackCondition;
  reason?: string;
}

/**
 * 内存缓存的降级条件配置
 *
 * @author lvdaxianerplus
 * @date 2026-04-21
 */
let cachedConditions: FallbackConditionConfig | null = null;

/**
 * 加载降级条件配置
 *
 * 从 SQLite 数据库加载全局降级条件配置。
 *
 * @returns 降级条件配置对象
 *
 * @author lvdaxianerplus
 * @date 2026-04-21
 */
export function loadFallbackConditions(): FallbackConditionConfig | null {
  const db = getDatabase();

  // 条件注释：数据库不可用时返回内存缓存或默认配置
  if (!db) {
    logger.warn('[降级条件] Database not available, using cached conditions');
    return cachedConditions;
  } else {
    // 数据库可用，加载配置
    try {
      const row = db.prepare(`
        SELECT conditions_json, enabled
        FROM fallback_conditions
        WHERE name = 'global'
      `).get() as { conditions_json: string; enabled: number } | undefined;

      // 条件注释：数据库中有配置时解析返回，无配置时返回 null
      if (row) {
        const conditions = JSON.parse(row.conditions_json) as FallbackConditionConfig;
        conditions.enabled = row.enabled === 1;
        cachedConditions = conditions;
        logger.info('[降级条件] Loaded from database', { enabled: conditions.enabled, count: conditions.conditions.length });
        return conditions;
      } else {
        // 数据库中无配置，返回 null
        logger.info('[降级条件] No configuration found in database');
        return null;
      }
    } catch (error) {
      logger.error('[降级条件] Failed to load conditions', { error });
      return cachedConditions;
    }
  }
}

/**
 * 保存降级条件配置
 *
 * 将全局降级条件配置保存到 SQLite 数据库。
 *
 * @param config - 降级条件配置对象
 *
 * @author lvdaxianerplus
 * @date 2026-04-21
 */
export function saveFallbackConditions(config: FallbackConditionConfig): void {
  const db = getDatabase();

  // 更新内存缓存
  cachedConditions = config;

  // 条件注释：数据库不可用时仅更新内存缓存
  if (!db) {
    logger.warn('[降级条件] Database not available, only cached in memory');
    return;
  } else {
    // 数据库可用，持久化配置
    try {
      const conditionsJson = JSON.stringify(config);
      const enabled = config.enabled ? 1 : 0;

      db.prepare(`
        INSERT OR REPLACE INTO fallback_conditions (name, enabled, conditions_json, description, updated_at)
        VALUES ('global', ?, ?, '全局降级条件模板', datetime('now'))
      `).run(enabled, conditionsJson);

      logger.info('[降级条件] Saved to database', { enabled: config.enabled, count: config.conditions.length });
    } catch (error) {
      logger.error('[降级条件] Failed to save conditions', { error });
    }
  }
}

/**
 * 使用 JSONPath 提取值
 *
 * 简化版 JSONPath 实现，支持基本的路径表达式。
 *
 * 支持的路径格式：
 * - $.field - 获取根对象的 field 属性
 * - $.nested.field - 获取嵌套属性
 * - $.array[0] - 获取数组第一个元素
 * - $.array.length - 获取数组长度
 *
 * @param data - 数据对象
 * @param expression - JSONPath 表达式
 * @returns 提取的值或 undefined
 *
 * @author lvdaxianerplus
 * @date 2026-04-21
 */
export function extractValue(data: unknown, expression: string): unknown {
  // 条件注释：表达式不以 $. 开头时直接返回 undefined
  if (!expression.startsWith('$.')) {
    logger.warn('[降级条件] Invalid JSONPath expression', { expression });
    return undefined;
  } else {
    // 表达式有效，开始解析
    const path = expression.slice(2); // 移除 $. 前缀
    const parts = path.split('.');
    let current: unknown = data;

    for (const part of parts) {
      // 处理数组索引 [n]
      const arrayMatch = part.match(/^(\w+)\[(\d+)\]$|^length$/);

      // 条件注释：匹配数组索引或 length 属性
      if (arrayMatch) {
        // 条件注释：匹配 length 时返回数组长度
        if (part === 'length') {
          // 条件注释：当前值是数组时返回长度，不是数组时返回 undefined
          if (Array.isArray(current)) {
            return current.length;
          } else {
            return undefined;
          }
        } else {
          // 匹配数组索引 fieldName[n]
          const fieldName = arrayMatch[1];
          const index = parseInt(arrayMatch[2], 10);

          // 条件注释：当前值是对象且有 fieldName 属性时获取数组元素
          if (current && typeof current === 'object' && fieldName in current) {
            const arr = (current as Record<string, unknown>)[fieldName];
            // 条件注释：arr 是数组且索引有效时返回元素
            if (Array.isArray(arr) && index >= 0 && index < arr.length) {
              current = arr[index];
            } else {
              return undefined;
            }
          } else {
            return undefined;
          }
        }
      } else {
        // 普通属性访问
        // 条件注释：当前值是对象且有该属性时继续遍历，否则返回 undefined
        if (current && typeof current === 'object' && part in current) {
          current = (current as Record<string, unknown>)[part];
        } else {
          return undefined;
        }
      }
    }

    return current;
  }
}

/**
 * 比较两个值
 *
 * 根据操作符比较提取值和目标值。
 *
 * @param actual - 实际提取的值
 * @param operator - 比较操作符
 * @param expected - 期望值
 * @returns 比较结果
 *
 * @author lvdaxianerplus
 * @date 2026-04-21
 */
export function compareValues(actual: unknown, operator: string, expected: unknown): boolean {
  // 条件注释：actual 为 undefined 时，只有 empty 操作符返回 true
  if (actual === undefined) {
    return operator === 'empty';
  } else {
    // actual 有值，根据操作符比较
    switch (operator) {
      case '==':
        // 松散相等比较
        return actual == expected;

      case '!=':
        // 松散不等比较
        return actual != expected;

      case '>':
        // 大于比较（数值）
        return typeof actual === 'number' && typeof expected === 'number' && actual > expected;

      case '<':
        // 小于比较（数值）
        return typeof actual === 'number' && typeof expected === 'number' && actual < expected;

      case '>=':
        // 大于等于比较（数值）
        return typeof actual === 'number' && typeof expected === 'number' && actual >= expected;

      case '<=':
        // 小于等于比较（数值）
        return typeof actual === 'number' && typeof expected === 'number' && actual <= expected;

      case 'contains':
        // 包含比较（字符串或数组）
        if (typeof actual === 'string' && typeof expected === 'string') {
          return actual.includes(expected);
        } else if (Array.isArray(actual)) {
          return actual.includes(expected);
        } else {
          return false;
        }

      case 'empty':
        // 空值判断
        if (actual === null || actual === undefined) {
          return true;
        } else if (typeof actual === 'string') {
          return actual === '';
        } else if (Array.isArray(actual)) {
          return actual.length === 0;
        } else if (typeof actual === 'object') {
          return Object.keys(actual).length === 0;
        } else {
          return false;
        }

      case 'not_empty':
        // 非空判断
        if (actual === null || actual === undefined) {
          return false;
        } else if (typeof actual === 'string') {
          return actual !== '';
        } else if (Array.isArray(actual)) {
          return actual.length > 0;
        } else if (typeof actual === 'object') {
          return Object.keys(actual).length > 0;
        } else {
          return true;
        }

      default:
        // 未知操作符，返回 false
        logger.warn('[降级条件] Unknown operator', { operator });
        return false;
    }
  }
}

/**
 * 评估响应是否触发降级
 *
 * 检查响应数据是否满足任一降级条件。
 *
 * @param responseData - HTTP 响应数据
 * @param conditions - 降级条件配置（可选，默认从数据库加载）
 * @returns 评估结果
 *
 * @author lvdaxianerplus
 * @date 2026-04-21
 */
export function evaluateFallbackConditions(
  responseData: unknown,
  conditions?: FallbackConditionConfig | null
): FallbackEvalResult {
  // 获取降级条件配置
  const config = conditions ?? loadFallbackConditions();

  // 条件注释：配置不存在或未启用时，不触发降级
  if (!config || !config.enabled || config.conditions.length === 0) {
    return { shouldFallback: false };
  } else {
    // 配置存在且启用，遍历条件评估
    for (const condition of config.conditions) {
      // 提取值
      const actualValue = extractValue(responseData, condition.expression);

      // 比较
      const matches = compareValues(actualValue, condition.operator, condition.value);

      // 条件注释：匹配任一条件时返回降级结果
      if (matches) {
        const reason = condition.description ?? `条件匹配: ${condition.expression} ${condition.operator} ${condition.value}`;
        logger.info('[降级条件] Condition matched, triggering fallback', {
          expression: condition.expression,
          operator: condition.operator,
          expected: condition.value,
          actual: actualValue,
          reason
        });
        return {
          shouldFallback: true,
          matchedCondition: condition,
          reason
        };
      } else {
        // 条件不匹配，继续检查下一个条件
      }
    }

    // 所有条件都不匹配
    return { shouldFallback: false };
  }
}

/**
 * 获取当前缓存的降级条件配置
 *
 * @returns 缓存的降级条件配置
 *
 * @author lvdaxianerplus
 * @date 2026-04-21
 */
export function getCachedFallbackConditions(): FallbackConditionConfig | null {
  return cachedConditions;
}