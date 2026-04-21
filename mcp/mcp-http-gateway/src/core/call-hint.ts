/**
 * 调用提示模块
 *
 * 根据工具参数类型动态生成调用提示，引导 LLM 正确使用工具。
 *
 * 功能：
 * - 判断工具参数类型（有必填/全可选/无参数）
 * - 根据参数类型生成对应调用提示
 * - 为工具描述添加调用提示
 *
 * @author lvdaxianerplus
 * @date 2026-04-21
 */

import type { ToolConfig, CallHintTemplateConfig } from '../config/types.js';
import { DEFAULT_CALL_HINT_TEMPLATE } from '../config/types.js';

/**
 * 工具参数类型枚举
 *
 * 用于区分不同参数类型的工具，生成对应提示策略。
 *
 * - 'withRequired': 有必填参数的工具（除可选参数外）
 * - 'allOptional': 所有参数均为可选的工具
 * - 'noParams': 无参数的工具
 *
 * @author lvdaxianerplus
 * @date 2026-04-21
 */
export type ToolParamType = 'withRequired' | 'allOptional' | 'noParams';

/**
 * 判断工具参数类型
 *
 * 功能：根据工具的 body 和 queryParams 定义判断参数类型。
 *
 * 判断逻辑：
 * 1. 无 body 且无 queryParams → 'noParams'
 * 2. 有必填参数 → 'withRequired'
 * 3. 有参数但无必填 → 'allOptional'
 *
 * @param tool - 工具配置
 * @returns 参数类型枚举值
 *
 * @author lvdaxianerplus
 * @date 2026-04-21
 */
export function getToolParamType(tool: ToolConfig): ToolParamType {
  // 条件注释：无 body 且无 queryParams 时为无参数工具
  if (!tool.body && !tool.queryParams) {
    return 'noParams';
  } else {
    // 有参数定义，继续检查
  }

  // 定义必填参数检查函数
  const hasRequired = (params: Record<string, { required?: boolean }> | undefined): boolean => {
    // 条件注释：参数定义不存在时返回 false
    if (!params) {
      return false;
    } else {
      // 参数定义存在，检查是否有必填参数
    }

    // 遍历参数，检查 required 标识
    return Object.values(params).some((def) => def.required === true);
  };

  // 条件注释：body 或 queryParams 中有必填参数时返回 'withRequired'
  if (hasRequired(tool.body) || hasRequired(tool.queryParams)) {
    return 'withRequired';
  } else {
    // 无必填参数，检查是否有可选参数
  }

  // 条件注释：有参数定义但无必填参数时返回 'allOptional'
  const hasAnyParams = (tool.body && Object.keys(tool.body).length > 0) ||
                       (tool.queryParams && Object.keys(tool.queryParams).length > 0);

  if (hasAnyParams) {
    return 'allOptional';
  } else {
    // 无参数定义（可能是空对象）
    return 'noParams';
  }
}

/**
 * 生成调用提示
 *
 * 功能：根据工具参数类型和配置模板生成调用提示文本。
 *
 * 提示策略：
 * - 有必填参数：引导先尝试已知参数，再使用默认值，最后向用户确认
 * - 全可选参数：引导先使用 domainId=1，再无参数查询，最后向用户确认
 * - 无参数：不生成提示
 *
 * @param tool - 工具配置
 * @param hintConfig - 调用提示配置
 * @param maxAttempts - 最大尝试次数
 * @returns 调用提示文本（无参数工具返回空字符串）
 *
 * @author lvdaxianerplus
 * @date 2026-04-21
 */
export function generateCallHint(
  tool: ToolConfig,
  hintConfig: CallHintTemplateConfig,
  maxAttempts: number
): string {
  // 条件注释：未启用时返回空字符串
  if (!hintConfig.enabled) {
    return '';
  } else {
    // 已启用，继续处理
  }

  // 获取工具参数类型
  const paramType = getToolParamType(tool);

  // 条件注释：无参数工具不需要提示
  if (paramType === 'noParams') {
    return '';
  } else {
    // 有参数工具，生成提示
  }

  // 获取步骤配置（优先使用用户配置，其次使用默认值）
  const steps = hintConfig.steps?.[paramType] ?? DEFAULT_CALL_HINT_TEMPLATE.steps?.[paramType] ?? [];

  // 条件注释：无步骤配置时返回空字符串
  if (steps.length === 0) {
    return '';
  } else {
    // 有步骤配置，继续处理
  }

  // 获取模板（优先使用用户配置，其次使用默认值）
  const template = hintConfig.template ?? DEFAULT_CALL_HINT_TEMPLATE.template ?? '';

  // 条件注释：无模板时返回空字符串
  if (!template) {
    return '';
  } else {
    // 有模板，继续处理
  }

  // 替换模板中的占位符
  let hint = template.replace('{maxAttempts}', String(maxAttempts));

  // 条件注释：替换三个步骤占位符
  steps.forEach((step, index) => {
    const placeholder = `{step${index + 1}}`;
    hint = hint.replace(placeholder, step);
  });

  return hint;
}

/**
 * 为工具描述添加调用提示
 *
 * 功能：将调用提示追加到工具描述末尾。
 * 如果描述已包含提示标记，则跳过添加。
 *
 * @param description - 原始描述
 * @param hint - 调用提示
 * @returns 添加提示后的描述（已有提示时返回原描述）
 *
 * @author lvdaxianerplus
 * @date 2026-04-21
 */
export function addCallHintToDescription(description: string, hint: string): string {
  // 条件注释：无提示或描述已有提示标记时返回原描述
  if (!hint || description.includes('【调用提示】')) {
    return description;
  } else {
    // 有提示且描述无提示，添加提示
  }

  // 添加提示到描述末尾（使用空格分隔）
  return `${description} ${hint}`;
}

/**
 * 获取调用提示配置
 *
 * 功能：从配置中提取 call hint 配置，使用默认值填充缺失字段。
 *
 * @param config - 全局配置（可能缺失 callHintTemplate 字段）
 * @returns 完整的调用提示配置
 *
 * @author lvdaxianerplus
 * @date 2026-04-21
 */
export function getHintConfig(config: { callHintTemplate?: CallHintTemplateConfig }): CallHintTemplateConfig {
  // 条件注释：配置存在时使用，否则使用默认值
  if (config.callHintTemplate) {
    return {
      enabled: config.callHintTemplate.enabled ?? DEFAULT_CALL_HINT_TEMPLATE.enabled,
      template: config.callHintTemplate.template ?? DEFAULT_CALL_HINT_TEMPLATE.template,
      steps: config.callHintTemplate.steps ?? DEFAULT_CALL_HINT_TEMPLATE.steps,
    };
  } else {
    // 使用默认配置
    return DEFAULT_CALL_HINT_TEMPLATE;
  }
}