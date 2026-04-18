/**
 * Configuration validator
 *
 * @author lvdaxianerplus
 * @date 2026-04-18
 */

import type { Config, ToolConfig } from './types.js';

const VALID_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'];

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/**
 * Validate the entire configuration
 *
 * @param config - Configuration object to validate
 * @returns Validation result with any errors
 */
export function validateConfig(config: unknown): ValidationResult {
  const errors: ValidationError[] = [];

  if (!config || typeof config !== 'object') {
    errors.push({ field: 'root', message: 'Configuration must be an object' });
    return { valid: false, errors };
  }

  const cfg = config as Record<string, unknown>;

  // baseUrl validation
  if (!cfg.baseUrl || typeof cfg.baseUrl !== 'string') {
    errors.push({ field: 'baseUrl', message: 'Missing required field: baseUrl' });
  }

  // tools validation
  if (!cfg.tools || typeof cfg.tools !== 'object' || cfg.tools === null) {
    errors.push({ field: 'tools', message: 'Missing required field: tools' });
  } else {
    const tools = cfg.tools as Record<string, ToolConfig>;
    const toolNames = Object.keys(tools);

    if (toolNames.length === 0) {
      errors.push({ field: 'tools', message: 'tools cannot be empty' });
    }

    for (const [name, tool] of Object.entries(tools)) {
      const toolErrors = validateTool(name, tool);
      errors.push(...toolErrors);
    }
  }

  // tokens validation - check that referenced tokens exist
  const tokens = cfg.tokens as Record<string, string> | undefined;
  if (tokens) {
    for (const [name, tool] of Object.entries(cfg.tools as Record<string, ToolConfig>)) {
      if (tool.token && !(tool.token in tokens)) {
        errors.push({
          field: `tools.${name}.token`,
          message: `Tool ${name}: token ${tool.token} not found in tokens`,
        });
      }
    }
  }

  // proxy URL validation
  if (cfg.proxy && typeof cfg.proxy === 'object') {
    const proxy = cfg.proxy as { url?: string };
    if (proxy.url) {
      try {
        new URL(proxy.url);
      } catch {
        errors.push({ field: 'proxy.url', message: `Invalid proxy url: ${proxy.url}` });
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate a single tool configuration
 *
 * @param name - Tool name
 * @param tool - Tool configuration
 * @returns List of validation errors
 */
function validateTool(name: string, tool: ToolConfig): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!name || name.trim() === '') {
    errors.push({ field: 'tool name', message: 'Tool name cannot be empty' });
  }

  if (!tool.description || typeof tool.description !== 'string') {
    errors.push({ field: `tools.${name}.description`, message: `Tool ${name}: missing description` });
  }

  if (!tool.method || typeof tool.method !== 'string') {
    errors.push({ field: `tools.${name}.method`, message: `Tool ${name}: missing method` });
  } else if (!VALID_METHODS.includes(tool.method.toUpperCase())) {
    errors.push({
      field: `tools.${name}.method`,
      message: `Tool ${name}: invalid method ${tool.method}`,
    });
  }

  if (!tool.path || typeof tool.path !== 'string') {
    errors.push({ field: `tools.${name}.path`, message: `Tool ${name}: missing path` });
  }

  return errors;
}
