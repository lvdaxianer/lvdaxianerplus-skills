/**
 * Health check routes
 *
 * @author lvdaxianerplus
 * @date 2026-04-18
 */

import type { Config } from '../config/types.js';
import { getCacheStats } from '../features/cache.js';
import { getCircuitBreakerStatus } from '../features/circuit-breaker.js';
import { getAggregatedMetrics, getAllMetrics } from '../middleware/metrics.js';
import { logger } from '../middleware/logger.js';

export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: number;
  checks: {
    config: { status: string; detail: string };
    circuitBreakers: { status: string; detail: string };
    cache: { status: string; detail: string };
  };
}

export interface MetricsResponse {
  aggregated: {
    totalRequests: number;
    totalSuccesses: number;
    totalErrors: number;
    avgDuration: number;
    successRate: string;
  };
  tools: Record<string, {
    requests: number;
    successes: number;
    errors: number;
    avgDuration: number;
    lastRequest: number;
  }>;
}

export interface DashboardData {
  metrics: MetricsResponse;
  circuitBreakers: Record<string, { state: string; failures: number; successes: number }>;
  cache: { size: number; maxSize: number; ttl: number };
  logs: Array<{ timestamp: string; level: string; message: string }>;
}

let startTime = Date.now();

/**
 * Set start time for uptime calculation
 */
export function setStartTime(): void {
  startTime = Date.now();
}

/**
 * Handle health check
 *
 * @param config - Configuration
 * @returns Health check response
 */
export function handleHealthCheck(config: Config): HealthCheckResponse {
  const toolNames = Object.keys(config.tools);
  const circuitBreakerStatus = getCircuitBreakerStatus(toolNames);

  // Check circuit breakers
  const cbStates = Object.values(circuitBreakerStatus).map((s) => s.state);
  const allClosed = cbStates.every((s) => s === 'CLOSED');

  return {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: Date.now() - startTime,
    checks: {
      config: { status: 'ok', detail: `${toolNames.length} tools loaded` },
      circuitBreakers: {
        status: allClosed ? 'ok' : 'degraded',
        detail: `${cbStates.filter((s) => s === 'CLOSED').length}/${cbStates.length} closed`,
      },
      cache: {
        status: 'ok',
        detail: `${getCacheStats().size} entries`,
      },
    },
  };
}

/**
 * Handle metrics endpoint
 *
 * @returns Metrics response
 */
export function handleMetrics(): MetricsResponse {
  const aggregated = getAggregatedMetrics();
  const allMetrics = getAllMetrics();

  const tools: MetricsResponse['tools'] = {};

  for (const [name, data] of Object.entries(allMetrics)) {
    tools[name] = {
      requests: data.requests,
      successes: data.successes,
      errors: data.errors,
      avgDuration: data.requests > 0 ? data.totalDuration / data.requests : 0,
      lastRequest: data.lastRequest,
    };
  }

  return {
    aggregated: {
      ...aggregated,
      successRate: aggregated.totalRequests > 0
        ? `${((aggregated.totalSuccesses / aggregated.totalRequests) * 100).toFixed(1)}%`
        : '0%',
    },
    tools,
  };
}

/**
 * Handle dashboard endpoint
 *
 * @param config - Configuration
 * @returns Dashboard data
 */
export function handleDashboard(config: Config): DashboardData {
  const toolNames = Object.keys(config.tools);

  return {
    metrics: handleMetrics(),
    circuitBreakers: getCircuitBreakerStatus(toolNames),
    cache: getCacheStats(),
    logs: logger.getLogs(50).map((l: { timestamp: string; level: string; message: string }) => ({
      timestamp: l.timestamp,
      level: l.level,
      message: l.message,
    })),
  };
}
