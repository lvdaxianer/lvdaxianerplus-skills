/**
 * 尝试追踪类型定义
 *
 * 定义 MCP 工具调用尝试追踪的配置和数据结构。
 *
 * 功能：
 * - 当 LLM 调用工具参数不确定时，限制尝试次数
 * - 提供结构化反馈引导 LLM 正确使用工具
 * - 成功调用后清除尝试记录
 *
 * @author lvdaxianerplus
 * @date 2026-04-21
 */

/**
 * 调用提示模板配置
 *
 * 用于动态生成工具描述中的调用提示。
 * 避免在每个工具描述中手动添加提示。
 *
 * @param enabled - 是否自动生成调用提示（默认 true）
 * @param template - 模板字符串（支持占位符：{maxAttempts}, {step1}, {step2}, {step3}）
 * @param steps - 不同参数类型工具的步骤描述
 *
 * @author lvdaxianerplus
 * @date 2026-04-21
 */
export interface CallHintTemplateConfig {
  enabled: boolean;
  template?: string;
  steps?: {
    // 有必填参数的工具（除可选参数外）
    withRequired: string[];
    // 所有参数均为可选的工具
    allOptional: string[];
    // 无参数的工具
    noParams: string[];
  };
}

/**
 * 尝试追踪配置
 *
 * 当工具参数不确定时，LLM 可能多次尝试调用。
 * 此配置限制尝试次数并在超过时提供反馈。
 *
 * @param enabled - 是否启用尝试追踪（默认 true）
 * @param maxAttempts - 最大尝试次数（默认 3）
 * @param clearOnSuccess - 成功调用后是否清除记录（默认 true）
 *
 * @author lvdaxianerplus
 * @date 2026-04-21
 */
export interface AttemptTrackingConfig {
  enabled: boolean;
  maxAttempts: number;
  clearOnSuccess: boolean;
}

/**
 * 尝试记录
 *
 * 记录单个工具的调用尝试历史。
 *
 * @param count - 当前尝试计数
 * @param errors - 错误信息列表（每次失败记录一条，截取前 100 字符）
 * @param lastAttemptTime - 最后一次尝试时间戳
 *
 * @author lvdaxianerplus
 * @date 2026-04-21
 */
export interface AttemptRecord {
  count: number;
  errors: string[];
  lastAttemptTime: number;
}

/**
 * 工具调用元数据
 *
 * 返回给 LLM 的尝试状态信息。
 * 用于引导 LLM 采取正确的下一步行动。
 *
 * @param attempt_count - 当前尝试次数（1-based）
 * @param max_attempts - 最大允许尝试次数
 * @param remaining_attempts - 剩余尝试次数
 * @param previous_errors - 之前尝试的错误摘要
 * @param suggested_action - 建议下一步行动
 *
 * @author lvdaxianerplus
 * @date 2026-04-21
 */
export interface ToolCallMetadata {
  attempt_count: number;
  max_attempts: number;
  remaining_attempts: number;
  previous_errors: string[];
  suggested_action: string;
}

/**
 * 默认调用提示模板配置
 *
 * 根据工具参数类型自动生成调用提示：
 * - 有必填参数：引导先尝试已知参数，再使用默认值，最后向用户确认
 * - 全可选参数：引导先使用 domainId=1，再无参数查询，最后向用户确认
 * - 无参数：不生成提示
 *
 * 模板占位符：
 * - {maxAttempts}: 替换为最大尝试次数
 * - {step1}, {step2}, {step3}: 替换为步骤描述
 *
 * @author lvdaxianerplus
 * @date 2026-04-21
 */
export const DEFAULT_CALL_HINT_TEMPLATE: CallHintTemplateConfig = {
  enabled: true,
  template: '【调用提示】最多尝试{maxAttempts}次：{step1}；{step2}；{step3}。',
  steps: {
    // 有必填参数的工具：引导确认必填参数
    withRequired: [
      '①使用已知参数调用',
      '②使用domainId=1尝试',
      '③向用户确认缺失的必填参数',
    ],
    // 全可选参数的工具：引导使用默认值
    allOptional: [
      '①使用domainId=1查询',
      '②无参数查询全部数据',
      '③向用户确认具体需求',
    ],
    // 无参数的工具：不需要提示
    noParams: [],
  },
};

/**
 * 默认尝试追踪配置
 *
 * 当参数不确定时，LLM 可尝试最多 3 次：
 * 第 1 次：使用已知参数
 * 第 2 次：使用默认 domainId=1
 * 第 3 次：向用户确认缺失参数
 *
 * @author lvdaxianerplus
 * @date 2026-04-21
 */
export const DEFAULT_ATTEMPT_TRACKING: AttemptTrackingConfig = {
  enabled: true,
  maxAttempts: 3,
  clearOnSuccess: true,
};