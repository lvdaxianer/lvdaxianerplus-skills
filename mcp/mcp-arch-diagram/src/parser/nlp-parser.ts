/**
 * MCP 架构图生成器 - NLP 解析器
 *
 * 从自然语言描述中提取组件和关系
 *
 * @author lvdaxianerplus
 * @date 2026-04-20
 */

import type {
  Component,
  ComponentType,
  Relationship,
  RelationType,
  DiagramType,
  ParseResult,
  ParseInput,
} from '../config/types.js';

import {
  COMPONENT_TYPE_KEYWORDS,
  RELATION_TYPE_KEYWORDS,
  DIAGRAM_TYPE_KEYWORDS,
  DEFAULT_DIAGRAM_TYPE,
} from '../config/defaults.js';

/**
 * 生成唯一组件 ID
 *
 * @param index - 组件索引
 * @returns 唯一 ID 字符串
 * @author lvdaxianerplus
 * @date 2026-04-20
 */
function generateComponentId(index: number): string {
  // 返回格式：comp-NNN
  return `comp-${index.toString().padStart(3, '0')}`;
}

/**
 * 根据关键词推断组件类型
 *
 * @param name - 组件名称
 * @returns 组件类型
 * @author lvdaxianerplus
 * @date 2026-04-20
 */
function inferComponentType(name: string): ComponentType {
  // 转换为小写，便于匹配
  const lowerName = name.toLowerCase();

  // 遍历组件类型关键词映射
  for (const [type, keywords] of Object.entries(COMPONENT_TYPE_KEYWORDS)) {
    // 检查是否包含关键词
    for (const keyword of keywords) {
      if (lowerName.includes(keyword.toLowerCase())) {
        // 返回匹配的类型
        return type as ComponentType;
      }
    }
  }

  // 默认返回 service 类型
  return 'service';
}

/**
 * 根据关键词推断关系类型
 *
 * @param description - 包含关系描述的文本
 * @returns 关系类型
 * @author lvdaxianerplus
 * @date 2026-04-20
 */
function inferRelationType(description: string): RelationType {
  // 转换为小写，便于匹配
  const lowerDesc = description.toLowerCase();

  // 遍历关系类型关键词映射
  for (const [type, keywords] of Object.entries(RELATION_TYPE_KEYWORDS)) {
    // 检查是否包含关键词
    for (const keyword of keywords) {
      if (lowerDesc.includes(keyword.toLowerCase())) {
        // 返回匹配的类型
        return type as RelationType;
      }
    }
  }

  // 默认返回 dataflow 类型
  return 'dataflow';
}

/**
 * 根据关键词推断架构图类型
 *
 * @param description - 描述文本
 * @returns 架构图类型
 * @author lvdaxianerplus
 * @date 2026-04-20
 */
function inferDiagramType(description: string): DiagramType {
  // 转换为小写，便于匹配
  const lowerDesc = description.toLowerCase();

  // 遍历架构图类型关键词映射
  for (const [type, keywords] of Object.entries(DIAGRAM_TYPE_KEYWORDS)) {
    // 检查是否包含关键词
    for (const keyword of keywords) {
      if (lowerDesc.includes(keyword.toLowerCase())) {
        // 返回匹配的类型
        return type as DiagramType;
      }
    }
  }

  // 默认返回 deployment 类型
  return DEFAULT_DIAGRAM_TYPE;
}

/**
 * 提取组件名称列表
 *
 * @param description - 描述文本
 * @returns 组件名称数组
 * @author lvdaxianerplus
 * @date 2026-04-20
 */
function extractComponentNames(description: string): string[] {
  // 初始化结果数组
  const names: string[] = [];

  // 分词策略：按中文逗号、英文逗号、顿号、空格分割
  const delimiters = /[，,、；;\s]+/;

  // 分割描述文本
  const tokens = description.split(delimiters);

  // 过滤有效组件名称
  for (const token of tokens) {
    // 去除特殊字符
    const cleaned = token.replace(/[【】\[\]（）\(\)→\-><>/]/g, '').trim();

    // 检查是否为有效名称
    if (cleaned.length > 0 && cleaned.length < 50) {
      // 检查是否包含有效关键词（中文或英文）
      const hasKeywords = Object.values(COMPONENT_TYPE_KEYWORDS)
        .flat()
        .some((keyword) => cleaned.toLowerCase().includes(keyword.toLowerCase()));

      // 或者包含中文字符（长度 > 1）
      const hasChinese = /[\u4e00-\u9fa5]/.test(cleaned) && cleaned.length > 1;

      // 或者是英文单词（长度 > 2）
      const isEnglishWord = /^[a-zA-Z]{3,}$/.test(cleaned);

      // 如果满足条件，添加到结果
      if (hasKeywords || hasChinese || isEnglishWord) {
        names.push(cleaned);
      }
    }
  }

  // 返回结果
  return names;
}

/**
 * 创建组件对象
 *
 * @param names - 组件名称列表
 * @returns 组件数组
 * @author lvdaxianerplus
 * @date 2026-04-20
 */
function createComponents(names: string[]): Component[] {
  // 初始化组件数组
  const components: Component[] = [];

  // 遍历名称，创建组件
  for (let i = 0; i < names.length; i++) {
    // 生成唯一 ID
    const id = generateComponentId(i);

    // 推断组件类型
    const type = inferComponentType(names[i]);

    // 创建组件对象
    const component: Component = {
      id,
      name: names[i],
      type,
    };

    // 添加到数组
    components.push(component);
  }

  // 返回组件数组
  return components;
}

/**
 * 提取关系列表
 *
 * @param description - 描述文本
 * @param components - 组件列表
 * @returns 关系数组
 * @author lvdaxianerplus
 * @date 2026-04-20
 */
function extractRelationships(
  description: string,
  components: Component[]
): Relationship[] {
  // 初始化关系数组
  const relationships: Relationship[] = [];

  // 如果组件少于 2 个，无法建立关系
  if (components.length < 2) {
    return relationships;
  }

  // 创建组件名称到 ID 的映射
  const nameToId: Map<string, string> = new Map();

  for (const comp of components) {
    // 添加原始名称
    nameToId.set(comp.name.toLowerCase(), comp.id);

    // 添加简化名称（去掉括号内容）
    const simplified = comp.name.replace(/\(.*\)/, '').trim().toLowerCase();

    if (simplified !== comp.name.toLowerCase()) {
      nameToId.set(simplified, comp.id);
    }
  }

  // 提取关系连接词
  const connectionPatterns = [
    /([^，,、；;\s]+)\s*(连接|连向|连到|访问|调用|依赖|转发|推送)\s*([^，,、；;\s]+)/g,
    /([^，,、；;\s]+)\s*(->|→|-->)\s*([^，,、；;\s]+)/g,
  ];

  // 遍历连接模式
  for (const pattern of connectionPatterns) {
    // 重置正则表达式
    pattern.lastIndex = 0;

    // 匹配所有连接
    const matches = description.matchAll(pattern);

    for (const match of matches) {
      // 获取源和目标名称
      const sourceName = match[1].replace(/[【】\[\]（）\(\)]/g, '').trim().toLowerCase();
      const targetName = match[3].replace(/[【】\[\]（）\(\)]/g, '').trim().toLowerCase();

      // 查找对应的组件 ID
      const sourceId = nameToId.get(sourceName);
      const targetId = nameToId.get(targetName);

      // 如果找到有效的 ID，且不是自连接
      if (sourceId && targetId && sourceId !== targetId) {
        // 推断关系类型
        const relationType = inferRelationType(description);

        // 创建关系对象
        const relationship: Relationship = {
          sourceId,
          targetId,
          type: relationType,
        };

        // 添加到数组
        relationships.push(relationship);
      }
    }
  }

  // 如果没有找到明确的连接关系，创建默认连接（顺序连接）
  if (relationships.length === 0 && components.length >= 2) {
    // 顺序连接所有组件
    for (let i = 0; i < components.length - 1; i++) {
      const relationship: Relationship = {
        sourceId: components[i].id,
        targetId: components[i + 1].id,
        type: 'dataflow',
      };

      relationships.push(relationship);
    }
  }

  // 返回关系数组
  return relationships;
}

/**
 * 解析自然语言描述
 *
 * @param input - 解析输入（描述 + 可选类型）
 * @returns 解析结果（组件 + 关系 + 类型）
 * @author lvdaxianerplus
 * @date 2026-04-20
 */
export function parseNaturalLanguage(input: ParseInput): ParseResult {
  // 检查描述是否为空
  if (!input.description || input.description.trim().length === 0) {
    // 抛出 PARSE_FAILED 错误
    throw new Error('PARSE_FAILED: 缺少描述内容');
  }

  // 检查描述是否过于简单（少于 3 个字符）
  if (input.description.trim().length < 3) {
    // 抛出 PARSE_FAILED 错误
    throw new Error('PARSE_FAILED: 描述内容过短，无法解析');
  }

  // 提取组件名称
  const componentNames = extractComponentNames(input.description);

  // 如果没有提取到组件，抛出错误
  if (componentNames.length === 0) {
    throw new Error('PARSE_FAILED: 无法从描述中提取组件');
  }

  // 创建组件对象
  const components = createComponents(componentNames);

  // 提取关系
  const relationships = extractRelationships(input.description, components);

  // 推断架构图类型
  let diagramType: DiagramType;

  // 如果用户提供了类型，使用用户类型
  if (input.type) {
    diagramType = input.type;
  } else {
    // 否则推断类型
    diagramType = inferDiagramType(input.description);
  }

  // 返回解析结果
  return {
    components,
    relationships,
    type: diagramType,
  };
}