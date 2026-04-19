/**
 * HTTP server for health check, metrics, and API endpoints
 *
 * Features:
 * - Health check endpoints
 * - Metrics endpoints
 * - Dashboard
 * - Cache management API
 * - Logs API (SQLite)
 * - Alerts API
 * - Audit API
 * - Config backup API
 * - Mock management API
 * - Tools API
 * - Config editor API
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */

import type { Config, MockToolConfig } from '../config/types.js';
import {
  handleHealthCheck,
  handleMetrics,
  handleDashboard,
  setStartTime,
} from './health.js';
import { logger } from '../middleware/logger.js';
import { clearCache, clearCacheByTool, getCacheStats, getAllCacheEntries } from '../features/cache.js';
import {
  getRequestLogsByDate,
  getRequestLogsByTool,
  getErrorLogsByDate,
  getFailedRequestLogs,
  getAllErrorLogs,
  getDailyStats,
  getRecentLogs,
  getTodayStats,
} from '../database/sqlite-logger.js';
import {
  getAlertsByDate,
  getUnresolvedAlerts,
  resolveAlert,
  getAlertSummary,
} from '../database/alert-logger.js';
import {
  getAuditLogsByDate,
  getAuditLogsBySession,
  getAuditReport,
} from '../database/audit-logger.js';
import {
  listBackupVersions,
  restoreConfigFromBackup,
  saveConfig,
  maskSensitiveConfig,
  validateConfigFormat,
  getCurrentConfig,
  getCurrentConfigPath,
} from '../config/loader.js';
import {
  getAllMockData,
  setGlobalMockEnabled,
  getGlobalMockEnabled,
  updateMockData,
  deleteMockData,
} from '../features/mock.js';
import { generateDynamicResponse } from '../features/mock-generator.js';
import { getDatabaseStats } from '../database/connection.js';

export interface HttpServerOptions {
  config: Config;
  port?: number;
  configPath?: string;
}

// Store config path for backup API
let configPath: string | null = null;

/**
 * Start HTTP server for health checks and metrics
 *
 * @param options - Server options
 * @returns HTTP server instance
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
export async function startHttpServer(options: HttpServerOptions): Promise<{ server: unknown; port: number }> {
  const { config, port: explicitPort, configPath: cp } = options;
  const port = explicitPort ?? config.metrics?.port ?? config.healthCheck?.port ?? 11112;

  configPath = cp ?? './tools.json';
  setStartTime();

  // Create simple HTTP server using Node's built-in http module
  const http = await import('http');

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url ?? '/', `http://localhost:${port}`);

    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
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

      // Cache management API
      if (url.pathname === '/api/cache') {
        if (req.method === 'GET') {
          const stats = getCacheStats();
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(stats));
          return;
        } else if (req.method === 'DELETE') {
          clearCache();
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, message: 'All cache cleared' }));
          return;
        }
      }

      // Cache entries API - get all cached data content
      if (url.pathname === '/api/cache/entries' && req.method === 'GET') {
        const entries = getAllCacheEntries();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(entries));
        return;
      }

      // Cache by tool
      if (url.pathname.startsWith('/api/cache/') && req.method === 'DELETE') {
        const toolName = url.pathname.split('/api/cache/')[1];
        const cleared = clearCacheByTool(toolName);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, cleared, message: `Cleared ${cleared} cache entries for tool: ${toolName}` }));
        return;
      }

      // Logs API
      if (url.pathname === '/api/logs') {
        const date = url.searchParams.get('date');
        const tool = url.searchParams.get('tool');
        const limit = parseInt(url.searchParams.get('limit') ?? '100', 10);

        let logs;
        if (tool) {
          logs = getRequestLogsByTool(tool, limit);
        } else if (date) {
          logs = getRequestLogsByDate(date, limit);
        } else {
          logs = getRecentLogs(limit);
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(logs));
        return;
      }

      // Error logs API - returns both error_logs and failed requests (response_status >= 400)
      if (url.pathname === '/api/errors') {
        const date = url.searchParams.get('date') ?? new Date().toISOString().split('T')[0];
        const limit = parseInt(url.searchParams.get('limit') ?? '100', 10);
        // 获取所有错误和失败请求（合并 error_logs 和 request_logs）
        const logs = getAllErrorLogs(date, limit);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(logs));
        return;
      }

      // Stats API
      if (url.pathname === '/api/stats') {
        const startDate = url.searchParams.get('startDate');
        const endDate = url.searchParams.get('endDate');

        if (startDate && endDate) {
          const stats = getDailyStats(startDate, endDate);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(stats));
          return;
        } else {
          // Today's stats
          const stats = getTodayStats();
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(stats));
          return;
        }
      }

      // Database stats API
      if (url.pathname === '/api/database/stats') {
        const stats = getDatabaseStats();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(stats));
        return;
      }

      // Alerts API
      if (url.pathname === '/api/alerts') {
        const date = url.searchParams.get('date');
        const limit = parseInt(url.searchParams.get('limit') ?? '100', 10);

        if (url.searchParams.get('unresolved') === 'true') {
          const alerts = getUnresolvedAlerts();
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(alerts));
          return;
        } else if (date) {
          const alerts = getAlertsByDate(date, limit);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(alerts));
          return;
        } else {
          // Alert summary
          const startDate = url.searchParams.get('startDate') ?? new Date().toISOString().split('T')[0];
          const endDate = url.searchParams.get('endDate') ?? new Date().toISOString().split('T')[0];
          const summary = getAlertSummary(startDate, endDate);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(summary));
          return;
        }
      }

      // Resolve alert
      if (url.pathname.startsWith('/api/alerts/') && url.pathname.endsWith('/resolve') && req.method === 'POST') {
        const alertId = parseInt(url.pathname.split('/api/alerts/')[1].split('/resolve')[0], 10);
        resolveAlert(alertId);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: `Alert ${alertId} resolved` }));
        return;
      }

      // Audit API
      if (url.pathname === '/api/audit') {
        const date = url.searchParams.get('date');
        const sessionId = url.searchParams.get('session');
        const startDate = url.searchParams.get('startDate');
        const endDate = url.searchParams.get('endDate');

        if (sessionId) {
          const logs = getAuditLogsBySession(sessionId);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(logs));
          return;
        } else if (date) {
          const logs = getAuditLogsByDate(date);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(logs));
          return;
        } else if (startDate && endDate) {
          const report = getAuditReport(startDate, endDate);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(report));
          return;
        } else {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Missing required parameter: date, session, or startDate/endDate' }));
          return;
        }
      }

      // Backup API
      if (url.pathname === '/api/config/backups') {
        const backups = listBackupVersions(configPath ?? './tools.json', config.backup);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(backups));
        return;
      }

      // Restore backup
      if (url.pathname.startsWith('/api/config/restore/') && req.method === 'POST') {
        const version = url.pathname.split('/api/config/restore/')[1];
        // This requires reading the backup path from request body
        // For simplicity, we'll just return a placeholder
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: `Restore ${version} - check backups list for path` }));
        return;
      }

      // Mock API
      if (url.pathname === '/api/mock') {
        // Condition: GET request - return mock status and data
        if (req.method === 'GET') {
          const mockData = getAllMockData();
          const enabled = getGlobalMockEnabled();
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ enabled, mockData }));
          return;
        } else if (req.method === 'POST') {
          // Condition: POST request - toggle global mock
          let body = '';
          req.on('data', chunk => body += chunk);
          req.on('end', () => {
            try {
              const data = JSON.parse(body);
              if (data.enabled !== undefined) {
                setGlobalMockEnabled(data.enabled);
              }
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: true, enabled: getGlobalMockEnabled() }));
            } catch {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Invalid JSON' }));
            }
          });
          return;
        } else {
          // Other methods not supported
          res.writeHead(405, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }
      }

      // Tools API - list all tools with mock status
      // 条件：GET /api/tools - 获取工具列表
      if (url.pathname === '/api/tools' && req.method === 'GET') {
        const mockDataStore = getAllMockData();
        const tools = Object.entries(config.tools).map(([name, tool]) => ({
          name,
          description: tool.description,
          method: tool.method,
          path: tool.path,
          mockEnabled: tool.mock?.enabled ?? mockDataStore[name]?.enabled ?? false,
          mockConfig: tool.mock ?? mockDataStore[name],
        }));
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ tools, globalMockEnabled: getGlobalMockEnabled() }));
        return;
      }

      // Single tool Mock API
      // 条件：/api/tools/:toolName/mock - 单个工具 Mock 配置
      const toolMockMatch = url.pathname.match(/^\/api\/tools\/([^/]+)\/mock$/);
      if (toolMockMatch) {
        const toolName = toolMockMatch[1];

        // Condition: GET - get mock config for tool
        if (req.method === 'GET') {
          const mockConfig = config.tools[toolName]?.mock ?? getAllMockData()[toolName];
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ toolName, mockConfig }));
          return;
        }

        // Condition: PUT - update mock config for tool
        if (req.method === 'PUT') {
          let body = '';
          req.on('data', chunk => body += chunk);
          req.on('end', () => {
            try {
              const mockConfig = JSON.parse(body) as MockToolConfig;
              updateMockData(toolName, mockConfig);
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: true, toolName }));
            } catch {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Invalid JSON' }));
            }
          });
          return;
        }

        // Condition: DELETE - delete mock config for tool
        if (req.method === 'DELETE') {
          deleteMockData(toolName);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, toolName }));
          return;
        }

        // Other methods not supported
        res.writeHead(405, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Method not allowed' }));
        return;
      }

      // Mock preview API - generate dynamic data preview
      // 条件：POST /api/tools/:toolName/mock/generate - 预览动态数据生成
      const mockGenerateMatch = url.pathname.match(/^\/api\/tools\/([^/]+)\/mock\/generate$/);
      if (mockGenerateMatch && req.method === 'POST') {
        const toolName = mockGenerateMatch[1];
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
          try {
            const requestData = JSON.parse(body);
            const mockConfig = config.tools[toolName]?.mock ?? getAllMockData()[toolName];

            // Condition: dynamicConfig exists
            if (mockConfig?.dynamicConfig?.enabled) {
              const generated = generateDynamicResponse(mockConfig.dynamicConfig, requestData.args);
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ generated, toolName }));
            } else {
              // No dynamic config
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'No dynamic config for this tool' }));
            }
          } catch {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid JSON' }));
          }
        });
        return;
      }

      // Config API - get current config
      // 条件：GET /api/config - 获取配置（脱敏）
      if (url.pathname === '/api/config' && req.method === 'GET') {
        const safeConfig = maskSensitiveConfig(config);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(safeConfig));
        return;
      }

      // Config API - update and save config
      // 条件：PUT /api/config - 更新配置文件（自动备份 + 热更新）
      if (url.pathname === '/api/config' && req.method === 'PUT') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
          try {
            const newConfig = JSON.parse(body) as Config;
            const savedPath = saveConfig(newConfig);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              success: true,
              path: savedPath,
              message: 'Configuration saved and hot reload triggered',
            }));
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: errorMessage }));
          }
        });
        return;
      }

      // Config validation API
      // 条件：POST /api/config/validate - 验证配置格式
      if (url.pathname === '/api/config/validate' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
          try {
            const configToValidate = JSON.parse(body);
            const result = validateConfigFormat(configToValidate);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(result));
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ valid: false, error: errorMessage }));
          }
        });
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
    logger.info('[HTTP服务] HTTP server started', { port });
  });

  return { server, port };
}

/**
 * Create dashboard HTML with Bento Box Grid design
 *
 * @param data - Dashboard data
 * @returns HTML string with modern UI
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
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
  logs?: Array<{
    timestamp: string;
    tool_name: string;
    level: string;
    message: string;
    method?: string;
    url?: string;
    response_status?: number;
    duration?: number;
    type: 'request' | 'error';
  }>;
}): string {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MCP Gateway Dashboard</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --primary: #3B82F6;
      --primary-dark: #2563EB;
      --secondary: #60A5FA;
      --cta: #F97316;
      --bg: #F8FAFC;
      --text: #1E293B;
      --text-muted: #64748B;
      --border: #E2E8F0;
      --card: #FFFFFF;
      --success: #22C55E;
      --error: #EF4444;
      --warning: #F59E0B;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background: var(--bg);
      color: var(--text);
      min-height: 100vh;
      padding: 24px;
    }
    .container { max-width: 1400px; margin: 0 auto; }

    /* Header */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 32px;
    }
    .header h1 { font-size: 24px; font-weight: 700; color: var(--text); }
    .header-nav { display: flex; gap: 8px; }
    .nav-btn {
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 150ms;
      background: var(--card);
      border: 1px solid var(--border);
      color: var(--text-muted);
    }
    .nav-btn:hover { background: #F1F5F9; }
    .nav-btn.active { background: var(--primary); border-color: var(--primary); color: white; }

    /* Bento Grid */
    .bento-grid {
      display: grid;
      grid-template-columns: repeat(12, 1fr);
      gap: 16px;
    }
    .card {
      background: var(--card);
      border-radius: 16px;
      border: 1px solid var(--border);
      padding: 24px;
      transition: all 150ms;
    }
    .card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
    .card-title {
      font-size: 12px;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .card-title svg { width: 16px; height: 16px; }

    /* Grid spans */
    .span-3 { grid-column: span 3; }
    .span-4 { grid-column: span 4; }
    .span-6 { grid-column: span 6; }
    .span-8 { grid-column: span 8; }
    .span-12 { grid-column: span 12; }

    /* Stats */
    .stat-value { font-size: 36px; font-weight: 700; line-height: 1; }
    .stat-label { font-size: 14px; color: var(--text-muted); margin-top: 8px; }
    .stat-success .stat-value { color: var(--success); }
    .stat-error .stat-value { color: var(--error); }

    /* Table */
    .table-wrapper { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 12px 16px; text-align: left; font-size: 14px; }
    th { color: var(--text-muted); font-weight: 600; border-bottom: 1px solid var(--border); }
    tr:hover td { background: #F8FAFC; }
    .badge {
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 500;
    }
    .badge-on { background: #DCFCE7; color: #166534; }
    .badge-off { background: #F3F4F6; color: #6B7280; }
    .badge-open { background: #FEE2E2; color: #991B1B; }
    .badge-closed { background: #DCFCE7; color: #166534; }
    .badge-half_open { background: #FEF3C7; color: #92400E; }

    /* Buttons */
    .btn {
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 150ms;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .btn-primary { background: var(--primary); color: white; border: none; }
    .btn-primary:hover { background: var(--primary-dark); }
    .btn-secondary { background: var(--card); color: var(--text); border: 1px solid var(--border); }
    .btn-secondary:hover { background: #F1F5F9; }
    .btn-success { background: var(--success); color: white; border: none; }
    .btn-success:hover { background: #16A34A; }
    .btn-danger { background: var(--error); color: white; border: none; }
    .btn-danger:hover { background: #DC2626; }
    .btn-sm { padding: 6px 12px; font-size: 13px; }

    /* Logs */
    .logs-list { max-height: 200px; overflow-y: auto; }
    .log-item { padding: 8px 0; font-size: 13px; border-bottom: 1px solid #F1F5F9; display: flex; gap: 12px; }
    .log-time { color: var(--text-muted); font-family: monospace; }
    .log-msg { flex: 1; }
    .log-error { color: var(--error); }
    .log-warn { color: var(--warning); }

    /* Modal */
    .modal {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(15,23,42,0.6);
      backdrop-filter: blur(4px);
      z-index: 50;
      align-items: center;
      justify-content: center;
    }
    .modal.show { display: flex; }
    .modal-box {
      background: var(--card);
      border-radius: 16px;
      width: 90%;
      max-width: 600px;
      max-height: 80vh;
      overflow: hidden;
      box-shadow: 0 20px 40px rgba(0,0,0,0.2);
    }
    .modal-header {
      padding: 20px 24px;
      border-bottom: 1px solid var(--border);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .modal-header h3 { font-size: 18px; font-weight: 600; }
    .modal-close {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: #F1F5F9;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 150ms;
    }
    .modal-close:hover { background: #E2E8F0; }
    .modal-body { padding: 24px; overflow-y: auto; }
    .modal-footer {
      padding: 16px 24px;
      border-top: 1px solid var(--border);
      display: flex;
      gap: 12px;
      justify-content: flex-end;
    }

    /* JSON Editor */
    .json-editor {
      width: 100%;
      min-height: 200px;
      padding: 12px;
      border: 1px solid var(--border);
      border-radius: 8px;
      font-family: 'Fira Code', monospace;
      font-size: 13px;
      resize: vertical;
      background: #F8FAFC;
    }
    .json-editor:focus { outline: none; border-color: var(--primary); }

    /* Form */
    .form-row { display: flex; gap: 16px; margin-bottom: 16px; }
    .form-group { flex: 1; }
    .form-label { font-size: 14px; font-weight: 500; margin-bottom: 6px; display: block; }
    .form-input {
      width: 100%;
      padding: 10px 14px;
      border: 1px solid var(--border);
      border-radius: 8px;
      font-size: 14px;
    }
    .form-input:focus { outline: none; border-color: var(--primary); }

    /* Page */
    .page { display: none; }
    .page.active { display: block; }

    /* Responsive */
    @media (max-width: 1024px) {
      .span-3, .span-4, .span-6, .span-8 { grid-column: span 6; }
    }
    @media (max-width: 768px) {
      .span-3, .span-4, .span-6, .span-8, .span-12 { grid-column: span 12; }
      .header { flex-direction: column; gap: 16px; align-items: flex-start; }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <header class="header">
      <h1>MCP Gateway</h1>
      <nav class="header-nav">
        <button class="nav-btn active" data-page="overview">总览</button>
        <button class="nav-btn" data-page="tools">工具管理</button>
      </nav>
      <div style="display:flex;align-items:center;gap:12px;">
        <select id="refresh-interval" style="padding:6px 12px;border-radius:6px;border:1px solid var(--border);font-size:13px;">
          <option value="5">5秒</option>
          <option value="10" selected>10秒</option>
          <option value="15">15秒</option>
          <option value="30">30秒</option>
          <option value="60">60秒</option>
          <option value="0">关闭自动刷新</option>
        </select>
        <button class="nav-btn" id="refresh-btn" style="background:var(--primary);color:white;border-color:var(--primary);">
          <svg style="width:16px;height:16px;margin-right:4px;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
          刷新
        </button>
      </div>
    </header>

    <!-- Overview Page -->
    <div id="page-overview" class="page active">
      <div class="bento-grid">
        <!-- Stats Cards -->
        <div class="card span-3">
          <div class="card-title">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
            总请求数
          </div>
          <div class="stat-value">${data.metrics.aggregated.totalRequests}</div>
          <div class="stat-label">累计调用次数</div>
        </div>

        <div class="card span-3 stat-success">
          <div class="card-title">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            成功率
          </div>
          <div class="stat-value">${data.metrics.aggregated.successRate}</div>
          <div class="stat-label">请求成功占比</div>
        </div>

        <div class="card span-3 stat-error" id="error-card" style="cursor: pointer;">
          <div class="card-title">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            错误数
          </div>
          <div class="stat-value">${data.metrics.aggregated.totalErrors}</div>
          <div class="stat-label">失败请求（点击查看详情）</div>
        </div>

        <div class="card span-3">
          <div class="card-title">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            平均延迟
          </div>
          <div class="stat-value">${Math.round(data.metrics.aggregated.avgDuration)}ms</div>
          <div class="stat-label">响应时间</div>
        </div>

        <!-- Circuit Breakers -->
        <div class="card span-6">
          <div class="card-title">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
            熔断器状态
          </div>
          <div class="table-wrapper">
            <table>
              <thead><tr><th>工具</th><th>状态</th><th>失败</th><th>成功</th></tr></thead>
              <tbody>
                ${Object.entries(data.circuitBreakers).map(([name, cb]) => `
                <tr>
                  <td>${name}</td>
                  <td><span class="badge badge-${cb.state.toLowerCase().replace('_', '')}">${cb.state}</span></td>
                  <td>${cb.failures}</td>
                  <td>${cb.successes}</td>
                </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Cache -->
        <div class="card span-6" id="cache-card" style="cursor: pointer;">
          <div class="card-title">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"/></svg>
            缓存状态（点击查看详情）
          </div>
          <div style="display: flex; align-items: center; gap: 24px;">
            <div>
              <div style="font-size: 28px; font-weight: 700;">${data.cache.size}</div>
              <div style="color: var(--text-muted); font-size: 14px;">已缓存</div>
            </div>
            <div style="flex: 1; background: #E2E8F0; height: 8px; border-radius: 4px; overflow: hidden;">
              <div style="background: var(--primary); height: 100%; width: ${(data.cache.size / data.cache.maxSize * 100).toFixed(1)}%;"></div>
            </div>
            <div>
              <div style="font-size: 28px; font-weight: 700; color: var(--text-muted);">${data.cache.maxSize}</div>
              <div style="color: var(--text-muted); font-size: 14px;">最大容量</div>
            </div>
          </div>
        </div>

        <!-- Logs -->
        <div class="card span-12">
          <div class="card-title">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
            最近请求
          </div>
          <div class="logs-list" style="display:flex;flex-direction:column;gap:8px;">
            ${(data.logs ?? []).slice(0, 15).map((l: { timestamp: string; tool_name: string; level: string; message: string; method?: string; url?: string; response_status?: number; duration?: number; type: string }) => `
            <div class="log-item" style="display:flex;align-items:center;gap:12px;padding:8px 12px;background:#F8FAFC;border-radius:8px;">
              <span class="log-time" style="min-width:80px;color:#64748B;">${new Date(l.timestamp).toLocaleTimeString()}</span>
              <span style="min-width:100px;font-weight:600;color:#334155;">${l.tool_name}</span>
              <span style="min-width:60px;padding:2px 8px;border-radius:4px;background:${l.method === 'GET' ? '#DBEAFE' : l.method === 'POST' ? '#FEF3C7' : '#E5E7EB'};color:${l.method === 'GET' ? '#1D4ED8' : l.method === 'POST' ? '#B45309' : '#374151'};font-size:12px;font-weight:500;">${l.method || 'N/A'}</span>
              <span style="flex:1;color:#64748B;font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${l.url || l.message || '-'}</span>
              <span style="min-width:50px;padding:2px 8px;border-radius:4px;background:${(l.response_status ?? 0) >= 400 || l.type === 'error' ? '#FEE2E2' : '#DCFCE7'};color:${(l.response_status ?? 0) >= 400 || l.type === 'error' ? '#B91C1C' : '#166534'};font-size:12px;font-weight:600;">${l.response_status ?? (l.type === 'error' ? 'ERR' : 'OK')}</span>
              <span style="min-width:50px;color:#94A3B8;font-size:12px;">${l.duration ? l.duration + 'ms' : '-'}</span>
            </div>`).join('')}
          </div>
        </div>
      </div>
    </div>

    <!-- Tools Page -->
    <div id="page-tools" class="page">
      <div class="bento-grid">
        <!-- Global Mock -->
        <div class="card span-12">
          <div class="card-title">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            全局 Mock 控制
          </div>
          <button id="global-mock-toggle" class="btn btn-secondary">加载中...</button>
        </div>

        <!-- Tools List -->
        <div class="card span-12">
          <div class="card-title">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"/></svg>
            工具列表
          </div>
          <div class="table-wrapper">
            <table>
              <thead><tr><th>名称</th><th>方法</th><th>路径</th><th>Mock</th><th>操作</th></tr></thead>
              <tbody id="tools-body">
                <tr><td colspan="5" style="text-align: center; color: var(--text-muted);">加载中...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Mock Config Modal -->
  <div id="mock-modal" class="modal">
    <div class="modal-box">
      <div class="modal-header">
        <h3>Mock 配置 - <span id="modal-tool-name"></span></h3>
        <button class="modal-close" onclick="closeModal()">
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>
      <div class="modal-body">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">延迟 (ms)</label>
            <input type="number" id="mock-delay" class="form-input" value="0">
          </div>
          <div class="form-group">
            <label class="form-label">状态码</label>
            <input type="number" id="mock-status" class="form-input" value="200">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">响应数据 (JSON)</label>
          <textarea id="mock-response" class="json-editor" placeholder='{"success": true, "data": {} }'></textarea>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="closeModal()">取消</button>
        <button class="btn btn-primary" onclick="saveMockConfig()">保存</button>
      </div>
    </div>
  </div>

  <!-- Error Details Modal -->
  <div id="error-modal" class="modal">
    <div class="modal-box" style="max-width: 800px;">
      <div class="modal-header">
        <h3>错误详情</h3>
        <button class="modal-close" onclick="closeErrorModal()">
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>
      <div class="modal-body" id="error-modal-body" style="max-height: 500px; overflow-y: auto;">
        加载中...
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="closeErrorModal()">关闭</button>
      </div>
    </div>
  </div>

  <!-- Cache Details Modal -->
  <div id="cache-modal" class="modal">
    <div class="modal-box" style="max-width: 900px;">
      <div class="modal-header">
        <h3>缓存数据详情</h3>
        <button class="modal-close" onclick="closeCacheModal()">
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>
      <div class="modal-body" id="cache-modal-body" style="max-height: 500px; overflow-y: auto;">
        加载中...
      </div>
      <div class="modal-footer">
        <button class="btn btn-danger" onclick="clearAllCache()">清空所有缓存</button>
        <button class="btn btn-secondary" onclick="closeCacheModal()">关闭</button>
      </div>
    </div>
  </div>

  <script>
    // State
    let globalMockEnabled = false;
    let currentTool = '';
    let refreshTimer = null;
    let refreshInterval = 10000; // 默认 10秒

    // API helper
    async function api(path, method = 'GET', body = null) {
      const opts = { method, headers: { 'Content-Type': 'application/json' } };
      if (body) opts.body = JSON.stringify(body);
      const res = await fetch(path, opts);
      return res.json();
    }

    // Auto refresh for overview page
    function startAutoRefresh() {
      stopAutoRefresh();
      // 条件：refreshInterval > 0 表示开启自动刷新
      if (refreshInterval > 0) {
        refreshTimer = setInterval(() => {
          if (document.getElementById('page-overview').classList.contains('active')) {
            refreshDashboardData();
          }
        }, refreshInterval);
      }
    }

    function stopAutoRefresh() {
      if (refreshTimer) {
        clearInterval(refreshTimer);
        refreshTimer = null;
      }
    }

    async function refreshDashboardData() {
      try {
        const data = await api('/api/dashboard');
        updateDashboardUI(data);
      } catch (err) {
        console.error('刷新失败:', err);
      }
    }

    function updateDashboardUI(data) {
      // 更新统计卡片
      const statCards = document.querySelectorAll('.stat-value');
      if (statCards[0]) statCards[0].textContent = data.metrics.aggregated.totalRequests;
      if (statCards[1]) statCards[1].textContent = data.metrics.aggregated.successRate;
      if (statCards[2]) statCards[2].textContent = data.metrics.aggregated.totalErrors;
      if (statCards[3]) statCards[3].textContent = data.metrics.aggregated.avgDuration + 'ms';

      // 更新缓存状态
      const cacheSize = document.querySelector('.card[id="cache-card"] .stat-value');
      if (cacheSize) cacheSize.textContent = data.cache.size;

      // 更新最近请求列表
      const logsList = document.querySelector('.logs-list');
      if (logsList && data.logs) {
        logsList.innerHTML = data.logs.slice(0, 15).map(l => {
          // 条件：根据请求方法设置颜色
          const methodBg = l.method === 'GET' ? '#DBEAFE' : (l.method === 'POST' ? '#FEF3C7' : '#E5E7EB');
          const methodColor = l.method === 'GET' ? '#1D4ED8' : (l.method === 'POST' ? '#B45309' : '#374151');
          // 条件：根据状态设置颜色
          const statusBg = (l.response_status >= 400 || l.type === 'error') ? '#FEE2E2' : '#DCFCE7';
          const statusColor = (l.response_status >= 400 || l.type === 'error') ? '#B91C1C' : '#166534';
          const statusText = l.response_status ? l.response_status : (l.type === 'error' ? 'ERR' : 'OK');

          return '<div class="log-item" style="display:flex;align-items:center;gap:12px;padding:8px 12px;background:#F8FAFC;border-radius:8px;">' +
            '<span class="log-time" style="min-width:80px;color:#64748B;">' + new Date(l.timestamp).toLocaleTimeString() + '</span>' +
            '<span style="min-width:100px;font-weight:600;color:#334155;">' + l.tool_name + '</span>' +
            '<span style="min-width:60px;padding:2px 8px;border-radius:4px;background:' + methodBg + ';color:' + methodColor + ';font-size:12px;font-weight:500;">' + (l.method || 'N/A') + '</span>' +
            '<span style="flex:1;color:#64748B;font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + (l.url || l.message || '-') + '</span>' +
            '<span style="min-width:50px;padding:2px 8px;border-radius:4px;background:' + statusBg + ';color:' + statusColor + ';font-size:12px;font-weight:600;">' + statusText + '</span>' +
            '<span style="min-width:50px;color:#94A3B8;font-size:12px;">' + (l.duration ? l.duration + 'ms' : '-') + '</span>' +
          '</div>';
        }).join('');
      }

      // 更新熔断器表格
      const tbody = document.querySelector('#page-overview table tbody');
      if (tbody && data.circuitBreakers) {
        const rows = Object.entries(data.circuitBreakers).map(([name, cb]) => {
          return '<tr>' +
            '<td>' + name + '</td>' +
            '<td><span class="badge ' + (cb.state === 'CLOSED' ? 'badge-on' : 'badge-off') + '">' + cb.state + '</span></td>' +
            '<td>' + cb.failures + '</td>' +
            '<td>' + cb.successes + '</td>' +
          '</tr>';
        }).join('');
        tbody.innerHTML = rows;
      }
    }

    // 刷新间隔选择器
    document.getElementById('refresh-interval').addEventListener('change', (e) => {
      const seconds = parseInt(e.target.value, 10);
      // 条件：最小间隔 5秒，0 表示关闭自动刷新
      refreshInterval = seconds >= 5 ? seconds * 1000 : (seconds === 0 ? 0 : 5000);
      startAutoRefresh();
    });

    // 手动刷新按钮
    document.getElementById('refresh-btn').addEventListener('click', () => {
      refreshDashboardData();
    });

    // 启动自动刷新
    startAutoRefresh();

    // Navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.getElementById('page-' + btn.dataset.page).classList.add('active');
        if (btn.dataset.page === 'tools') loadTools();
      });
    });

    // Load tools
    async function loadTools() {
      const data = await api('/api/tools');
      globalMockEnabled = data.globalMockEnabled;

      const toggleBtn = document.getElementById('global-mock-toggle');
      toggleBtn.textContent = globalMockEnabled ? 'Mock 已开启' : 'Mock 已关闭';
      toggleBtn.className = globalMockEnabled ? 'btn btn-success' : 'btn btn-secondary';

      const tbody = document.getElementById('tools-body');
      tbody.innerHTML = data.tools.map(t => {
        const isOn = t.mockEnabled;
        return '<tr>' +
          '<td><strong>' + t.name + '</strong></td>' +
          '<td>' + t.method + '</td>' +
          '<td style="color: var(--text-muted); max-width: 200px; overflow: hidden; text-overflow: ellipsis;">' + t.path + '</td>' +
          '<td><span class="badge ' + (isOn ? 'badge-on' : 'badge-off') + '">' + (isOn ? '开启' : '关闭') + '</span></td>' +
          '<td>' +
            '<button class="btn btn-sm ' + (isOn ? 'btn-danger' : 'btn-success') + '" onclick="toggleMock(\\'' + t.name + '\\')">' + (isOn ? '关闭' : '开启') + '</button> ' +
            '<button class="btn btn-sm btn-primary" onclick="openModal(\\'' + t.name + '\\')">配置</button>' +
          '</td>' +
        '</tr>';
      }).join('');
    }

    // Global mock toggle
    document.getElementById('global-mock-toggle').addEventListener('click', async () => {
      globalMockEnabled = !globalMockEnabled;
      await api('/api/mock', 'POST', { enabled: globalMockEnabled });
      loadTools();
    });

    // Toggle single tool mock
    async function toggleMock(name) {
      const tool = (await api('/api/tools')).tools.find(t => t.name === name);
      await api('/api/tools/' + name + '/mock', 'PUT', { enabled: !tool.mockEnabled });
      loadTools();
    }

    // Open modal
    async function openModal(name) {
      currentTool = name;
      document.getElementById('modal-tool-name').textContent = name;
      document.getElementById('mock-modal').classList.add('show');

      const data = await api('/api/tools/' + name + '/mock');
      const config = data.mockConfig || {};

      document.getElementById('mock-delay').value = config.delay || 0;
      document.getElementById('mock-status').value = config.statusCode || 200;
      document.getElementById('mock-response').value = config.response ? JSON.stringify(config.response, null, 2) : '{\\n  "success": true\\n}';
    }

    // Close modal
    function closeModal() {
      document.getElementById('mock-modal').classList.remove('show');
    }

    // Save mock config
    async function saveMockConfig() {
      const delay = parseInt(document.getElementById('mock-delay').value) || 0;
      const status = parseInt(document.getElementById('mock-status').value) || 200;
      let response = {};

      try {
        response = JSON.parse(document.getElementById('mock-response').value);
      } catch (e) {
        alert('JSON 格式错误');
        return;
      }

      await api('/api/tools/' + currentTool + '/mock', 'PUT', {
        enabled: true,
        delay,
        statusCode: status,
        response
      });

      closeModal();
      loadTools();
    }

    // Close modal on backdrop click
    document.getElementById('mock-modal').addEventListener('click', (e) => {
      if (e.target.id === 'mock-modal') closeModal();
    });

    // Error details modal
    document.getElementById('error-card').addEventListener('click', async () => {
      await showErrorDetails();
    });

    async function showErrorDetails() {
      const modal = document.getElementById('error-modal');
      const body = document.getElementById('error-modal-body');
      modal.classList.add('show');
      body.innerHTML = '<p style="text-align:center;padding:20px;">加载中...</p>';

      try {
        const errors = await api('/api/errors?limit=50');
        if (errors.length === 0) {
          body.innerHTML = '<p style="text-align:center;padding:20px;color:#64748B;">暂无错误记录</p>';
          return;
        }

        let html = '';
        for (const e of errors) {
          html += '<div style="border-bottom:1px solid #E2E8F0;padding:12px 0;">';
          html += '<div style="display:flex;justify-content:space-between;margin-bottom:8px;">';
          html += '<span style="font-weight:600;color:#EF4444;">' + e.tool_name + '</span>';
          html += '<span style="color:#64748B;font-size:12px;">' + new Date(e.timestamp).toLocaleString() + '</span>';
          html += '</div>';
          // 显示错误类型和状态码
          html += '<p style="color:#334155;font-size:14px;margin:6px 0;">';
          if (e.type === 'failed_request' && e.response_status) {
            html += '<span style="background:#FEE2E2;padding:2px 8px;border-radius:4px;color:#EF4444;">HTTP ' + e.response_status + '</span> ';
            html += e.message;
          } else if (e.error_type) {
            html += '<span style="background:#FEE2E2;padding:2px 8px;border-radius:4px;color:#EF4444;">' + e.error_type + '</span> ';
            html += e.message;
          } else {
            html += e.message;
          }
          html += '</p>';
          // 显示 URL 和耗时
          html += '<p style="color:#64748B;font-size:13px;">';
          if (e.url) {
            html += 'URL: ' + e.url;
          } else if (e.request_url) {
            html += 'URL: ' + e.request_url;
          }
          if (e.method) {
            html += ' | 方法: ' + e.method;
          } else if (e.request_method) {
            html += ' | 方法: ' + e.request_method;
          }
          if (e.duration) {
            html += ' | 耗时: ' + e.duration + 'ms';
          }
          html += '</p>';
          // 显示响应体（失败请求的错误信息）
          if (e.response_body) {
            html += '<details style="margin-top:8px;"><summary style="cursor:pointer;color:#64748B;">响应内容</summary>';
            html += '<pre style="background:#F8FAFC;padding:12px;border-radius:8px;font-size:12px;overflow-x:auto;margin-top:8px;">' + e.response_body + '</pre></details>';
          }
          // 显示堆栈信息
          if (e.error_stack) {
            html += '<details style="margin-top:8px;"><summary style="cursor:pointer;color:#64748B;">堆栈信息</summary>';
            html += '<pre style="background:#F8FAFC;padding:12px;border-radius:8px;font-size:12px;overflow-x:auto;margin-top:8px;">' + e.error_stack + '</pre></details>';
          }
          html += '</div>';
        }
        body.innerHTML = html;
      } catch (err) {
        body.innerHTML = '<p style="text-align:center;padding:20px;color:#EF4444;">加载失败: ' + err.message + '</p>';
      }
    }

    function closeErrorModal() {
      document.getElementById('error-modal').classList.remove('show');
    }

    document.getElementById('error-modal').addEventListener('click', (e) => {
      if (e.target.id === 'error-modal') closeErrorModal();
    });

    // Cache details modal
    document.getElementById('cache-card').addEventListener('click', showCacheDetails);

    async function showCacheDetails() {
      const modal = document.getElementById('cache-modal');
      const body = document.getElementById('cache-modal-body');
      modal.classList.add('show');
      body.innerHTML = '<p style="text-align:center;padding:20px;">加载中...</p>';

      try {
        const entries = await api('/api/cache/entries');
        if (entries.length === 0) {
          body.innerHTML = '<p style="text-align:center;padding:20px;color:#64748B;">暂无缓存数据</p>';
          return;
        }

        let html = '';
        for (const e of entries) {
          html += '<div style="border-bottom:1px solid #E2E8F0;padding:12px 0;">';
          html += '<div style="display:flex;justify-content:space-between;margin-bottom:8px;">';
          html += '<span style="font-weight:600;color:#3B82F6;">' + e.toolName + '</span>';
          html += '<span style="color:#64748B;font-size:12px;">缓存时间: ' + new Date(e.timestamp).toLocaleString() + ' (' + Math.round(e.age / 1000) + '秒前)</span>';
          html += '</div>';
          html += '<p style="color:#64748B;font-size:13px;margin:4px 0;">参数: ' + e.args + '</p>';
          html += '<details style="margin-top:8px;"><summary style="cursor:pointer;color:#64748B;">缓存数据</summary>';
          html += '<pre style="background:#F8FAFC;padding:12px;border-radius:8px;font-size:12px;overflow-x:auto;margin-top:8px;max-height:200px;">' + JSON.stringify(e.data, null, 2) + '</pre></details>';
          html += '<div style="margin-top:8px;">';
          html += '<button class="btn btn-sm btn-danger" onclick="clearCacheByToolName(\\'' + e.toolName + '\\')">删除此工具缓存</button>';
          html += '</div>';
          html += '</div>';
        }
        body.innerHTML = html;
      } catch (err) {
        body.innerHTML = '<p style="text-align:center;padding:20px;color:#EF4444;">加载失败: ' + err.message + '</p>';
      }
    }

    function closeCacheModal() {
      document.getElementById('cache-modal').classList.remove('show');
    }

    async function clearAllCache() {
      try {
        await api('/api/cache', 'DELETE');
        showCacheDetails();
      } catch (err) {
        alert('清空缓存失败: ' + err.message);
      }
    }

    async function clearCacheByToolName(toolName) {
      try {
        await api('/api/cache/' + toolName, 'DELETE');
        showCacheDetails();
      } catch (err) {
        alert('删除缓存失败: ' + err.message);
      }
    }

    document.getElementById('cache-modal').addEventListener('click', (e) => {
      if (e.target.id === 'cache-modal') closeCacheModal();
    });
  </script>
</body>
</html>`;
}
