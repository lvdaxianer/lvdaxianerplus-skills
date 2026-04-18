/**
 * Tool executor - executes HTTP requests for tool calls
 *
 * @author lvdaxianerplus
 * @date 2026-04-18
 */

import type { ToolConfig, Config } from '../config/types.js';
import { buildUrl, separateParams, extractPathParamNames } from './url-builder.js';
import { resolveAuth } from '../features/auth.js';
import { executeWithRetry } from '../features/retry.js';
import { checkCircuitBreaker, recordSuccess, recordFailure } from '../features/circuit-breaker.js';
import { getCachedResponse, cacheResponse } from '../features/cache.js';
import { transformRequest, transformResponse } from '../features/transform.js';
import type { HttpClient, HttpResponse } from '../utils/http-client.js';
import { createHttpClient } from '../utils/http-client.js';

export interface ExecuteContext {
  toolName: string;
  tool: ToolConfig;
  args: Record<string, unknown>;
  config: Config;
}

export interface ExecuteResult {
  success: boolean;
  data?: unknown;
  error?: string;
  cached?: boolean;
}

/**
 * Execute a tool call
 *
 * @param context - Execution context
 * @returns Execution result
 */
export async function executeTool(context: ExecuteContext): Promise<ExecuteResult> {
  const { toolName, tool, args, config } = context;

  // Check circuit breaker
  if (config.circuitBreaker?.enabled) {
    const circuitState = checkCircuitBreaker(toolName, config.circuitBreaker);
    if (circuitState === 'OPEN') {
      return {
        success: false,
        error: 'Circuit breaker is OPEN: Service temporarily unavailable',
      };
    }
  }

  // Check cache (only for GET requests)
  if (tool.method === 'GET' && config.cache?.enabled) {
    const cached = getCachedResponse(toolName, args, config.cache);
    if (cached) {
      return { success: true, data: cached, cached: true };
    }
  }

  // Extract path and query param names
  const pathParamNames = extractPathParamNames(tool.path);
  const queryParamNames = tool.queryParams ? Object.keys(tool.queryParams) : [];
  const { pathParams, queryParams } = separateParams(args, pathParamNames, queryParamNames);

  // Transform request
  const transformedArgs = tool.requestTransform
    ? transformRequest(args, tool.requestTransform)
    : args;

  // Build URL
  const url = buildUrl(config.baseUrl, tool.path, pathParams, queryParams);

  // Resolve auth
  const headers = resolveAuth(tool, config);

  // Add custom headers
  if (tool.headers) {
    for (const [key, value] of Object.entries(tool.headers)) {
      headers[key] = value;
    }
  }

  // Determine timeout
  const timeout = tool.timeout ?? config.timeout?.read ?? 30000;

  // Create HTTP client
  const httpClient = createHttpClient({
    timeout,
    proxy: config.proxy,
  });

  // Build request body
  let body: string | undefined;
  if (['POST', 'PUT', 'PATCH'].includes(tool.method) && tool.body) {
    const bodyParams: Record<string, unknown> = {};
    for (const [key, def] of Object.entries(tool.body)) {
      if (transformedArgs[key] !== undefined) {
        bodyParams[key] = transformedArgs[key];
      } else if (def.defaultValue !== undefined) {
        bodyParams[key] = def.defaultValue;
      }
    }
    body = JSON.stringify(bodyParams);
  }

  // Execute with retry
  const retryConfig = tool.retry ?? config.retry;

  let response: HttpResponse;
  try {
    response = await executeWithRetry(
      () =>
        httpClient.request({
          method: tool.method,
          url,
          headers,
          body,
        }),
      retryConfig
    );
  } catch (error) {
    // Record circuit breaker failure
    if (config.circuitBreaker?.enabled) {
      recordFailure(toolName, config.circuitBreaker);
    }

    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: `Network error: ${message}` };
  }

  // Record circuit breaker success
  if (config.circuitBreaker?.enabled) {
    recordSuccess(toolName, config.circuitBreaker);
  }

  // Parse response
  let responseData: unknown;
  try {
    responseData = response.body ? JSON.parse(response.body) : response.body;
  } catch {
    responseData = response.body;
  }

  // Transform response
  if (tool.responseTransform) {
    responseData = transformResponse(responseData, tool.responseTransform);
  }

  // Cache response (only for GET and success)
  if (tool.method === 'GET' && config.cache?.enabled && response.status >= 200 && response.status < 300) {
    cacheResponse(toolName, args, responseData, config.cache);
  }

  // Return based on status
  if (response.status >= 200 && response.status < 300) {
    return { success: true, data: responseData };
  } else {
    return { success: false, error: typeof responseData === 'string' ? responseData : JSON.stringify(responseData) };
  }
}
