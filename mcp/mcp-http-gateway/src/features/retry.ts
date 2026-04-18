/**
 * Retry handler with exponential backoff
 *
 * @author lvdaxianerplus
 * @date 2026-04-18
 */

import type { RetryConfig } from '../config/types.js';
import type { HttpResponse } from '../utils/http-client.js';

export interface RetryOptions {
  maxAttempts: number;
  delay: number;
  backoff: number;
  retryOn: number[];
}

/**
 * Execute function with retry logic
 *
 * @param fn - Async function to execute
 * @param config - Retry configuration
 * @returns Result of the function
 */
export async function executeWithRetry<T>(
  fn: () => Promise<HttpResponse>,
  config?: RetryConfig
): Promise<HttpResponse> {
  if (!config?.enabled) {
    return fn();
  }

  const options: RetryOptions = {
    maxAttempts: config.maxAttempts,
    delay: config.delay,
    backoff: config.backoff,
    retryOn: config.retryOn,
  };

  let lastError: Error | undefined;
  let attempt = 0;

  while (attempt < options.maxAttempts) {
    try {
      const response = await fn();

      // Check if we should retry based on status
      if (options.retryOn.includes(response.status)) {
        attempt++;
        if (attempt < options.maxAttempts) {
          await sleep(options.delay * Math.pow(options.backoff, attempt - 1));
          continue;
        }
      }

      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      attempt++;

      if (attempt < options.maxAttempts) {
        await sleep(options.delay * Math.pow(options.backoff, attempt - 1));
      }
    }
  }

  throw lastError ?? new Error('Max retry attempts exceeded');
}

/**
 * Sleep for specified milliseconds
 *
 * @param ms - Milliseconds to sleep
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
