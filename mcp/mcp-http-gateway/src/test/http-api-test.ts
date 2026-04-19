/**
 * HTTP API Test Runner for MCP HTTP Gateway
 *
 * Tests all storylines via HTTP API and MCP protocol simulation
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */

interface TestResult {
  storylineId: number;
  storylineName: string;
  passed: boolean;
  error?: string;
  data?: unknown;
  duration: number;
}

const BASE_URL = 'http://localhost:11112';

/**
 * API helper function
 *
 * @param path - API path
 * @param method - HTTP method
 * @param body - Request body
 * @returns Response data
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
async function api(path: string, method: string = 'GET', body?: unknown): Promise<unknown> {
  const url = `${BASE_URL}${path}`;
  const startTime = Date.now();

  try {
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined
    });

    const data = await response.json();
    const duration = Date.now() - startTime;

    return { success: response.ok, data, duration, status: response.status };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      duration: Date.now() - startTime
    };
  }
}

/**
 * Test runner class
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
class HttpApiTestRunner {
  private results: TestResult[] = [];

  /**
   * Test a storyline
   *
   * @param storyline - Storyline configuration
   * @returns Test result
   * @author lvdaxianerplus
   * @date 2026-04-19
   */
  async testStoryline(storyline: {
    id: number;
    name: string;
    testFn: () => Promise<{ passed: boolean; data?: unknown; error?: string }>;
  }): Promise<TestResult> {
    const startTime = Date.now();
    console.log(`[测试故事线 ${storyline.id}] ${storyline.name}`);

    try {
      const result = await storyline.testFn();
      return {
        storylineId: storyline.id,
        storylineName: storyline.name,
        passed: result.passed,
        data: result.data,
        error: result.error,
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        storylineId: storyline.id,
        storylineName: storyline.name,
        passed: false,
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Run all tests
   *
   * @returns Test results
   * @author lvdaxianerplus
   * @date 2026-04-19
   */
  async runAllTests(): Promise<TestResult[]> {
    console.log('[测试启动] 开始运行所有故事线测试...\n');

    // Define test storylines
    const storylines = [
      // === MCP Server Module (#1-15) ===
      {
        id: 1,
        name: '健康检查 - 服务状态验证',
        testFn: async () => {
          const result = await api('/health');
          const data = result as { success: boolean; data: { status: string } };
          return { passed: data.data?.status === 'healthy', data: result };
        }
      },
      {
        id: 2,
        name: '工具列表获取 - ListTools',
        testFn: async () => {
          const result = await api('/api/tools');
          const data = result as { success: boolean; data: { tools: unknown[] } };
          return { passed: data.success && Array.isArray(data.data?.tools), data: result };
        }
      },
      {
        id: 3,
        name: 'Mock状态获取',
        testFn: async () => {
          const result = await api('/api/mock');
          const data = result as { success: boolean; data: { enabled: boolean } };
          return { passed: data.success, data: result };
        }
      },
      {
        id: 4,
        name: '全局Mock启用',
        testFn: async () => {
          const result = await api('/api/mock', 'POST', { enabled: true });
          const data = result as { success: boolean; data: { enabled: boolean } };
          return { passed: data.success && data.data?.enabled === true, data: result };
        }
      },
      {
        id: 5,
        name: 'Dashboard数据获取',
        testFn: async () => {
          const result = await api('/api/dashboard');
          const data = result as { success: boolean; data: { metrics: unknown } };
          return { passed: data.success && data.data?.metrics !== undefined, data: result };
        }
      },
      {
        id: 6,
        name: '日志列表获取',
        testFn: async () => {
          const result = await api('/api/logs');
          const data = result as { success: boolean; data: unknown[] };
          return { passed: data.success, data: result };
        }
      },
      {
        id: 7,
        name: '错误日志获取',
        testFn: async () => {
          const result = await api('/api/errors');
          const data = result as { success: boolean; data: unknown[] };
          return { passed: data.success, data: result };
        }
      },
      {
        id: 8,
        name: '统计数据获取',
        testFn: async () => {
          const result = await api('/api/stats');
          const data = result as { success: boolean; data: unknown };
          return { passed: data.success, data: result };
        }
      },
      {
        id: 9,
        name: '告警列表获取',
        testFn: async () => {
          const result = await api('/api/alerts');
          const data = result as { success: boolean; data: unknown };
          return { passed: data.success, data: result };
        }
      },
      {
        id: 10,
        name: '配置获取（脱敏）',
        testFn: async () => {
          const result = await api('/api/config');
          const data = result as { success: boolean; data: { tools: unknown } };
          return { passed: data.success && data.data?.tools !== undefined, data: result };
        }
      },
      {
        id: 11,
        name: '缓存状态获取',
        testFn: async () => {
          const result = await api('/api/cache');
          const data = result as { success: boolean; data: { size: number } };
          return { passed: data.success, data: result };
        }
      },
      {
        id: 12,
        name: '数据库统计',
        testFn: async () => {
          const result = await api('/api/database/stats');
          const data = result as { success: boolean; data: unknown };
          return { passed: data.success, data: result };
        }
      },
      {
        id: 13,
        name: '指标获取',
        testFn: async () => {
          const result = await api('/metrics');
          const data = result as { success: boolean; data: unknown };
          return { passed: data.success, data: result };
        }
      },
      {
        id: 14,
        name: '备份版本列表',
        testFn: async () => {
          const result = await api('/api/config/backups');
          const data = result as { success: boolean; data: unknown[] };
          return { passed: data.success, data: result };
        }
      },
      {
        id: 15,
        name: '审计日志查询',
        testFn: async () => {
          const result = await api('/api/audit?date=' + new Date().toISOString().split('T')[0]);
          const data = result as { success: boolean; data: unknown[] };
          return { passed: data.success, data: result };
        }
      },

      // === Tool Executor Module (#16-35) ===
      {
        id: 16,
        name: 'getUser工具Mock配置获取',
        testFn: async () => {
          const result = await api('/api/tools/getUser/mock');
          const data = result as { success: boolean; data: { mockConfig: unknown } };
          return { passed: data.success && data.data?.mockConfig !== undefined, data: result };
        }
      },
      {
        id: 17,
        name: 'getUser工具Mock更新',
        testFn: async () => {
          const result = await api('/api/tools/getUser/mock', 'PUT', {
            enabled: true,
            response: { id: 'test-user', name: '测试用户' }
          });
          const data = result as { success: boolean; data: { success: boolean } };
          return { passed: data.success, data: result };
        }
      },
      {
        id: 18,
        name: 'addAge工具Mock配置',
        testFn: async () => {
          const result = await api('/api/tools/addAge/mock', 'PUT', {
            enabled: true,
            response: { success: true, message: '年龄更新成功' }
          });
          const data = result as { success: boolean; data: { success: boolean } };
          return { passed: data.success, data: result };
        }
      },
      {
        id: 19,
        name: 'queryUser工具Mock配置',
        testFn: async () => {
          const result = await api('/api/tools/queryUser/mock', 'PUT', {
            enabled: true,
            response: { users: [{ id: 'u1', name: '张三' }] }
          });
          const data = result as { success: boolean; data: { success: boolean } };
          return { passed: data.success, data: result };
        }
      },
      {
        id: 20,
        name: '工具列表刷新',
        testFn: async () => {
          const result = await api('/api/tools');
          const data = result as { success: boolean; data: { tools: unknown[] } };
          const tools = data.data?.tools || [];
          return { passed: tools.length >= 5, data: result };
        }
      },
      {
        id: 21,
        name: '缓存清理',
        testFn: async () => {
          const result = await api('/api/cache', 'DELETE');
          const data = result as { success: boolean; data: { success: boolean } };
          return { passed: data.success && data.data?.success === true, data: result };
        }
      },
      {
        id: 22,
        name: '工具缓存清理-getUser',
        testFn: async () => {
          const result = await api('/api/cache/getUser', 'DELETE');
          const data = result as { success: boolean; data: { success: boolean } };
          return { passed: data.success, data: result };
        }
      },
      {
        id: 23,
        name: 'Dashboard验证-熔断器',
        testFn: async () => {
          const result = await api('/api/dashboard');
          const data = result as { success: boolean; data: { circuitBreakers: unknown } };
          return { passed: data.success && data.data?.circuitBreakers !== undefined, data: result };
        }
      },
      {
        id: 24,
        name: 'Dashboard验证-缓存',
        testFn: async () => {
          const result = await api('/api/dashboard');
          const data = result as { success: boolean; data: { cache: { size: number } } };
          return { passed: data.success && data.data?.cache !== undefined, data: result };
        }
      },
      {
        id: 25,
        name: 'Dashboard验证-指标',
        testFn: async () => {
          const result = await api('/api/dashboard');
          const data = result as { success: boolean; data: { metrics: unknown } };
          return { passed: data.success && data.data?.metrics !== undefined, data: result };
        }
      },
      {
        id: 26,
        name: 'Mock禁用测试',
        testFn: async () => {
          const result = await api('/api/mock', 'POST', { enabled: false });
          const data = result as { success: boolean; data: { enabled: boolean } };
          return { passed: data.success && data.data?.enabled === false, data: result };
        }
      },
      {
        id: 27,
        name: 'Mock重新启用',
        testFn: async () => {
          const result = await api('/api/mock', 'POST', { enabled: true });
          const data = result as { success: boolean; data: { enabled: boolean } };
          return { passed: data.success && data.data?.enabled === true, data: result };
        }
      },
      {
        id: 28,
        name: 'getUserMock删除',
        testFn: async () => {
          const result = await api('/api/tools/getUser/mock', 'DELETE');
          const data = result as { success: boolean; data: { success: boolean } };
          return { passed: data.success, data: result };
        }
      },
      {
        id: 29,
        name: 'getUserMock重新配置',
        testFn: async () => {
          const result = await api('/api/tools/getUser/mock', 'PUT', {
            enabled: true,
            response: { id: 'user-001', name: '重新配置的用户' }
          });
          const data = result as { success: boolean; data: { success: boolean } };
          return { passed: data.success, data: result };
        }
      },
      {
        id: 30,
        name: '健康检查-详细验证',
        testFn: async () => {
          const result = await api('/health');
          const data = result as { success: boolean; data: { checks: unknown } };
          return { passed: data.success && data.data?.checks !== undefined, data: result };
        }
      },
      {
        id: 31,
        name: '健康检查-熔断器状态',
        testFn: async () => {
          const result = await api('/health');
          const data = result as { success: boolean; data: { checks: { circuitBreakers: unknown } } };
          return { passed: data.success && data.data?.checks?.circuitBreakers !== undefined, data: result };
        }
      },
      {
        id: 32,
        name: '健康检查-缓存状态',
        testFn: async () => {
          const result = await api('/health');
          const data = result as { success: boolean; data: { checks: { cache: unknown } } };
          return { passed: data.success && data.data?.checks?.cache !== undefined, data: result };
        }
      },
      {
        id: 33,
        name: '健康检查-配置状态',
        testFn: async () => {
          const result = await api('/health');
          const data = result as { success: boolean; data: { checks: { config: unknown } } };
          return { passed: data.success && data.data?.checks?.config !== undefined, data: result };
        }
      },
      {
        id: 34,
        name: '响应时间验证',
        testFn: async () => {
          const result = await api('/health');
          const data = result as { success: boolean; duration: number };
          return { passed: data.success && data.duration < 1000, data: result };
        }
      },
      {
        id: 35,
        name: '并发请求测试',
        testFn: async () => {
          const results = await Promise.all([
            api('/health'),
            api('/api/tools'),
            api('/api/dashboard')
          ]);
          const allSuccess = results.every(r => (r as { success: boolean }).success);
          return { passed: allSuccess, data: results };
        }
      },

      // === Authentication Module (#36-45) ===
      {
        id: 36,
        name: '配置中的Token验证',
        testFn: async () => {
          const result = await api('/api/config');
          const data = result as { success: boolean; data: { tokens: unknown } };
          return { passed: data.success && data.data?.tokens !== undefined, data: result };
        }
      },
      {
        id: 37,
        name: '敏感信息脱敏验证',
        testFn: async () => {
          const result = await api('/api/config');
          const configStr = JSON.stringify(result);
          // Token值应该被脱敏为 [MASKED]
          const masked = configStr.includes('[MASKED]');
          return { passed: masked, data: result };
        }
      },
      {
        id: 38,
        name: '工具Token配置验证',
        testFn: async () => {
          const result = await api('/api/tools');
          const data = result as { success: boolean; data: { tools: Array<{ name: string }> } };
          return { passed: data.success && data.data?.tools?.length > 0, data: result };
        }
      },
      {
        id: 39,
        name: 'getUser工具详情',
        testFn: async () => {
          const result = await api('/api/tools/getUser/mock');
          const data = result as { success: boolean; data: { toolName: string } };
          return { passed: data.success, data: result };
        }
      },
      {
        id: 40,
        name: 'addAge工具详情',
        testFn: async () => {
          const result = await api('/api/tools/addAge/mock');
          const data = result as { success: boolean; data: { toolName: string } };
          return { passed: data.success, data: result };
        }
      },
      {
        id: 41,
        name: 'queryUser工具详情',
        testFn: async () => {
          const result = await api('/api/tools/queryUser/mock');
          const data = result as { success: boolean; data: { toolName: string } };
          return { passed: data.success, data: result };
        }
      },
      {
        id: 42,
        name: 'testHealthCheck工具详情',
        testFn: async () => {
          const result = await api('/api/tools/testHealthCheck/mock');
          const data = result as { success: boolean; data: { toolName: string } };
          return { passed: data.success, data: result };
        }
      },
      {
        id: 43,
        name: 'testDashboard工具详情',
        testFn: async () => {
          const result = await api('/api/tools/testDashboard/mock');
          const data = result as { success: boolean; data: { toolName: string } };
          return { passed: data.success, data: result };
        }
      },
      {
        id: 44,
        name: '工具方法验证',
        testFn: async () => {
          const result = await api('/api/tools');
          const tools = (result as { data: { tools: Array<{ method: string }> } }).data?.tools || [];
          const methods = tools.map(t => t.method);
          return { passed: methods.includes('GET') && methods.includes('POST'), data: result };
        }
      },
      {
        id: 45,
        name: '工具路径验证',
        testFn: async () => {
          const result = await api('/api/tools');
          const tools = (result as { data: { tools: Array<{ path: string }> } }).data?.tools || [];
          const hasPathParam = tools.some(t => t.path.includes('{'));
          return { passed: hasPathParam, data: result };
        }
      },

      // === Circuit Breaker Module (#46-55) ===
      {
        id: 46,
        name: '熔断器CLOSED状态',
        testFn: async () => {
          const result = await api('/api/dashboard');
          const cbs = (result as { data: { circuitBreakers: Record<string, { state: string }> } }).data?.circuitBreakers || {};
          const allClosed = Object.values(cbs).every(cb => cb.state === 'CLOSED');
          return { passed: allClosed, data: result };
        }
      },
      {
        id: 47,
        name: '熔断器失败计数',
        testFn: async () => {
          const result = await api('/api/dashboard');
          const cbs = (result as { data: { circuitBreakers: Record<string, { failures: number }> } }).data?.circuitBreakers || {};
          const hasFailures = Object.values(cbs).every(cb => cb.failures >= 0);
          return { passed: hasFailures, data: result };
        }
      },
      {
        id: 48,
        name: '熔断器成功计数',
        testFn: async () => {
          const result = await api('/api/dashboard');
          const cbs = (result as { data: { circuitBreakers: Record<string, { successes: number }> } }).data?.circuitBreakers || {};
          const hasSuccesses = Object.values(cbs).every(cb => cb.successes >= 0);
          return { passed: hasSuccesses, data: result };
        }
      },
      {
        id: 49,
        name: '熔断器工具数量',
        testFn: async () => {
          const result = await api('/api/dashboard');
          const cbs = (result as { data: { circuitBreakers: Record<string, unknown> } }).data?.circuitBreakers || {};
          return { passed: Object.keys(cbs).length >= 5, data: result };
        }
      },
      {
        id: 50,
        name: '熔断器getUser状态',
        testFn: async () => {
          const result = await api('/api/dashboard');
          const cbs = (result as { data: { circuitBreakers: Record<string, { state: string }> } }).data?.circuitBreakers || {};
          return { passed: cbs['getUser']?.state === 'CLOSED', data: result };
        }
      },
      {
        id: 51,
        name: '熔断器addAge状态',
        testFn: async () => {
          const result = await api('/api/dashboard');
          const cbs = (result as { data: { circuitBreakers: Record<string, { state: string }> } }).data?.circuitBreakers || {};
          return { passed: cbs['addAge']?.state === 'CLOSED', data: result };
        }
      },
      {
        id: 52,
        name: '熔断器queryUser状态',
        testFn: async () => {
          const result = await api('/api/dashboard');
          const cbs = (result as { data: { circuitBreakers: Record<string, { state: string }> } }).data?.circuitBreakers || {};
          return { passed: cbs['queryUser']?.state === 'CLOSED', data: result };
        }
      },
      {
        id: 53,
        name: '熔断器testHealthCheck状态',
        testFn: async () => {
          const result = await api('/api/dashboard');
          const cbs = (result as { data: { circuitBreakers: Record<string, { state: string }> } }).data?.circuitBreakers || {};
          return { passed: cbs['testHealthCheck']?.state === 'CLOSED', data: result };
        }
      },
      {
        id: 54,
        name: '熔断器testDashboard状态',
        testFn: async () => {
          const result = await api('/api/dashboard');
          const cbs = (result as { data: { circuitBreakers: Record<string, { state: string }> } }).data?.circuitBreakers || {};
          return { passed: cbs['testDashboard']?.state === 'CLOSED', data: result };
        }
      },
      {
        id: 55,
        name: '熔断器汇总检查',
        testFn: async () => {
          const result = await api('/health');
          const cbCheck = (result as { data: { checks: { circuitBreakers: { status: string } } } }).data?.checks?.circuitBreakers;
          return { passed: cbCheck?.status === 'ok', data: result };
        }
      },

      // === Cache Module (#56-65) ===
      {
        id: 56,
        name: '缓存容量验证',
        testFn: async () => {
          const result = await api('/api/dashboard');
          const cache = (result as { data: { cache: { maxSize: number } } }).data?.cache;
          return { passed: cache?.maxSize === 1000, data: result };
        }
      },
      {
        id: 57,
        name: '缓存TTL验证',
        testFn: async () => {
          const result = await api('/api/dashboard');
          const cache = (result as { data: { cache: { ttl: number } } }).data?.cache;
          return { passed: cache?.ttl === 60000, data: result };
        }
      },
      {
        id: 58,
        name: '缓存大小验证',
        testFn: async () => {
          const result = await api('/api/cache');
          const cache = (result as { data: { size: number } }).data;
          return { passed: cache?.size >= 0, data: result };
        }
      },
      {
        id: 59,
        name: '缓存清理验证',
        testFn: async () => {
          await api('/api/cache', 'DELETE');
          const result = await api('/api/cache');
          const cache = (result as { data: { size: number } }).data;
          return { passed: cache?.size === 0, data: result };
        }
      },
      {
        id: 60,
        name: '缓存API响应',
        testFn: async () => {
          const result = await api('/api/cache');
          return { passed: (result as { success: boolean }).success, data: result };
        }
      },
      {
        id: 61,
        name: '缓存统计更新',
        testFn: async () => {
          const result = await api('/api/dashboard');
          const cache = (result as { data: { cache: unknown } }).data?.cache;
          return { passed: cache !== undefined, data: result };
        }
      },
      {
        id: 62,
        name: '健康检查缓存状态',
        testFn: async () => {
          const result = await api('/health');
          const cacheCheck = (result as { data: { checks: { cache: { status: string } } } }).data?.checks?.cache;
          return { passed: cacheCheck?.status === 'ok', data: result };
        }
      },
      {
        id: 63,
        name: '缓存命中率计算',
        testFn: async () => {
          const result = await api('/api/dashboard');
          const cache = (result as { data: { cache: { size: number, maxSize: number } } }).data?.cache;
          const ratio = cache?.size / cache?.maxSize;
          return { passed: ratio >= 0 && ratio <= 1, data: result };
        }
      },
      {
        id: 64,
        name: '工具级缓存清理',
        testFn: async () => {
          const result = await api('/api/cache/getUser', 'DELETE');
          return { passed: (result as { success: boolean }).success, data: result };
        }
      },
      {
        id: 65,
        name: '多工具缓存清理',
        testFn: async () => {
          const results = await Promise.all([
            api('/api/cache/addAge', 'DELETE'),
            api('/api/cache/queryUser', 'DELETE')
          ]);
          return { passed: results.every(r => (r as { success: boolean }).success), data: results };
        }
      },

      // === Mock Module (#66-75) ===
      {
        id: 66,
        name: '全局Mock启用验证',
        testFn: async () => {
          const result = await api('/api/mock', 'POST', { enabled: true });
          return { passed: (result as { data: { enabled: boolean } }).data?.enabled === true, data: result };
        }
      },
      {
        id: 67,
        name: '全局Mock禁用验证',
        testFn: async () => {
          const result = await api('/api/mock', 'POST', { enabled: false });
          return { passed: (result as { data: { enabled: boolean } }).data?.enabled === false, data: result };
        }
      },
      {
        id: 68,
        name: '工具Mock配置',
        testFn: async () => {
          const result = await api('/api/tools/getUser/mock', 'PUT', {
            enabled: true,
            response: { test: 'mock-data' }
          });
          return { passed: (result as { success: boolean }).success, data: result };
        }
      },
      {
        id: 69,
        name: '工具Mock获取',
        testFn: async () => {
          const result = await api('/api/tools/getUser/mock');
          return { passed: (result as { success: boolean }).success, data: result };
        }
      },
      {
        id: 70,
        name: '工具Mock删除',
        testFn: async () => {
          const result = await api('/api/tools/getUser/mock', 'DELETE');
          return { passed: (result as { success: boolean }).success, data: result };
        }
      },
      {
        id: 71,
        name: '工具Mock延迟设置',
        testFn: async () => {
          const result = await api('/api/tools/getUser/mock', 'PUT', {
            enabled: true,
            delay: 100,
            response: { delayed: true }
          });
          return { passed: (result as { success: boolean }).success, data: result };
        }
      },
      {
        id: 72,
        name: '工具Mock状态码设置',
        testFn: async () => {
          const result = await api('/api/tools/getUser/mock', 'PUT', {
            enabled: true,
            statusCode: 200,
            response: { status: 'ok' }
          });
          return { passed: (result as { success: boolean }).success, data: result };
        }
      },
      {
        id: 73,
        name: '复杂响应Mock',
        testFn: async () => {
          const complexData = {
            users: [
              { id: 1, name: 'User1', details: { age: 25, city: 'Beijing' } },
              { id: 2, name: 'User2', details: { age: 30, city: 'Shanghai' } }
            ],
            meta: { total: 2, page: 1 }
          };
          const result = await api('/api/tools/getUser/mock', 'PUT', {
            enabled: true,
            response: complexData
          });
          return { passed: (result as { success: boolean }).success, data: result };
        }
      },
      {
        id: 74,
        name: 'Mock数据验证',
        testFn: async () => {
          const result = await api('/api/tools');
          const tools = (result as { data: { tools: Array<{ mockEnabled: boolean }> } }).data?.tools || [];
          const hasMockEnabled = tools.some(t => t.mockEnabled);
          return { passed: hasMockEnabled, data: result };
        }
      },
      {
        id: 75,
        name: 'Mock全局状态获取',
        testFn: async () => {
          const result = await api('/api/mock');
          return { passed: (result as { success: boolean }).success, data: result };
        }
      },

      // === Dashboard Module (#76-90) ===
      {
        id: 76,
        name: 'Dashboard总请求数',
        testFn: async () => {
          const result = await api('/api/dashboard');
          const metrics = (result as { data: { metrics: { aggregated: { totalRequests: number } } } }).data?.metrics?.aggregated;
          return { passed: metrics?.totalRequests >= 0, data: result };
        }
      },
      {
        id: 77,
        name: 'Dashboard成功率',
        testFn: async () => {
          const result = await api('/api/dashboard');
          const metrics = (result as { data: { metrics: { aggregated: { successRate: string } } } }).data?.metrics?.aggregated;
          return { passed: metrics?.successRate !== undefined, data: result };
        }
      },
      {
        id: 78,
        name: 'Dashboard错误数',
        testFn: async () => {
          const result = await api('/api/dashboard');
          const metrics = (result as { data: { metrics: { aggregated: { totalErrors: number } } } }).data?.metrics?.aggregated;
          return { passed: metrics?.totalErrors >= 0, data: result };
        }
      },
      {
        id: 79,
        name: 'Dashboard平均延迟',
        testFn: async () => {
          const result = await api('/api/dashboard');
          const metrics = (result as { data: { metrics: { aggregated: { avgDuration: number } } } }).data?.metrics?.aggregated;
          return { passed: metrics?.avgDuration >= 0, data: result };
        }
      },
      {
        id: 80,
        name: 'Dashboard工具指标',
        testFn: async () => {
          const result = await api('/api/dashboard');
          const toolsMetrics = (result as { data: { metrics: { tools: Record<string, unknown> } } }).data?.metrics?.tools;
          return { passed: toolsMetrics !== undefined && Object.keys(toolsMetrics).length >= 5, data: result };
        }
      },
      {
        id: 81,
        name: 'Dashboard日志展示',
        testFn: async () => {
          const result = await api('/api/dashboard');
          const logs = (result as { data: { logs: unknown[] } }).data?.logs;
          return { passed: Array.isArray(logs), data: result };
        }
      },
      {
        id: 82,
        name: 'Dashboard熔断器展示',
        testFn: async () => {
          const result = await api('/api/dashboard');
          const cbs = (result as { data: { circuitBreakers: Record<string, unknown> } }).data?.circuitBreakers;
          return { passed: Object.keys(cbs).length >= 5, data: result };
        }
      },
      {
        id: 83,
        name: 'Dashboard缓存展示',
        testFn: async () => {
          const result = await api('/api/dashboard');
          const cache = (result as { data: { cache: unknown } }).data?.cache;
          return { passed: cache !== undefined, data: result };
        }
      },
      {
        id: 84,
        name: 'DashboardHTML页面',
        testFn: async () => {
          const response = await fetch(`${BASE_URL}/dashboard`);
          const html = await response.text();
          return { passed: html.includes('MCP Gateway Dashboard'), data: { htmlLength: html.length } };
        }
      },
      {
        id: 85,
        name: 'Dashboard数据刷新',
        testFn: async () => {
          // 多次请求验证数据刷新
          const r1 = await api('/api/dashboard');
          const r2 = await api('/api/dashboard');
          return { passed: (r1 as { success: boolean }).success && (r2 as { success: boolean }).success, data: { r1, r2 } };
        }
      },
      {
        id: 86,
        name: 'Dashboard响应式-数据',
        testFn: async () => {
          const result = await api('/api/dashboard');
          return { passed: (result as { success: boolean }).success, data: result };
        }
      },
      {
        id: 87,
        name: 'DashboardAPI-日志',
        testFn: async () => {
          const result = await api('/api/logs');
          return { passed: (result as { success: boolean }).success, data: result };
        }
      },
      {
        id: 88,
        name: 'DashboardAPI-错误',
        testFn: async () => {
          const result = await api('/api/errors');
          return { passed: (result as { success: boolean }).success, data: result };
        }
      },
      {
        id: 89,
        name: 'DashboardAPI-统计',
        testFn: async () => {
          const result = await api('/api/stats');
          return { passed: (result as { success: boolean }).success, data: result };
        }
      },
      {
        id: 90,
        name: 'Dashboard完整功能验证',
        testFn: async () => {
          const results = await Promise.all([
            api('/api/dashboard'),
            api('/api/tools'),
            api('/api/cache'),
            api('/health')
          ]);
          return { passed: results.every(r => (r as { success: boolean }).success), data: results };
        }
      },

      // === Database Module (#91-100) ===
      {
        id: 91,
        name: '数据库连接验证',
        testFn: async () => {
          const result = await api('/api/database/stats');
          return { passed: (result as { success: boolean }).success, data: result };
        }
      },
      {
        id: 92,
        name: '请求日志写入验证',
        testFn: async () => {
          const result = await api('/api/logs');
          return { passed: (result as { success: boolean }).success, data: result };
        }
      },
      {
        id: 93,
        name: '错误日志查询',
        testFn: async () => {
          const result = await api('/api/errors');
          return { passed: (result as { success: boolean }).success, data: result };
        }
      },
      {
        id: 94,
        name: '审计日志查询',
        testFn: async () => {
          const result = await api('/api/audit?date=' + new Date().toISOString().split('T')[0]);
          return { passed: (result as { success: boolean }).success, data: result };
        }
      },
      {
        id: 95,
        name: '告警日志查询',
        testFn: async () => {
          const result = await api('/api/alerts');
          return { passed: (result as { success: boolean }).success, data: result };
        }
      },
      {
        id: 96,
        name: '每日统计查询',
        testFn: async () => {
          const result = await api('/api/stats');
          return { passed: (result as { success: boolean }).success, data: result };
        }
      },
      {
        id: 97,
        name: '日志分页查询',
        testFn: async () => {
          const result = await api('/api/logs?limit=10');
          return { passed: (result as { success: boolean }).success, data: result };
        }
      },
      {
        id: 98,
        name: '错误日志日期筛选',
        testFn: async () => {
          const result = await api('/api/errors?date=' + new Date().toISOString().split('T')[0]);
          return { passed: (result as { success: boolean }).success, data: result };
        }
      },
      {
        id: 99,
        name: '告警汇总查询',
        testFn: async () => {
          const result = await api('/api/alerts');
          return { passed: (result as { success: boolean }).success, data: result };
        }
      },
      {
        id: 100,
        name: '数据库统计详情',
        testFn: async () => {
          const result = await api('/api/database/stats');
          const data = (result as { data: unknown }).data;
          return { passed: data !== undefined, data: result };
        }
      },

      // === Config Module (#101-110) ===
      {
        id: 101,
        name: '配置文件加载',
        testFn: async () => {
          const result = await api('/api/config');
          return { passed: (result as { success: boolean }).success, data: result };
        }
      },
      {
        id: 102,
        name: '配置验证API',
        testFn: async () => {
          const result = await api('/api/config/validate', 'POST', {
            baseUrl: 'http://test.com',
            tools: { testTool: { description: 'Test', method: 'GET', path: '/test' } }
          });
          return { passed: (result as { data: { valid: boolean } }).data?.valid === true, data: result };
        }
      },
      {
        id: 103,
        name: '配置工具列表验证',
        testFn: async () => {
          const result = await api('/api/config');
          const tools = (result as { data: { tools: Record<string, unknown> } }).data?.tools;
          return { passed: Object.keys(tools).length >= 5, data: result };
        }
      },
      {
        id: 104,
        name: '配置备份列表',
        testFn: async () => {
          const result = await api('/api/config/backups');
          return { passed: (result as { success: boolean }).success, data: result };
        }
      },
      {
        id: 105,
        name: '配置工具详情',
        testFn: async () => {
          const result = await api('/api/config');
          const getUser = (result as { data: { tools: { getUser: unknown } } }).data?.tools?.getUser;
          return { passed: getUser !== undefined, data: result };
        }
      },
      {
        id: 106,
        name: '配置Token详情',
        testFn: async () => {
          const result = await api('/api/config');
          const tokens = (result as { data: { tokens: Record<string, unknown> } }).data?.tokens;
          return { passed: Object.keys(tokens).length >= 3, data: result };
        }
      },
      {
        id: 107,
        name: '配置baseUrl验证',
        testFn: async () => {
          const result = await api('/api/config');
          const baseUrl = (result as { data: { baseUrl: string } }).data?.baseUrl;
          return { passed: baseUrl !== undefined, data: result };
        }
      },
      {
        id: 108,
        name: '配置熔断器验证',
        testFn: async () => {
          const result = await api('/api/config');
          const cb = (result as { data: { circuitBreaker: unknown } }).data?.circuitBreaker;
          return { passed: cb !== undefined, data: result };
        }
      },
      {
        id: 109,
        name: '配置缓存验证',
        testFn: async () => {
          const result = await api('/api/config');
          const cache = (result as { data: { cache: unknown } }).data?.cache;
          return { passed: cache !== undefined, data: result };
        }
      },
      {
        id: 110,
        name: '配置Mock验证',
        testFn: async () => {
          const result = await api('/api/config');
          const mock = (result as { data: { mock: unknown } }).data?.mock;
          return { passed: mock !== undefined, data: result };
        }
      },

      // === Integration Test Module (#111-120) ===
      {
        id: 111,
        name: '完整流程-健康检查',
        testFn: async () => {
          const result = await api('/health');
          return { passed: (result as { data: { status: string } }).data?.status === 'healthy', data: result };
        }
      },
      {
        id: 112,
        name: '完整流程-Dashboard',
        testFn: async () => {
          const result = await api('/api/dashboard');
          return { passed: (result as { success: boolean }).success, data: result };
        }
      },
      {
        id: 113,
        name: '完整流程-工具列表',
        testFn: async () => {
          const result = await api('/api/tools');
          return { passed: (result as { success: boolean }).success, data: result };
        }
      },
      {
        id: 114,
        name: '完整流程-Mock控制',
        testFn: async () => {
          const enableResult = await api('/api/mock', 'POST', { enabled: true });
          const disableResult = await api('/api/mock', 'POST', { enabled: false });
          return {
            passed: (enableResult as { success: boolean }).success && (disableResult as { success: boolean }).success,
            data: { enableResult, disableResult }
          };
        }
      },
      {
        id: 115,
        name: '完整流程-缓存操作',
        testFn: async () => {
          const clearResult = await api('/api/cache', 'DELETE');
          const statusResult = await api('/api/cache');
          return {
            passed: (clearResult as { success: boolean }).success && (statusResult as { success: boolean }).success,
            data: { clearResult, statusResult }
          };
        }
      },
      {
        id: 116,
        name: '完整流程-配置操作',
        testFn: async () => {
          const configResult = await api('/api/config');
          const validateResult = await api('/api/config/validate', 'POST', { baseUrl: 'http://test.com', tools: {} });
          return {
            passed: (configResult as { success: boolean }).success && (validateResult as { success: boolean }).success,
            data: { configResult, validateResult }
          };
        }
      },
      {
        id: 117,
        name: '完整流程-日志查询',
        testFn: async () => {
          const logsResult = await api('/api/logs');
          const errorsResult = await api('/api/errors');
          return {
            passed: (logsResult as { success: boolean }).success && (errorsResult as { success: boolean }).success,
            data: { logsResult, errorsResult }
          };
        }
      },
      {
        id: 118,
        name: '完整流程-统计查询',
        testFn: async () => {
          const statsResult = await api('/api/stats');
          const dbStatsResult = await api('/api/database/stats');
          return {
            passed: (statsResult as { success: boolean }).success && (dbStatsResult as { success: boolean }).success,
            data: { statsResult, dbStatsResult }
          };
        }
      },
      {
        id: 119,
        name: '并发集成测试',
        testFn: async () => {
          const results = await Promise.all([
            api('/health'),
            api('/api/tools'),
            api('/api/dashboard'),
            api('/api/cache'),
            api('/api/logs'),
            api('/api/mock')
          ]);
          return { passed: results.every(r => (r as { success: boolean }).success), data: results };
        }
      },
      {
        id: 120,
        name: '端到端完整验证',
        testFn: async () => {
          // 全流程测试
          const steps = [
            await api('/health'),
            await api('/api/mock', 'POST', { enabled: true }),
            await api('/api/tools'),
            await api('/api/dashboard'),
            await api('/api/logs'),
            await api('/api/stats'),
            await api('/api/cache', 'DELETE'),
            await api('/health')
          ];
          return { passed: steps.every(s => (s as { success: boolean }).success), data: steps };
        }
      }
    ];

    // Run tests
    for (const storyline of storylines) {
      const result = await this.testStoryline(storyline);
      this.results.push(result);
    }

    return this.results;
  }

  /**
   * Print test report
   *
   * @author lvdaxianerplus
   * @date 2026-04-19
   */
  printReport(): void {
    console.log('\n========================================');
    console.log('MCP HTTP Gateway 故事线测试报告');
    console.log('========================================\n');

    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;

    console.log(`总计: ${this.results.length} 条故事线`);
    console.log(`通过: ${passed} 条`);
    console.log(`失败: ${failed} 条`);
    console.log(`通过率: ${((passed / this.results.length) * 100).toFixed(1)}%\n`);

    // Print passed tests
    console.log('✅ 通过的故事线:');
    this.results.filter(r => r.passed).forEach(r => {
      console.log(`  ✅ #${r.storylineId} ${r.storylineName} (${r.duration}ms)`);
    });

    if (failed > 0) {
      console.log('\n❌ 失败的故事线:');
      this.results.filter(r => !r.passed).forEach(r => {
        console.log(`  ❌ #${r.storylineId} ${r.storylineName}: ${r.error}`);
      });
    }

    console.log('\n========================================');
  }
}

/**
 * Main test function
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
async function main(): Promise<void> {
  const runner = new HttpApiTestRunner();

  try {
    await runner.runAllTests();
    runner.printReport();
  } catch (error) {
    console.error('[测试错误]', error);
  }
}

main();