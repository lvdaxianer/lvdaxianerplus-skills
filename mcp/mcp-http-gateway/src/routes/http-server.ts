/**
 * HTTP server for health check and metrics
 *
 * @author lvdaxianerplus
 * @date 2026-04-18
 */

import type { Config } from '../config/types.js';
import {
  handleHealthCheck,
  handleMetrics,
  handleDashboard,
  setStartTime,
} from './health.js';
import { logger } from '../middleware/logger.js';

export interface HttpServerOptions {
  config: Config;
}

/**
 * Start HTTP server for health checks and metrics
 *
 * @param options - Server options
 * @returns HTTP server instance
 */
export async function startHttpServer(options: HttpServerOptions): Promise<{ server: unknown; port: number }> {
  const { config } = options;
  const port = config.metrics?.port ?? config.healthCheck?.port ?? 11112;

  setStartTime();

  // Create simple HTTP server using Node's built-in http module
  const http = await import('http');

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url ?? '/', `http://localhost:${port}`);

    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    try {
      // Health check
      if (url.pathname === '/health' || url.pathname === '/health/ready' || url.pathname === '/health/live') {
        const health = handleHealthCheck(config);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(health));
        return;
      }

      // Metrics
      if (url.pathname === '/metrics') {
        const metrics = handleMetrics();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(metrics));
        return;
      }

      // Dashboard
      if (url.pathname === '/dashboard') {
        const dashboard = handleDashboard(config);
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(createDashboardHtml(dashboard));
        return;
      }

      // API endpoint for dashboard data
      if (url.pathname === '/api/dashboard') {
        const dashboard = handleDashboard(config);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(dashboard));
        return;
      }

      // Not found
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found' }));
    } catch (error) {
      logger.error('HTTP server error', { error });
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal server error' }));
    }
  });

  server.listen(port, () => {
    logger.info(`HTTP server started on port ${port}`);
  });

  return { server, port };
}

/**
 * Create dashboard HTML
 *
 * @param data - Dashboard data
 * @returns HTML string
 */
function createDashboardHtml(data: {
  metrics: {
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
    }>;
  };
  circuitBreakers: Record<string, { state: string; failures: number; successes: number }>;
  cache: { size: number; maxSize: number; ttl: number };
  logs?: Array<{ timestamp: string; level: string; message: string }>;
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MCP HTTP Gateway</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; padding: 20px; }
    .container { max-width: 1200px; margin: 0 auto; }
    h1 { color: #333; margin-bottom: 20px; }
    .card { background: white; border-radius: 8px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .card h2 { color: #666; font-size: 14px; margin-bottom: 15px; text-transform: uppercase; }
    .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; }
    .stat { background: #f9f9f9; padding: 15px; border-radius: 6px; }
    .stat-value { font-size: 28px; font-weight: bold; color: #333; }
    .stat-label { font-size: 12px; color: #666; margin-top: 5px; }
    .stat.success .stat-value { color: #22c55e; }
    .stat.error .stat-value { color: #ef4444; }
    table { width: 100%; border-collapse: collapse; }
    th, td { text-align: left; padding: 12px; border-bottom: 1px solid #eee; }
    th { color: #666; font-weight: 600; }
    .state { padding: 4px 8px; border-radius: 4px; font-size: 12px; }
    .state.closed { background: #dcfce7; color: #166534; }
    .state.open { background: #fee2e2; color: #991b1b; }
    .state.half_open { background: #fef3c7; color: #92400e; }
    .logs { max-height: 300px; overflow-y: auto; font-family: monospace; font-size: 12px; }
    .log { padding: 6px 0; border-bottom: 1px solid #f0f0f0; }
    .log-time { color: #666; margin-right: 10px; }
    .log.info { color: #333; }
    .log.warn { color: #d97706; }
    .log.error { color: #dc2626; }
  </style>
</head>
<body>
  <div class="container">
    <h1>MCP HTTP Gateway</h1>

    <div class="card">
      <h2>Overview</h2>
      <div class="stats">
        <div class="stat">
          <div class="stat-value">${data.metrics.aggregated.totalRequests}</div>
          <div class="stat-label">Total Requests</div>
        </div>
        <div class="stat success">
          <div class="stat-value">${data.metrics.aggregated.successRate}</div>
          <div class="stat-label">Success Rate</div>
        </div>
        <div class="stat error">
          <div class="stat-value">${data.metrics.aggregated.totalErrors}</div>
          <div class="stat-label">Errors</div>
        </div>
        <div class="stat">
          <div class="stat-value">${Math.round(data.metrics.aggregated.avgDuration)}ms</div>
          <div class="stat-label">Avg Latency</div>
        </div>
      </div>
    </div>

    <div class="card">
      <h2>Circuit Breakers</h2>
      <table>
        <thead>
          <tr>
            <th>Tool</th>
            <th>State</th>
            <th>Failures</th>
            <th>Successes</th>
          </tr>
        </thead>
        <tbody>
          ${Object.entries(data.circuitBreakers).map(([name, cb]) => `
          <tr>
            <td>${name}</td>
            <td><span class="state ${cb.state.toLowerCase().replace('_', '-')}">${cb.state}</span></td>
            <td>${cb.failures}</td>
            <td>${cb.successes}</td>
          </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <div class="card">
      <h2>Cache</h2>
      <p>${data.cache.size} / ${data.cache.maxSize} entries</p>
    </div>

    <div class="card">
      <h2>Recent Logs</h2>
      <div class="logs">
        ${(data.logs ?? []).map((l: { timestamp: string; level: string; message: string }) => `
        <div class="log ${l.level}">
          <span class="log-time">${new Date(l.timestamp).toLocaleTimeString()}</span>
          ${l.message}
        </div>
        `).join('')}
      </div>
    </div>
  </div>
</body>
</html>`;
}
