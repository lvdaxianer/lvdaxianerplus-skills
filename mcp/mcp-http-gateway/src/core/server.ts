/**
 * MCP Server 核心实现
 *
 * 功能：
 * - 创建 MCP Server 实例
 * - 注册请求处理器（从 server-handlers 导入）
 * - 启动 STDIO 传输
 *
 * 模块拆分：
 * - server-handlers.ts: 处理器实现（list_tools、call_tool）
 * - attempt-tracking.ts: 尝试追踪（记录、清除、反馈）
 * - call-hint.ts: 调用提示生成（参数类型判断、模板填充）
 *
 * 传输方式：
 * - STDIO: 标准输入输出（用于 Claude Code 等客户端）
 * - SSE: Server-Sent Events（可选）
 *
 * @author lvdaxianerplus
 * @date 2026-04-18
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import type { Config } from '../config/types.js';
import { logger } from '../middleware/logger.js';
import { registerListToolsHandler, registerCallToolHandler } from './server-handlers.js';

// ============================================================================
// 类型定义
// ============================================================================

/**
 * MCP Server 配置选项
 *
 * @param config - 工具配置（包含 baseUrl、tools 等）
 *
 * @author lvdaxianerplus
 * @date 2026-04-18
 */
export interface McpServerOptions {
  config: Config;
}

// ============================================================================
// Server 创建函数
// ============================================================================

/**
 * 创建 MCP Server 实例
 *
 * 功能：初始化 Server 并注册请求处理器。
 *
 * Server 配置：
 * - name: 'mcp-http-gateway'
 * - version: '1.0.0'
 * - capabilities: { tools: {} }
 *
 * 处理器：
 * - list_tools: 返回工具列表（含调用提示）
 * - call_tool: 执行工具调用（含尝试追踪）
 *
 * @param options - Server 配置选项
 * @returns MCP Server 实例
 *
 * @author lvdaxianerplus
 * @date 2026-04-18
 */
export function createMcpServer(options: McpServerOptions): Server {
  // 解析配置选项
  const { config } = options;

  // 创建 Server 实例
  // 定义名称和版本（用于客户端识别）
  const server = new Server(
    {
      name: 'mcp-http-gateway',
      version: '1.0.0',
    },
    {
      capabilities: {
        // 声明支持 tools 能力
        tools: {},
      },
    }
  );

  // ===== 注册请求处理器 =====

  // 注册工具列表处理器
  // 功能：响应 list_tools 请求，返回所有工具定义
  registerListToolsHandler(server, config);

  // 注册工具调用处理器
  // 功能：响应 call_tool 请求，执行工具并返回结果
  registerCallToolHandler(server, config);

  // 返回 Server 实例
  return server;
}

// ============================================================================
// Server 启动函数
// ============================================================================

/**
 * 启动 MCP Server（STDIO 传输）
 *
 * 功能：创建 Server 并连接 STDIO 传输层。
 *
 * STDIO 传输说明：
 * - 通过标准输入输出与客户端通信
 * - 用于 Claude Code 等命令行客户端
 * - 无需网络端口，安全性高
 *
 * @param config - 工具配置
 *
 * @author lvdaxianerplus
 * @date 2026-04-18
 */
export async function startStdioServer(config: Config): Promise<void> {
  // 创建 Server 实例
  const server = createMcpServer({ config });

  // 创建 STDIO 传输层
  // 通过 stdin/stdout 进行通信
  const transport = new StdioServerTransport();

  // 记录启动日志
  logger.info('[服务器] 启动 MCP Server（STDIO 传输）');

  // 连接传输层
  // 阻塞直到连接成功
  await server.connect(transport);

  // 记录启动成功日志
  logger.info('[服务器] MCP Server 已启动');
}