/**
 * Configuration loader
 *
 * @author lvdaxianerplus
 * @date 2026-04-18
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import type { Config } from './types.js';
import { validateConfig, type ValidationResult } from './validator.js';
import {
  DEFAULT_TIMEOUT,
  DEFAULT_RETRY,
  DEFAULT_CIRCUIT_BREAKER,
  DEFAULT_CACHE,
  DEFAULT_LOGGING,
  DEFAULT_METRICS,
  DEFAULT_HEALTH_CHECK,
  DEFAULT_SERVER,
} from './types.js';

/**
 * Load and parse configuration from JSON file
 *
 * @param configPath - Path to tools.json
 * @returns Parsed and validated configuration
 */
export function loadConfig(configPath: string): Config {
  // Read file
  let rawConfig: string;
  try {
    rawConfig = readFileSync(resolve(configPath), 'utf-8');
  } catch (error) {
    throw new Error(`Config file not found: ${configPath}`);
  }

  // Parse JSON
  let config: unknown;
  try {
    config = JSON.parse(rawConfig);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Config file parse error: ${message}`);
  }

  // Validate
  const result: ValidationResult = validateConfig(config);
  if (!result.valid) {
    const errorMessages = result.errors.map((e) => `[ERROR] ${e.message}`);
    throw new Error(`Config validation failed:\n${errorMessages.join('\n')}`);
  }

  // Apply defaults and return
  return applyDefaults(config as Config);
}

/**
 * Apply default values to configuration
 *
 * @param config - Raw configuration
 * @returns Configuration with defaults applied
 */
function applyDefaults(config: Config): Config {
  return {
    ...config,
    timeout: { ...DEFAULT_TIMEOUT, ...config.timeout },
    retry: { ...DEFAULT_RETRY, ...config.retry },
    circuitBreaker: { ...DEFAULT_CIRCUIT_BREAKER, ...config.circuitBreaker },
    cache: { ...DEFAULT_CACHE, ...config.cache },
    logging: { ...DEFAULT_LOGGING, ...config.logging },
    metrics: { ...DEFAULT_METRICS, ...config.metrics },
    healthCheck: { ...DEFAULT_HEALTH_CHECK, ...config.healthCheck },
    server: { ...DEFAULT_SERVER, ...config.server },
  };
}
