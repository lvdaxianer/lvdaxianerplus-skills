/**
 * MCP 架构图生成器 - 服务入口
 *
 * MCP Server 主入口，注册工具并启动服务
 *
 * @author lvdaxianerplus
 * @date 2026-04-20
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

import {
  SERVER_NAME,
  SERVER_VERSION,
} from './config/defaults.js';

import { generateDiagram } from './core/generate-diagram.js';
import { listTemplates } from './core/list-templates.js';
import { getDiagram } from './core/get-diagram.js';

import type {
  GenerateDiagramInput,
  GetDiagramInput,
  GenerateDiagramOutput,
  GetDiagramOutput,
  ListTemplatesOutput,
} from './config/types.js';

/**
 * 创建 MCP Server 实例
 *
 * @returns MCP Server 实例
 * @author lvdaxianerplus
 * @date 2026-04-20
 */
function createServer(): McpServer {
  // 创建服务器实例
  const server = new McpServer({
    name: SERVER_NAME,
    version: SERVER_VERSION,
  });

  // ============================================================
  // 注册 generate_diagram 工具
  // ============================================================
  server.tool(
    'generate_diagram',
    '根据描述生成架构图，支持自然语言描述或模板选择',
    {
      description: z.string().optional().describe('自然语言描述架构组件和关系'),
      type: z.enum(['deployment', 'business', 'function']).optional().describe('架构图类型'),
      template: z.string().optional().describe('预定义模板名称'),
      engine: z.enum(['d2', 'mermaid']).optional().describe('渲染引擎，默认 d2'),
      outputDir: z.string().optional().describe('输出目录，默认 ./diagrams'),
      imageFormat: z.enum(['png', 'svg']).optional().describe('图片格式，默认 png'),
    },
    async (args) => {
      // 调用 generate_diagram 处理器
      const input: GenerateDiagramInput = {
        description: args.description,
        type: args.type,
        template: args.template,
        engine: args.engine,
        outputDir: args.outputDir,
        imageFormat: args.imageFormat,
      };

      // 执行生成
      const result: GenerateDiagramOutput = await generateDiagram(input);

      // 返回 MCP 格式响应
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }
  );

  // ============================================================
  // 注册 list_templates 工具
  // ============================================================
  server.tool(
    'list_templates',
    '获取可用的架构图模板列表',
    {
      type: z.enum(['deployment', 'business', 'function']).optional().describe('筛选特定类型的模板'),
    },
    async (args) => {
      // 调用 list_templates 处理器
      const input = { type: args.type };

      // 执行查询
      const result: ListTemplatesOutput = await listTemplates(input);

      // 返回 MCP 格式响应
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }
  );

  // ============================================================
  // 注册 get_diagram 工具
  // ============================================================
  server.tool(
    'get_diagram',
    '获取已保存的架构图',
    {
      id: z.string().describe('架构图 ID（必填）'),
      format: z.enum(['image', 'code', 'both']).optional().describe('返回格式，默认 both'),
    },
    async (args) => {
      // 调用 get_diagram 处理器
      const input: GetDiagramInput = {
        id: args.id,
        format: args.format,
      };

      // 执行查询
      const result: GetDiagramOutput = await getDiagram(input);

      // 返回 MCP 格式响应
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }
  );

  // 返回服务器实例
  return server;
}

/**
 * 启动 MCP Server
 *
 * @author lvdaxianerplus
 * @date 2026-04-20
 */
async function main(): Promise<void> {
  // 创建服务器实例
  const server = createServer();

  // 创建标准输入输出传输
  const transport = new StdioServerTransport();

  // 连接服务器和传输
  await server.connect(transport);

  // 日志输出（标准错误流，避免干扰 MCP 协议）
  console.error(`[${SERVER_NAME}] MCP Server started on stdio transport`);
  console.error(`[${SERVER_NAME}] Version: ${SERVER_VERSION}`);
  console.error(`[${SERVER_NAME}] Registered tools: generate_diagram, list_templates, get_diagram`);
}

// ============================================================
// 程序入口
// ============================================================

// 捕获未处理的异常
process.on('uncaughtException', (error: Error) => {
  // 输出到标准错误流
  console.error(`[${SERVER_NAME}] Uncaught exception:`, error);

  // 退出进程
  process.exit(1);
});

// 捕获未处理的 Promise 拒绝
process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
  // 输出到标准错误流
  console.error(`[${SERVER_NAME}] Unhandled rejection at:`, promise, 'reason:', reason);

  // 退出进程
  process.exit(1);
});

// 启动服务器
main().catch((error: Error) => {
  // 输出启动失败信息
  console.error(`[${SERVER_NAME}] Server startup failed:`, error);

  // 退出进程
  process.exit(1);
});