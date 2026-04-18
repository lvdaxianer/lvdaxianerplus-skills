/**
 * Metrics middleware
 *
 * @author lvdaxianerplus
 * @date 2026-04-18
 */

interface MetricData {
  requests: number;
  successes: number;
  errors: number;
  totalDuration: number;
  lastRequest: number;
  lastSuccess: number;
  lastError: number;
}

const metrics: Map<string, MetricData> = new Map();

/**
 * Record a metric
 *
 * @param toolName - Tool name
 * @param status - Status: success/error
 * @param duration - Request duration in ms
 */
export function recordMetric(toolName: string, status: 'success' | 'error', duration?: number): void {
  let data = metrics.get(toolName);

  if (!data) {
    data = {
      requests: 0,
      successes: 0,
      errors: 0,
      totalDuration: 0,
      lastRequest: 0,
      lastSuccess: 0,
      lastError: 0,
    };
    metrics.set(toolName, data);
  }

  data.requests++;
  data.lastRequest = Date.now();

  if (status === 'success') {
    data.successes++;
    data.lastSuccess = Date.now();
  } else {
    data.errors++;
    data.lastError = Date.now();
  }

  if (duration !== undefined) {
    data.totalDuration += duration;
  }
}

/**
 * Get metrics for a tool
 *
 * @param toolName - Tool name
 * @returns Metrics data
 */
export function getToolMetrics(toolName: string): MetricData | undefined {
  return metrics.get(toolName);
}

/**
 * Get all metrics
 *
 * @returns All metrics data
 */
export function getAllMetrics(): Record<string, MetricData> {
  const result: Record<string, MetricData> = {};
  metrics.forEach((data, name) => {
    result[name] = data;
  });
  return result;
}

/**
 * Get aggregated metrics
 *
 * @returns Aggregated metrics
 */
export function getAggregatedMetrics(): {
  totalRequests: number;
  totalSuccesses: number;
  totalErrors: number;
  avgDuration: number;
  toolCount: number;
} {
  let totalRequests = 0;
  let totalSuccesses = 0;
  let totalErrors = 0;
  let totalDuration = 0;

  metrics.forEach((data) => {
    totalRequests += data.requests;
    totalSuccesses += data.successes;
    totalErrors += data.errors;
    totalDuration += data.totalDuration;
  });

  return {
    totalRequests,
    totalSuccesses,
    totalErrors,
    avgDuration: totalRequests > 0 ? totalDuration / totalRequests : 0,
    toolCount: metrics.size,
  };
}

/**
 * Reset all metrics
 */
export function resetMetrics(): void {
  metrics.clear();
}
