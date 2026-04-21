/**
 * 尝试追踪模块
 *
 * 当工具参数不确定时，LLM 可能多次尝试调用。
 * 此模块限制尝试次数并提供反馈。
 *
 * 功能：
 * - 记录每次工具调用尝试
 * - 超过最大次数时生成结构化反馈
 * - 成功调用后清除记录
 *
 * @author lvdaxianerplus
 * @date 2026-04-21
 */

import type { ToolConfig, AttemptTrackingConfig, AttemptRecord, ToolCallMetadata } from '../config/types.js';
import { DEFAULT_ATTEMPT_TRACKING } from '../config/types.js';
import { logger } from '../middleware/logger.js';

/**
 * 全局尝试记录 Map
 *
 * Key: toolName（工具名称）
 * Value: AttemptRecord（尝试记录）
 *
 * 说明：使用工具名称作为 key，简化实现。
 * 如需支持多 session，可扩展为 session + toolName。
 *
 * @author lvdaxianerplus
 * @date 2026-04-21
 */
const toolAttempts: Map<string, AttemptRecord> = new Map();

/**
 * 记录一次尝试
 *
 * 功能：增加尝试计数，记录错误信息（如有）。
 *
 * @param toolName - 工具名称
 * @param error - 错误信息（可选，截取前 100 字符）
 * @returns 更新后的尝试记录
 *
 * @author lvdaxianerplus
 * @date 2026-04-21
 */
export function recordAttempt(toolName: string, error?: string): AttemptRecord {
  // 获取现有记录或创建新记录
  const record = toolAttempts.get(toolName) ?? { count: 0, errors: [], lastAttemptTime: 0 };

  // 增加尝试计数
  record.count++;

  // 记录尝试时间
  record.lastAttemptTime = Date.now();

  // 条件注释：有错误时添加到错误列表（截取前 100 字符避免过长）
  if (error) {
    record.errors.push(error.slice(0, 100));
  } else {
    // 无错误信息，跳过
  }

  // 保存更新后的记录
  toolAttempts.set(toolName, record);

  return record;
}

/**
 * 清除尝试记录
 *
 * 功能：工具调用成功后清除该工具的尝试记录。
 * 触发条件：attemptConfig.clearOnSuccess === true。
 *
 * @param toolName - 工具名称
 *
 * @author lvdaxianerplus
 * @date 2026-04-21
 */
export function clearAttempt(toolName: string): void {
  // 从 Map 中删除记录
  toolAttempts.delete(toolName);

  // 记录日志（调试级别）
  logger.debug('[尝试追踪] 清除尝试记录', { toolName });
}

/**
 * 获取当前尝试记录
 *
 * 功能：查询工具的当前尝试状态。
 *
 * @param toolName - 工具名称
 * @returns 尝试记录（不存在时返回默认值）
 *
 * @author lvdaxianerplus
 * @date 2026-04-21
 */
export function getAttemptRecord(toolName: string): AttemptRecord {
  // 条件注释：记录存在时返回，否则返回默认值
  const record = toolAttempts.get(toolName);

  if (record) {
    return record;
  } else {
    // 返回默认空记录
    return { count: 0, errors: [], lastAttemptTime: 0 };
  }
}

/**
 * 生成超过尝试次数的反馈
 *
 * 功能：当尝试次数超过限制时，生成结构化反馈文本。
 * 内容包括：工具名称、描述、尝试次数、错误历史、参数信息、建议。
 *
 * @param toolName - 工具名称
 * @param tool - 工具配置
 * @param record - 尝试记录
 * @param maxAttempts - 最大尝试次数
 * @returns 结构化反馈文本
 *
 * @author lvdaxianerplus
 * @date 2026-04-21
 */
export function generateExceededFeedback(
  toolName: string,
  tool: ToolConfig,
  record: AttemptRecord,
  maxAttempts: number
): string {
  // 初始化参数列表
  const requiredParams: string[] = [];
  const optionalParams: string[] = [];

  // 条件注释：从 body 中提取必填和可选参数
  if (tool.body) {
    for (const [name, def] of Object.entries(tool.body)) {
      // 条件注释：必填参数添加到 requiredParams
      if (def.required) {
        requiredParams.push(name);
      } else {
        // 可选参数添加到 optionalParams（带描述）
        optionalParams.push(`${name} (${def.description})`);
      }
    }
  } else {
    // 无 body 定义，跳过
  }

  // 构建反馈文本行
  const lines: string[] = [
    `【尝试次数已用尽】`,
    '',
    `工具: ${toolName}`,
    `描述: ${tool.description.split('【')[0].trim()}`,
    `尝试次数: ${record.count}/${maxAttempts}`,
    '',
    `失败历史摘要:`,
  ];

  // 条件注释：有错误历史时添加摘要
  if (record.errors.length > 0) {
    record.errors.forEach((e, i) => {
      lines.push(`  ${i + 1}. ${e}`);
    });
  } else {
    // 无错误历史，添加提示
    lines.push('  (无错误记录)');
  }

  // 添加原始错误和分隔行
  lines.push('');
  lines.push(`原始错误: ${record.errors[record.errors.length - 1] ?? '无'}`);
  lines.push('');
  lines.push('建议:');

  // 条件注释：有必填参数时添加提示
  if (requiredParams.length > 0) {
    lines.push(`- 必填参数: ${requiredParams.join(', ')}`);
  } else {
    // 无必填参数，添加提示
    lines.push('- 所有参数均为可选');
  }

  // 条件注释：有可选参数时添加提示
  if (optionalParams.length > 0) {
    lines.push(`- 可选参数: ${optionalParams.join(', ')}`);
  } else {
    // 无可选参数，跳过
  }

  // 添加最终建议
  lines.push('- 建议使用默认值 domainId=1 进行查询');
  lines.push('- 或向用户确认缺失参数后重新调用');

  // 拼接为完整文本
  return lines.join('\n');
}

/**
 * 构建工具调用元数据
 *
 * 功能：生成 attempt tracking 返回的 metadata 结构。
 * 用于告知 LLM 当前尝试状态和建议行动。
 *
 * @param attemptCount - 当前尝试次数（1-based）
 * @param maxAttempts - 最大尝试次数
 * @param previousErrors - 之前的错误列表
 * @returns 工具调用元数据
 *
 * @author lvdaxianerplus
 * @date 2026-04-21
 */
export function buildMetadata(
  attemptCount: number,
  maxAttempts: number,
  previousErrors: string[]
): ToolCallMetadata {
  // 计算剩余次数
  const remaining = maxAttempts - attemptCount;

  // 条件注释：还有剩余次数时建议继续尝试，否则建议向用户确认
  let suggestedAction: string;

  if (remaining > 0) {
    suggestedAction = `还可尝试 ${remaining} 次，建议使用默认参数 domainId=1`;
  } else {
    suggestedAction = '已达最大尝试次数，请向用户确认参数后重新调用';
  }

  // 返回 metadata 结构
  return {
    attempt_count: attemptCount,
    max_attempts: maxAttempts,
    remaining_attempts: remaining,
    previous_errors: previousErrors,
    suggested_action: suggestedAction,
  };
}

/**
 * 获取尝试追踪配置
 *
 * 功能：从配置中提取 attempt tracking 配置，使用默认值填充缺失字段。
 *
 * @param config - 全局配置（可能缺失 attemptTracking 字段）
 * @returns 完整的尝试追踪配置
 *
 * @author lvdaxianerplus
 * @date 2026-04-21
 */
export function getAttemptConfig(config: { attemptTracking?: AttemptTrackingConfig }): AttemptTrackingConfig {
  // 条件注释：配置存在时使用，否则使用默认值
  if (config.attemptTracking) {
    return {
      enabled: config.attemptTracking.enabled ?? DEFAULT_ATTEMPT_TRACKING.enabled,
      maxAttempts: config.attemptTracking.maxAttempts ?? DEFAULT_ATTEMPT_TRACKING.maxAttempts,
      clearOnSuccess: config.attemptTracking.clearOnSuccess ?? DEFAULT_ATTEMPT_TRACKING.clearOnSuccess,
    };
  } else {
    // 使用默认配置
    return DEFAULT_ATTEMPT_TRACKING;
  }
}