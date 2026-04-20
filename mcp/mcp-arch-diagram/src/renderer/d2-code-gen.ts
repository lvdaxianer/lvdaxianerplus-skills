/**
 * MCP 架构图生成器 - D2 代码生成器
 *
 * 将 Diagram 对象转换为 D2 语法代码
 *
 * @author lvdaxianerplus
 * @date 2026-04-20
 */

import type {
  Diagram,
  Component,
  Relationship,
  RelationType,
  D2GenerateOptions,
} from '../config/types.js';

import {
  DEFAULT_D2_DIRECTION,
  D2_ARROW_STYLES,
  D2_SHAPE_MAP,
} from '../config/defaults.js';

/**
 * 获取 D2 箭头样式
 *
 * @param relationType - 关系类型
 * @returns D2 箭头样式字符串
 * @author lvdaxianerplus
 * @date 2026-04-20
 */
function getArrowStyle(relationType: RelationType): string {
  // 从映射表获取箭头样式
  const style = D2_ARROW_STYLES[relationType];

  // 如果找到样式，返回样式
  if (style) {
    return style;
  }

  // 默认返回 -> 样式
  return '->';
}

/**
 * 获取 D2 形状样式
 *
 * @param componentType - 组件类型
 * @returns D2 shape 属性值
 * @author lvdaxianerplus
 * @date 2026-04-20
 */
function getShapeStyle(componentType: string): string {
  // 从映射表获取形状样式
  const shape = D2_SHAPE_MAP[componentType];

  // 如果找到形状，返回形状
  if (shape) {
    return shape;
  }

  // 默认返回 rectangle
  return 'rectangle';
}

/**
 * 转义 D2 字符串
 *
 * @param text - 原始文本
 * @returns 转义后的文本
 * @author lvdaxianerplus
 * @date 2026-04-20
 */
function escapeD2String(text: string): string {
  // 如果文本包含特殊字符，用引号包裹
  if (text.includes(':') || text.includes('#') || text.includes('{') || text.includes('}')) {
    // 用双引号包裹，并转义内部双引号
    return `"${text.replace(/"/g, '\\"')}"`;
  }

  // 否则直接返回
  return text;
}

/**
 * 生成组件定义代码
 *
 * @param component - 组件对象
 * @returns D2 组件定义字符串
 * @author lvdaxianerplus
 * @date 2026-04-20
 */
function generateComponentCode(component: Component): string {
  // 获取组件名称（转义后）
  const name = escapeD2String(component.name);

  // 获取形状样式
  const shape = getShapeStyle(component.type);

  // 生成组件定义：名称: { shape: 形状 }
  // D2 语法：component_name: { shape: shape_name }
  const code = `${name}: { shape: ${shape} }`;

  // 返回组件定义
  return code;
}

/**
 * 生成关系定义代码
 *
 * @param relationship - 关系对象
 * @param components - 组件列表（用于查找名称）
 * @returns D2 关系定义字符串
 * @author lvdaxianerplus
 * @date 2026-04-20
 */
function generateRelationshipCode(
  relationship: Relationship,
  components: Component[]
): string {
  // 查找源组件和目标组件
  const sourceComponent = components.find((c) => c.id === relationship.sourceId);
  const targetComponent = components.find((c) => c.id === relationship.targetId);

  // 如果找不到组件，返回空字符串
  if (!sourceComponent || !targetComponent) {
    // 无法生成关系代码
    throw new Error(`Invalid relationship reference: ${relationship.sourceId} -> ${relationship.targetId}`);
  }

  // 获取组件名称（转义后）
  const sourceName = escapeD2String(sourceComponent.name);
  const targetName = escapeD2String(targetComponent.name);

  // 获取箭头样式
  const arrowStyle = getArrowStyle(relationship.type);

  // 生成关系代码
  let code: string;

  // 如果有标签，添加标签
  if (relationship.label) {
    // D2 语法：source -> target: label
    code = `${sourceName} ${arrowStyle} ${targetName}: ${escapeD2String(relationship.label)}`;
  } else {
    // D2 语法：source -> target
    code = `${sourceName} ${arrowStyle} ${targetName}`;
  }

  // 返回关系代码
  return code;
}

/**
 * 生成 D2 代码
 *
 * @param diagram - 架构图对象
 * @param options - 可选生成选项
 * @returns D2 代码字符串
 * @author lvdaxianerplus
 * @date 2026-04-20
 */
export function generateD2Code(
  diagram: Diagram,
  options?: D2GenerateOptions
): string {
  // 检查 diagram 是否有效
  if (!diagram) {
    throw new Error('Invalid diagram: diagram is null or undefined');
  }

  // 检查 diagram.id 是否有效
  if (!diagram.id || diagram.id.trim().length === 0) {
    throw new Error('Invalid diagram: id is empty');
  }

  // 检查 components 是否有效
  if (!diagram.components || diagram.components.length === 0) {
    throw new Error('Invalid diagram: components array is empty');
  }

  // 初始化代码行数组
  const lines: string[] = [];

  // 1. 添加方向声明
  const direction = options?.direction || DEFAULT_D2_DIRECTION;

  lines.push(`direction: ${direction}`);

  // 2. 添加空行分隔
  lines.push('');

  // 3. 添加组件定义
  for (const component of diagram.components) {
    // 生成组件代码
    const componentCode = generateComponentCode(component);

    // 添加到代码行
    lines.push(componentCode);
  }

  // 4. 如果有关系，添加空行分隔
  if (diagram.relationships && diagram.relationships.length > 0) {
    lines.push('');
  }

  // 5. 添加关系定义
  if (diagram.relationships && diagram.relationships.length > 0) {
    for (const relationship of diagram.relationships) {
      // 生成关系代码
      const relationshipCode = generateRelationshipCode(
        relationship,
        diagram.components
      );

      // 添加到代码行
      lines.push(relationshipCode);
    }
  }

  // 6. 合并所有代码行
  const code = lines.join('\n');

  // 返回 D2 代码
  return code;
}