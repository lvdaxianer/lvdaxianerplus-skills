/**
 * MCP 架构图生成器 - 模板加载器
 *
 * 加载和管理预定义架构图模板
 *
 * @author lvdaxianerplus
 * @date 2026-04-20
 */

import fs from 'fs';
import path from 'path';
import YAML from 'yaml';
import type { Template, TemplateItem, DiagramType } from '../config/types.js';

/**
 * 模板加载器类
 *
 * 从 YAML 文件加载模板定义
 *
 * @author lvdaxianerplus
 * @date 2026-04-20
 */
export class TemplateLoader {
  private templatesDir: string;
  private templates: Map<string, Template> = new Map();

  /**
   * 构造函数
   *
   * @param templatesDir - 模板目录路径
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  constructor(templatesDir: string) {
    // 初始化模板目录
    this.templatesDir = templatesDir;
  }

  /**
   * 加载单个模板文件
   *
   * @param filePath - 模板文件路径
   * @returns 模板对象或 null
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  private loadTemplateFile(filePath: string): Template | null {
    // 检查文件存在性
    if (!fs.existsSync(filePath)) {
      // 文件不存在，返回 null
      return null;
    }

    // 读取文件内容
    const content = fs.readFileSync(filePath, 'utf-8');

    // 解析 YAML
    try {
      const data = YAML.parse(content);

      // 验证模板数据结构
      if (!data || !data.name || !data.type || !data.description) {
        // 数据结构无效，返回 null
        return null;
      }

      // 构建模板对象
      const template: Template = {
        name: data.name,
        type: data.type as DiagramType,
        description: data.description,
        structure: data.structure || { components: [], connections: [] },
        placeholders: data.placeholders || [],
      };

      // 返回模板对象
      return template;
    } catch (error) {
      // YAML 解析失败，返回 null
      return null;
    }
  }

  /**
   * 加载所有模板
   *
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  loadAllTemplates(): void {
    // 清空现有模板
    this.templates.clear();

    // 检查模板目录存在性
    if (!fs.existsSync(this.templatesDir)) {
      // 目录不存在，直接返回
      return;
    }

    // 遍历子目录（deployment, business, function）
    const subDirs = fs.readdirSync(this.templatesDir, { withFileTypes: true });

    for (const subDir of subDirs) {
      // 如果是目录
      if (subDir.isDirectory()) {
        // 构建子目录路径
        const subDirPath = path.join(this.templatesDir, subDir.name);

        // 遍历子目录中的 YAML 文件
        const files = fs.readdirSync(subDirPath, { withFileTypes: true });

        for (const file of files) {
          // 如果是 YAML 文件
          if (file.isFile() && (file.name.endsWith('.yaml') || file.name.endsWith('.yml'))) {
            // 构建文件路径
            const filePath = path.join(subDirPath, file.name);

            // 加载模板
            const template = this.loadTemplateFile(filePath);

            // 如果模板有效，添加到 Map
            if (template) {
              this.templates.set(template.name, template);
            }
          }
        }
      }
    }
  }

  /**
   * 获取所有模板列表
   *
   * @returns 模板项列表
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  getAllTemplates(): TemplateItem[] {
    // 初始化模板项列表
    const items: TemplateItem[] = [];

    // 遍历所有模板
    for (const template of this.templates.values()) {
      // 构建模板项
      const item: TemplateItem = {
        name: template.name,
        type: template.type,
        description: template.description,
      };

      // 添加到列表
      items.push(item);
    }

    // 返回模板项列表
    return items;
  }

  /**
   * 根据类型筛选模板
   *
   * @param type - 架构图类型
   * @returns 模板项列表
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  filterByType(type: DiagramType): TemplateItem[] {
    // 初始化模板项列表
    const items: TemplateItem[] = [];

    // 遍历所有模板
    for (const template of this.templates.values()) {
      // 如果类型匹配
      if (template.type === type) {
        // 构建模板项
        const item: TemplateItem = {
          name: template.name,
          type: template.type,
          description: template.description,
        };

        // 添加到列表
        items.push(item);
      }
    }

    // 返回模板项列表
    return items;
  }

  /**
   * 根据名称获取模板
   *
   * @param name - 模板名称
   * @returns 模板对象或 null
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  getTemplateByName(name: string): Template | null {
    // 从 Map 中获取模板
    return this.templates.get(name) || null;
  }
}

/**
 * 创建模板加载器实例
 *
 * @param templatesDir - 模板目录路径
 * @returns 模板加载器实例
 * @author lvdaxianerplus
 * @date 2026-04-20
 */
export const createTemplateLoader = (templatesDir: string): TemplateLoader => {
  return new TemplateLoader(templatesDir);
};