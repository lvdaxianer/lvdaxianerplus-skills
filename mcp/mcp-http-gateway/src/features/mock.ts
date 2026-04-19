/**
 * Mock tool handler for testing and development
 *
 * Features:
 * - Static mock responses
 * - Dynamic template responses
 * - Dynamic field-based data generation
 * - Simulated delay
 * - Mock data management
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */

import type { MockToolConfig, MockConfig } from '../config/types.js';
import { logger } from '../middleware/logger.js';
import { v4 as uuidv4 } from 'uuid';
import { generateDynamicResponse } from './mock-generator.js';

// Global mock enabled flag
let globalMockEnabled = false;

// Mock data store
let mockDataStore: Record<string, MockToolConfig> = {};

/**
 * Initialize mock handler
 *
 * @param config - Mock configuration
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
export function initMockHandler(config: MockConfig | undefined): void {
  if (!config) {
    return;
  }

  globalMockEnabled = config.enabled;
  mockDataStore = config.mockData ?? {};

  logger.info('[Mock Handler] Initialized', { globalMockEnabled, toolCount: Object.keys(mockDataStore).length });
}

/**
 * Check if mock is enabled for a tool
 *
 * @param toolName - Tool name
 * @param toolMockConfig - Tool-specific mock config
 * @returns Whether mock is enabled
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
export function isMockEnabled(toolName: string, toolMockConfig?: MockToolConfig): boolean {
  // Global mock disabled
  if (!globalMockEnabled) {
    return false;
  }

  // Check tool-specific mock config
  if (toolMockConfig?.enabled) {
    return true;
  }

  // Check mock data store
  if (mockDataStore[toolName]?.enabled) {
    return true;
  }

  return false;
}

/**
 * Process template placeholders
 *
 * Supported placeholders:
 * - {param} - Replace with request parameter value
 * - {timestamp} - Current timestamp
 * - {uuid} - Generate UUID
 * - {random} - Random number
 *
 * @param template - Response template
 * @param args - Request arguments
 * @returns Processed template
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
function processTemplate(template: string, args: Record<string, unknown>): string {
  let result = template;

  // Replace parameter placeholders
  for (const [key, value] of Object.entries(args)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
  }

  // Replace built-in placeholders
  result = result.replace(/\{timestamp\}/g, new Date().toISOString());
  result = result.replace(/\{uuid\}/g, uuidv4());
  result = result.replace(/\{random\}/g, String(Math.floor(Math.random() * 10000)));

  return result;
}

/**
 * Generate mock response
 *
 * @param toolName - Tool name
 * @param args - Request arguments
 * @param toolMockConfig - Tool-specific mock config
 * @returns Mock response data
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
export function generateMockResponse(
  toolName: string,
  args: Record<string, unknown>,
  toolMockConfig?: MockToolConfig
): {
  data: unknown;
  statusCode: number;
  headers: Record<string, string>;
  delay: number;
} {
  // Get mock config (tool-specific or from store)
  const mockConfig = toolMockConfig ?? mockDataStore[toolName];

  // Condition: no mock config available
  if (!mockConfig) {
    logger.warn('[Mock Handler] No mock config for tool', { toolName });
    return {
      data: { error: 'No mock configuration' },
      statusCode: 500,
      headers: {},
      delay: 0,
    };
  }

  // Get response data - priority: dynamicConfig > responseTemplate > response
  let response: unknown;

  // Condition: dynamicConfig enabled - generate dynamic data
  if (mockConfig.dynamicConfig?.enabled) {
    response = generateDynamicResponse(mockConfig.dynamicConfig, args);
    logger.info('[Mock Handler] Generated dynamic response', { toolName });
  } else if (mockConfig.responseTemplate) {
    // Condition: responseTemplate provided - process template
    const processedTemplate = processTemplate(mockConfig.responseTemplate, args);
    try {
      response = JSON.parse(processedTemplate);
    } catch {
      // If not valid JSON, return as string
      response = processedTemplate;
    }
  } else if (mockConfig.response) {
    // Condition: static response provided - process placeholders in object
    response = processResponseObject(mockConfig.response, args);
  } else {
    // Default: empty response
    response = { success: true, mocked: true };
  }

  const statusCode = mockConfig.statusCode ?? 200;
  const headers = mockConfig.headers ?? { 'Content-Type': 'application/json' };
  const delay = mockConfig.delay ?? 0;

  logger.info('[Mock Handler] Generated mock response', {
    toolName,
    statusCode,
    delay,
    responseType: typeof response,
  });

  return {
    data: response,
    statusCode,
    headers,
    delay,
  };
}

/**
 * Process response object for placeholders
 *
 * @param obj - Response object
 * @param args - Request arguments
 * @returns Processed object
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
function processResponseObject(obj: unknown, args: Record<string, unknown>): unknown {
  if (typeof obj === 'string') {
    return processTemplate(obj, args);
  }

  if (Array.isArray(obj)) {
    return obj.map(item => processResponseObject(item, args));
  }

  if (typeof obj === 'object' && obj !== null) {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      result[key] = processResponseObject(value, args);
    }
    return result;
  }

  return obj;
}

/**
 * Simulate delay
 *
 * @param delayMs - Delay in milliseconds
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
export async function simulateDelay(delayMs: number): Promise<void> {
  if (delayMs > 0) {
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }
}

/**
 * Update mock data for a tool
 *
 * @param toolName - Tool name
 * @param mockConfig - Mock configuration
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
export function updateMockData(toolName: string, mockConfig: MockToolConfig): void {
  mockDataStore[toolName] = mockConfig;
  logger.info('[Mock Handler] Updated mock data', { toolName });
}

/**
 * Delete mock data for a tool
 *
 * @param toolName - Tool name
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
export function deleteMockData(toolName: string): void {
  if (mockDataStore[toolName]) {
    delete mockDataStore[toolName];
    logger.info('[Mock Handler] Deleted mock data', { toolName });
  }
}

/**
 * Get all mock data
 *
 * @returns Mock data store
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
export function getAllMockData(): Record<string, MockToolConfig> {
  return { ...mockDataStore };
}

/**
 * Set global mock enabled
 *
 * @param enabled - Whether global mock is enabled
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
export function setGlobalMockEnabled(enabled: boolean): void {
  globalMockEnabled = enabled;
  logger.info('[Mock Handler] Global mock enabled changed', { globalMockEnabled });
}

/**
 * Get global mock enabled status
 *
 * @returns Global mock enabled
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
export function getGlobalMockEnabled(): boolean {
  return globalMockEnabled;
}

/**
 * Execute mock tool call
 *
 * @param toolName - Tool name
 * @param args - Request arguments
 * @param toolMockConfig - Tool-specific mock config
 * @returns Mock execution result
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
export async function executeMockCall(
  toolName: string,
  args: Record<string, unknown>,
  toolMockConfig?: MockToolConfig
): Promise<{
  success: boolean;
  data: unknown;
  statusCode: number;
  duration: number;
}> {
  const startTime = Date.now();

  // Generate mock response
  const mockResponse = generateMockResponse(toolName, args, toolMockConfig);

  // Simulate delay
  await simulateDelay(mockResponse.delay);

  const duration = Date.now() - startTime;

  // Determine success based on status code
  const success = mockResponse.statusCode >= 200 && mockResponse.statusCode < 300;

  return {
    success,
    data: mockResponse.data,
    statusCode: mockResponse.statusCode,
    duration,
  };
}

/**
 * Check if mock can be used as fallback for a tool
 *
 * Fallback mock does not require global mock to be enabled.
 * It checks if the tool has a static mock configuration available.
 *
 * @param toolName - Tool name
 * @param toolMockConfig - Tool-specific mock config
 * @returns Whether mock can be used as fallback
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
export function canUseMockAsFallback(toolName: string, toolMockConfig?: MockToolConfig): boolean {
  // Check tool-specific mock config first
  // Fallback mock only uses static response, not dynamic generation
  if (toolMockConfig?.enabled && toolMockConfig.response) {
    return true;
  }

  // Check mock data store for static mock config
  const storeConfig = mockDataStore[toolName];
  if (storeConfig?.enabled && storeConfig.response) {
    return true;
  }

  return false;
}

/**
 * Execute mock as fallback (uses static response only)
 *
 * This function is specifically for fallback scenarios.
 * It only uses static mock response, not dynamic generation.
 * The goal is to provide stable fallback data, not dynamic test data.
 *
 * @param toolName - Tool name
 * @param args - Request arguments
 * @param toolMockConfig - Tool-specific mock config
 * @returns Mock fallback data
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
export function executeMockFallback(
  toolName: string,
  args: Record<string, unknown>,
  toolMockConfig?: MockToolConfig
): unknown {
  // Get mock config (tool-specific or from store)
  const mockConfig = toolMockConfig ?? mockDataStore[toolName];

  // Condition: no mock config available
  if (!mockConfig) {
    logger.warn('[Mock Fallback] No mock config for tool', { toolName });
    return { error: 'No mock fallback configuration', fallback: true };
  }

  // Condition: use static response only (fallback needs stable data)
  if (mockConfig.response) {
    // Process response object for placeholders
    const processedResponse = processResponseObject(mockConfig.response, args);
    logger.info('[Mock Fallback] Using static mock fallback', { toolName });
    return processedResponse;
  }

  // Condition: no static response available
  logger.warn('[Mock Fallback] No static response in mock config', { toolName });
  return { error: 'No static mock response available', fallback: true };
}