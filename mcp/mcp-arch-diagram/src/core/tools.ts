/**
 * MCP 架构图生成器 - 工具注册路由
 *
 * 注册和路由 MCP 工具请求
 *
 * @author lvdaxianerplus
 * @date 2026-04-20
 */

import type {
  GenerateDiagramInput,
  GenerateDiagramOutput,
  ListTemplatesOutput,
  GetDiagramInput,
  GetDiagramOutput,
} from '../config/types.js';

/**
 * 工具处理器接口
 *
 * @author lvdaxianerplus
 * @date 2026-04-20
 */
interface ToolHandler {
  name: string;
  description: string;
  inputSchema: object;
  handler: (args: Record<string, unknown>) => Promise<unknown>;
}

/**
 * 工具注册器类
 *
 * 管理 MCP 工具的注册和路由
 *
 * @author lvdaxianerplus
 * @date 2026-04-20
 */
export class ToolRouter {
  private handlers: Map<string, ToolHandler> = new Map();

  /**
   * 注册工具处理器
   *
   * @param handler - 工具处理器
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  register(handler: ToolHandler): void {
    // 将处理器添加到 Map
    this.handlers.set(handler.name, handler);
  }

  /**
   * 获取所有已注册的工具列表
   *
   * @returns 工具定义列表
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  listTools(): Array<{ name: string; description: string; inputSchema: object }> {
    // 初始化工具列表
    const tools: Array<{ name: string; description: string; inputSchema: object }> = [];

    // 遍历所有处理器
    for (const handler of this.handlers.values()) {
      // 添加到工具列表
      tools.push({
        name: handler.name,
        description: handler.description,
        inputSchema: handler.inputSchema,
      });
    }

    // 返回工具列表
    return tools;
  }

  /**
   * 调用工具处理器
   *
   * @param name - 工具名称
   * @param args - 工具参数
   * @returns 处理结果
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  async callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
    // 查找工具处理器
    const handler = this.handlers.get(name);

    // 如果找不到处理器，抛出错误
    if (!handler) {
      throw new Error(`Tool not found: ${name}`);
    }

    // 调用处理器
    const result = await handler.handler(args);

    // 返回结果
    return result;
  }
}

/**
 * 创建 generate_diagram 工具处理器
 *
 * @param handlerFunction - 处理函数
 * @returns 工具处理器
 * @author lvdaxianerplus
 * @date 2026-04-20
 */
export const createGenerateDiagramHandler = (
  handlerFunction: (args: GenerateDiagramInput) => Promise<GenerateDiagramOutput>
): ToolHandler => {
  return {
    name: 'generate_diagram',
    description: '根据描述生成架构图，支持自然语言描述或模板选择',
    inputSchema: {
      type: 'object',
      properties: {
        description: {
          type: 'string',
          description: '自然语言描述架构组件和关系',
        },
        type: {
          type: 'string',
          enum: ['deployment', 'business', 'function'],
          description: '架构图类型（可选）',
        },
        template: {
          type: 'string',
          description: '预定义模板名称',
        },
        engine: {
          type: 'string',
          enum: ['d2', 'mermaid'],
          default: 'd2',
          description: '渲染引擎（可选）',
        },
        outputDir: {
          type: 'string',
          default: './diagrams',
          description: '输出目录（可选）',
        },
        imageFormat: {
          type: 'string',
          enum: ['png', 'svg'],
          default: 'png',
          description: '图片格式（可选）',
        },
      },
    },
    handler: handlerFunction as unknown as (args: Record<string, unknown>) => Promise<unknown>,
  };
};

/**
 * 创建 list_templates 工具处理器
 *
 * @param handlerFunction - 处理函数
 * @returns 工具处理器
 * @author lvdaxianerplus
 * @date 2026-04-20
 */
export const createListTemplatesHandler = (
  handlerFunction: (args: { type?: string }) => Promise<ListTemplatesOutput>
): ToolHandler => {
  return {
    name: 'list_templates',
    description: '获取可用的架构图模板列表',
    inputSchema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['deployment', 'business', 'function'],
          description: '筛选特定类型的模板（可选）',
        },
      },
    },
    handler: handlerFunction as unknown as (args: Record<string, unknown>) => Promise<unknown>,
  };
};

/**
 * 创建 get_diagram 工具处理器
 *
 * @param handlerFunction - 处理函数
 * @returns 工具处理器
 * @author lvdaxianerplus
 * @date 2026-04-20
 */
export const createGetDiagramHandler = (
  handlerFunction: (args: GetDiagramInput) => Promise<GetDiagramOutput>
): ToolHandler => {
  return {
    name: 'get_diagram',
    description: '获取已保存的架构图',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: '架构图 ID（必填）',
        },
        format: {
          type: 'string',
          enum: ['image', 'code', 'both'],
          default: 'both',
          description: '返回格式（可选）',
        },
      },
      required: ['id'],
    },
    handler: handlerFunction as unknown as (args: Record<string, unknown>) => Promise<unknown>,
  };
};

/**
 * 创建工具路由实例
 *
 * @returns 工具路由实例
 * @author lvdaxianerplus
 * @date 2026-04-20
 */
export const createToolRouter = (): ToolRouter => {
  return new ToolRouter();
};