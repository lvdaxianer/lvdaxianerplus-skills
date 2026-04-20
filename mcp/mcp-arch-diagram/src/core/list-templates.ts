/**
 * MCP 架构图生成器 - list_templates 工具实现
 *
 * 获取可用的架构图模板列表
 *
 * @author lvdaxianerplus
 * @date 2026-04-20
 */

import path from 'path';
import type { ListTemplatesOutput, TemplateItem, DiagramType } from '../config/types.js';
import { TemplateLoader } from '../templates/index.js';

/**
 * list_templates 工具实现
 *
 * @param input - 筛选参数（可选）
 * @returns 模板列表
 * @author lvdaxianerplus
 * @date 2026-04-20
 */
export async function listTemplates(input?: { type?: DiagramType }): Promise<ListTemplatesOutput> {
  // 初始化模板加载器
  const templatesDir = path.join(process.cwd(), 'src', 'templates');
  const templateLoader = new TemplateLoader(templatesDir);

  // 加载所有模板
  templateLoader.loadAllTemplates();

  // 初始化模板项列表
  let templates: TemplateItem[];

  // 如果提供了类型筛选
  if (input && input.type) {
    // 根据类型筛选
    templates = templateLoader.filterByType(input.type);
  } else {
    // 获取所有模板
    templates = templateLoader.getAllTemplates();
  }

  // 返回结果
  return {
    templates,
  };
}