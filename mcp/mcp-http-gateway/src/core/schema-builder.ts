/**
 * Schema 构建模块
 *
 * 从工具配置构建 JSON Schema 格式的输入定义。
 *
 * 功能：
 * - 提取路径参数（从 path 中匹配 {paramName}）
 * - 处理查询参数（queryParams）
 * - 处理 Body 参数（body）
 * - 生成 JSON Schema 结构
 *
 * @author lvdaxianerplus
 * @date 2026-04-21
 */

import type { ToolConfig } from '../config/types.js';

/**
 * 输入 Schema 类型定义
 *
 * JSON Schema 格式的工具输入定义。
 *
 * @param type - 固定为 'object'
 * @param properties - 参数属性映射（名称 → 类型/描述）
 * @param required - 必填参数名称列表
 *
 * @author lvdaxianerplus
 * @date 2026-04-21
 */
export interface InputSchema {
  type: 'object';
  properties: Record<string, { type: string; description: string }>;
  required: string[];
}

/**
 * 构建工具输入 Schema
 *
 * 功能：从工具配置构建 JSON Schema 格式的输入定义。
 *
 * Schema 结构：
 * - type: 'object'（固定类型）
 * - properties: 各参数定义（类型、描述）
 * - required: 必填参数名称列表
 *
 * 参数来源（按顺序处理）：
 * 1. 路径参数：从 path 中提取 {paramName} 格式
 * 2. 查询参数：queryParams 定义
 * 3. Body 参数：body 定义
 *
 * 路径参数特点：
 * - 类型固定为 string
 * - 均为必填参数（必须出现在 URL 中）
 *
 * @param tool - 工具配置
 * @returns JSON Schema 格式的输入定义
 *
 * @author lvdaxianerplus
 * @date 2026-04-21
 */
export function buildInputSchema(tool: ToolConfig): InputSchema {
  // ===== 初始化 =====
  // 属性映射：参数名称 → { type, description }
  const properties: Record<string, { type: string; description: string }> = {};

  // 必填参数列表：存储所有 required=true 的参数名称
  const required: string[] = [];

  // ===== 步骤 1：处理路径参数 =====
  // 从 path 中匹配 {paramName} 格式的路径参数
  // 例如："/api/users/{id}" → 匹配 "{id}"
  const pathParams = tool.path.match(/\{(\w+)\}/g) ?? [];

  // 条件注释：遍历路径参数，添加到 properties 和 required
  for (const param of pathParams) {
    // 去除花括号获取参数名称
    const name = param.replace(/[{}]/g, '');

    // 路径参数固定为 string 类型
    properties[name] = {
      type: 'string',
      description: `路径参数: ${name}`,
    };

    // 路径参数均为必填（必须出现在 URL 中）
    required.push(name);
  }

  // ===== 步骤 2：处理查询参数 =====
  // 条件注释：有 queryParams 定义时处理
  if (tool.queryParams) {
    // 遍历所有查询参数定义
    for (const [name, def] of Object.entries(tool.queryParams)) {
      // 添加参数到 properties（使用配置中的类型和描述）
      properties[name] = {
        type: def.type,
        description: def.description,
      };

      // 条件注释：必填参数添加到 required 列表
      if (def.required) {
        required.push(name);
      } else {
        // 可选参数，不添加到 required
      }
    }
  } else {
    // 无查询参数定义，跳过处理
  }

  // ===== 步骤 3：处理 Body 参数 =====
  // 条件注释：有 body 定义时处理
  if (tool.body) {
    // 遍历所有 Body 参数定义
    for (const [name, def] of Object.entries(tool.body)) {
      // 添加参数到 properties（使用配置中的类型和描述）
      properties[name] = {
        type: def.type,
        description: def.description,
      };

      // 条件注释：必填参数添加到 required 列表
      if (def.required) {
        required.push(name);
      } else {
        // 可选参数，不添加到 required
      }
    }
  } else {
    // 无 Body 参数定义，跳过处理
  }

  // ===== 返回结果 =====
  // 返回 JSON Schema 结构
  return {
    type: 'object',
    properties,
    required,
  };
}