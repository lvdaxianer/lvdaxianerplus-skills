/**
 * Request and response transformation
 *
 * @author lvdaxianerplus
 * @date 2026-04-18
 */

import type { ResponseTransformConfig } from '../config/types.js';

/**
 * Transform request arguments
 *
 * @param args - Original arguments
 * @param transform - Transform mapping
 * @returns Transformed arguments
 */
export function transformRequest(
  args: Record<string, unknown>,
  transform: Record<string, string>
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(args)) {
    const newKey = transform[key] ?? key;
    result[newKey] = value;
  }

  return result;
}

/**
 * Transform response data
 *
 * @param data - Original response data
 * @param config - Response transformation config
 * @returns Transformed response
 */
export function transformResponse(
  data: unknown,
  config: ResponseTransformConfig
): unknown {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const obj = data as Record<string, unknown>;
  let result: Record<string, unknown> = { ...obj };

  // Apply pick first (using original field names)
  if (config.pick && config.pick.length > 0) {
    const picked: Record<string, unknown> = {};
    // Include both original names and any new names that were created by rename
    const pickTargets = new Set(config.pick);

    // Add renamed versions to pick targets
    if (config.rename) {
      for (const [oldKey, newKey] of Object.entries(config.rename)) {
        if (config.pick.includes(oldKey)) {
          pickTargets.add(newKey);
        }
      }
    }

    for (const key of pickTargets) {
      if (key in result) {
        picked[key] = result[key];
      }
    }
    result = picked;
  }

  // Then apply rename
  if (config.rename) {
    for (const [oldKey, newKey] of Object.entries(config.rename)) {
      if (oldKey in result) {
        result[newKey] = result[oldKey];
        delete result[oldKey];
      }
    }
  }

  return result;
}
