/**
 * MCP Server implementation
 *
 * @author lvdaxianerplus
 * @date 2026-04-18
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import type { Config, ToolConfig } from '../config/types.js';
import { executeTool } from './executor.js';
import { logger } from '../middleware/logger.js';
import { recordMetric } from '../middleware/metrics.js';

export interface McpServerOptions {
  config: Config;
}

/**
 * Create MCP server instance
 *
 * @param options - Server options
 * @returns MCP server
 */
export function createMcpServer(options: McpServerOptions): Server {
  const { config } = options;

  const server = new Server(
    {
      name: 'mcp-http-gateway',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  /**
   * Build input schema for a tool
   */
  function buildInputSchema(tool: ToolConfig) {
    const properties: Record<string, { type: string; description: string }> = {};
    const required: string[] = [];

    // Path parameters (extracted from path)
    const pathParams = tool.path.match(/\{(\w+)\}/g) || [];
    for (const param of pathParams) {
      const name = param.replace(/[{}]/g, '');
      properties[name] = {
        type: 'string',
        description: `Path parameter: ${name}`,
      };
      required.push(name);
    }

    // Query parameters
    if (tool.queryParams) {
      for (const [name, def] of Object.entries(tool.queryParams)) {
        properties[name] = {
          type: def.type,
          description: def.description,
        };
        if (def.required) {
          required.push(name);
        }
      }
    }

    // Body parameters
    if (tool.body) {
      for (const [name, def] of Object.entries(tool.body)) {
        properties[name] = {
          type: def.type,
          description: def.description,
        };
        if (def.required) {
          required.push(name);
        }
      }
    }

    return {
      type: 'object',
      properties,
      required,
    };
  }

  /**
   * List all available tools
   */
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    logger.debug('list_tools called');

    const tools = Object.entries(config.tools).map(([name, tool]) => ({
      name,
      description: tool.description,
      inputSchema: buildInputSchema(tool),
    }));

    return { tools };
  });

  /**
   * Handle tool call
   */
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    logger.info(`[${name}] Tool call received`, { arguments: args });

    const tool = config.tools[name];
    if (!tool) {
      const error = `Tool not found: ${name}`;
      logger.error(`[${name}] ${error}`);
      recordMetric(name, 'error');
      return {
        content: [{ type: 'text' as const, text: JSON.stringify({ error }) }],
        isError: true,
      };
    }

    // Validate required parameters
    const missingParams: string[] = [];

    // Check path params
    const pathParams = tool.path.match(/\{(\w+)\}/g) || [];
    for (const param of pathParams) {
      const paramName = param.replace(/[{}]/g, '');
      if (args?.[paramName] === undefined) {
        missingParams.push(paramName);
      }
    }

    // Check body params
    if (tool.body) {
      for (const [paramName, def] of Object.entries(tool.body)) {
        if (def.required && args?.[paramName] === undefined) {
          missingParams.push(paramName);
        }
      }
    }

    if (missingParams.length > 0) {
      const error = `Missing required parameters: ${missingParams.join(', ')}`;
      logger.error(`[${name}] ${error}`);
      recordMetric(name, 'error');
      return {
        content: [{ type: 'text' as const, text: JSON.stringify({ error }) }],
        isError: true,
      };
    }

    // Execute tool
    const startTime = Date.now();

    try {
      const result = await executeTool({
        toolName: name,
        tool,
        args: args ?? {},
        config,
      });

      const duration = Date.now() - startTime;

      if (result.success) {
        logger.info(`[${name}] Success`, { duration, cached: result.cached });
        recordMetric(name, 'success', duration);
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result.data) }],
        };
      } else {
        logger.error(`[${name}] Error: ${result.error}`, { duration });
        recordMetric(name, 'error', duration);
        return {
          content: [{ type: 'text' as const, text: JSON.stringify({ error: result.error }) }],
          isError: true,
        };
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`[${name}] Exception: ${message}`, { duration });
      recordMetric(name, 'error', duration);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify({ error: message }) }],
        isError: true,
      };
    }
  });

  return server;
}

/**
 * Start MCP server with STDIO transport
 *
 * @param config - Configuration
 */
export async function startStdioServer(config: Config): Promise<void> {
  const server = createMcpServer({ config });
  const transport = new StdioServerTransport();

  logger.info('Starting MCP server with STDIO transport');

  await server.connect(transport);
  logger.info('MCP server started');
}
