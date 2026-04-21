/**
 * 参数验证模块
 *
 * 检查工具调用请求中是否包含所有必填参数。
 *
 * 功能：
 * - 验证路径参数（从 path 中提取）
 * - 验证 Body 参数（仅检查 required=true）
 * - 返回缺失参数列表
 *
 * @author lvdaxianerplus
 * @date 2026-04-21
 */

import type { ToolConfig } from '../config/types.js';

/**
 * 验证必填参数
 *
 * 功能：检查请求参数中是否包含所有必填参数。
 *
 * 检查范围：
 * 1. 路径参数：从 path 中提取 {paramName}，均为必填
 * 2. Body 参数：仅检查 required=true 的参数
 *
 * 注意事项：
 * - queryParams 参数通常不单独验证（由 executor 处理）
 * - args 为 undefined 时视为无参数
 * - 参数值 undefined 视为缺失
 *
 * @param tool - 工具配置（包含 path、body 定义）
 * @param args - 请求参数对象（可能为 undefined）
 * @returns 缺失的参数名称列表（空数组表示全部完整）
 *
 * @author lvdaxianerplus
 * @date 2026-04-21
 */
export function validateRequiredParams(
  tool: ToolConfig,
  args: Record<string, unknown> | undefined
): string[] {
  // 初始化缺失参数列表
  const missingParams: string[] = [];

  // ===== 步骤 1：检查路径参数 =====
  // 从 path 中提取路径参数（匹配 {paramName} 格式）
  const pathParams = tool.path.match(/\{(\w+)\}/g) ?? [];

  // 条件注释：遍历路径参数，检查是否在 args 中缺失
  for (const param of pathParams) {
    // 去除花括号获取参数名称
    const paramName = param.replace(/[{}]/g, '');

    // 检查参数是否存在
    // 条件注释：args 为 undefined 或参数值为 undefined 时视为缺失
    if (args?.[paramName] === undefined) {
      // 参数缺失，添加到缺失列表
      missingParams.push(paramName);
    } else {
      // 参数存在，跳过处理
    }
  }

  // ===== 步骤 2：检查 Body 参数 =====
  // 条件注释：有 body 定义时检查必填参数
  if (tool.body) {
    // 遍历所有 Body 参数定义
    for (const [paramName, def] of Object.entries(tool.body)) {
      // 条件注释：仅检查必填参数是否缺失
      // 同时满足两个条件才添加到缺失列表：
      // 1. def.required === true（参数定义为必填）
      // 2. args?.[paramName] === undefined（参数值缺失）
      if (def.required && args?.[paramName] === undefined) {
        // 必填参数缺失，添加到缺失列表
        missingParams.push(paramName);
      } else {
        // 参数存在或非必填，跳过处理
      }
    }
  } else {
    // 无 Body 参数定义，跳过检查
  }

  // ===== 返回结果 =====
  // 返回缺失参数列表
  // 空数组表示所有必填参数均已提供
  return missingParams;
}