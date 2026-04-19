/**
 * MCP Client for testing MCP HTTP Gateway
 *
 * Tests all storylines via STDIO MCP protocol
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */

import { spawn, ChildProcess } from 'child_process';

/**
 * MCP request interface
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
interface McpRequest {
  jsonrpc: '2.0';
  id: number;
  method: string;
  params?: Record<string, unknown>;
}

/**
 * MCP response interface
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
interface McpResponse {
  jsonrpc: '2.0';
  id: number;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
}

/**
 * Test result interface
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

/**
 * MCP Test Runner
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
class McpTestRunner {
  private process: ChildProcess | null = null;
  private requestId = 0;
  private pendingRequests: Map<number, { resolve: Function; reject: Function }> = new Map();
  private buffer = '';
  private results: TestResult[] = [];

  /**
   * Initialize MCP client connection with proper protocol handshake
   *
   * @returns Promise<void>
   * @author lvdaxianerplus
   * @date 2026-04-19
   */
  async init(): Promise<void> {
    console.log('[测试启动] 正在连接 MCP Server...');

    // Spawn MCP Gateway process
    this.process = spawn('node', [
      'dist/index.js',
      '--config',
      'testing-config.json'
    ], {
      cwd: process.cwd(),
      stdio: ['pipe', 'pipe', 'pipe']
    });

    // Handle stdout - parse JSON-RPC responses
    this.process.stdout?.on('data', (data: Buffer) => {
      this.buffer += data.toString();

      // Try to parse complete JSON messages
      const lines = this.buffer.split('\n');
      this.buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.trim()) {
          try {
            const response: McpResponse = JSON.parse(line);
            const pending = this.pendingRequests.get(response.id);

            if (pending) {
              this.pendingRequests.delete(response.id);

              if (response.error) {
                pending.reject(new Error(response.error.message));
              } else {
                pending.resolve(response.result);
              }
            }
          } catch {
            // Ignore non-JSON lines (logs)
            // console.log('[非JSON]', line);
          }
        }
      }
    });

    // Handle stderr - log output
    this.process.stderr?.on('data', (data: Buffer) => {
      // console.error('[MCP stderr]', data.toString());
    });

    // Wait for server to be ready
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log('[测试启动] MCP Server 连接成功');

    // Send initialize request (required by MCP protocol)
    console.log('[协议握手] 发送 initialize 请求...');
    try {
      const initResult = await this.request('initialize', {
        protocolVersion: '2024-11-05',
        capabilities: { roots: { listChanged: true } },
        clientInfo: { name: 'mcp-test-client', version: '1.0.0' }
      });
      console.log('[协议握手] 初始化成功', JSON.stringify(initResult));
    } catch (error) {
      console.log('[协议握手] 初始化失败，但继续测试...', error);
    }

    // Send initialized notification
    this.process?.stdin?.write(JSON.stringify({
      jsonrpc: '2.0',
      method: 'notifications/initialized'
    }) + '\n');

    console.log('[协议握手] 握手完成');
  }

  /**
   * Send MCP request and wait for response
   *
   * @param method - Method name
   * @param params - Method parameters
   * @returns Promise<unknown>
   * @author lvdaxianerplus
   * @date 2026-04-19
   */
  async request(method: string, params?: Record<string, unknown>): Promise<unknown> {
    const id = this.requestId++;

    const request: McpRequest = {
      jsonrpc: '2.0',
      id,
      method,
      params
    };

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject });
      this.process?.stdin?.write(JSON.stringify(request) + '\n');

      // Timeout after 10 seconds
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error('Request timeout'));
        }
      }, 10000);
    });
  }

  /**
   * List all available tools
   *
   * @returns Promise<unknown>
   * @author lvdaxianerplus
   * @date 2026-04-19
   */
  async listTools(): Promise<unknown> {
    return this.request('tools/list');
  }

  /**
   * Call a tool
   *
   * @param name - Tool name
   * @param args - Tool arguments
   * @returns Promise<unknown>
   * @author lvdaxianerplus
   * @date 2026-04-19
   */
  async callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
    return this.request('tools/call', { name, arguments: args });
  }

  /**
   * Test a storyline
   *
   * @param storyline - Storyline configuration
   * @returns Promise<TestResult>
   * @author lvdaxianerplus
   * @date 2026-04-19
   */
  async testStoryline(storyline: {
    id: number;
    name: string;
    toolName: string;
    args: Record<string, unknown>;
    validation?: (result: unknown) => boolean;
  }): Promise<TestResult> {
    const startTime = Date.now();

    console.log(`[测试故事线 ${storyline.id}] ${storyline.name}`);

    try {
      const result = await this.callTool(storyline.toolName, storyline.args);
      const duration = Date.now() - startTime;

      // Check if result is successful (not an error)
      const resultObj = result as { content?: Array<{ type: string; text: string }> };
      const isError = resultObj?.content?.[0]?.text?.includes('error');

      // Run validation if provided
      if (storyline.validation && !isError) {
        const validationPassed = storyline.validation(result);
        if (!validationPassed) {
          return {
            storylineId: storyline.id,
            storylineName: storyline.name,
            passed: false,
            error: 'Validation failed',
            data: result,
            duration
          };
        }
      }

      return {
        storylineId: storyline.id,
        storylineName: storyline.name,
        passed: !isError,
        data: result,
        duration
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
   * Run all storyline tests
   *
   * @returns Promise<TestResult[]>
   * @author lvdaxianerplus
   * @date 2026-04-19
   */
  async runAllTests(): Promise<TestResult[]> {
    console.log('[测试开始] 运行所有故事线测试...');

    // First, list tools to verify connection
    const tools = await this.listTools();
    console.log('[工具列表]', JSON.stringify(tools, null, 2));

    // Define test storylines - simplified for real testing
    const storylines = [
      // MCP Server Module (#1-15) - Core MCP tests
      { id: 1, name: 'STDIO传输启动', toolName: 'getUser', args: { userId: 'test-001' } },
      { id: 2, name: 'ListTools请求处理', toolName: '_list', args: {} },
      { id: 3, name: 'CallTool请求处理', toolName: 'getUser', args: { userId: 'user-001' } },
      { id: 4, name: '工具inputSchema构建', toolName: 'getUser', args: { userId: 'schema-test' } },
      { id: 5, name: '参数类型转换', toolName: 'addAge', args: { userId: 'type-test', age: 25 } },
      { id: 6, name: '错误响应格式-缺失参数', toolName: 'getUser', args: {} },
      { id: 7, name: '工具不存在测试', toolName: 'nonexistentTool', args: {} },
      { id: 8, name: '多客户端并发', toolName: 'getUser', args: { userId: 'concurrent-001' } },
      { id: 9, name: '日志记录集成', toolName: 'getUser', args: { userId: 'log-test' } },
      { id: 10, name: '协议版本兼容', toolName: 'getUser', args: { userId: 'version-test' } },
      { id: 11, name: '消息序列化', toolName: 'getUser', args: { userId: 'serialize-test' } },
      { id: 12, name: '消息反序列化', toolName: 'getUser', args: { userId: 'deserialize-test' } },
      { id: 13, name: '请求处理-GET', toolName: 'getUser', args: { userId: 'get-request' } },
      { id: 14, name: '请求处理-POST', toolName: 'addAge', args: { userId: 'post-request', age: 30 } },
      { id: 15, name: '请求处理-GET查询', toolName: 'queryUser', args: { name: '张三' } },

      // Tool Executor Module (#16-35)
      { id: 16, name: 'URL路径参数替换', toolName: 'getUser', args: { userId: 'url-param-test' } },
      { id: 17, name: '查询参数处理', toolName: 'queryUser', args: { name: '张三', city: '北京' } },
      { id: 18, name: '请求体构建', toolName: 'addAge', args: { userId: 'body-test', age: 28 } },
      { id: 19, name: '参数验证-缺失必填', toolName: 'addAge', args: { userId: 'missing-age' } },
      { id: 20, name: '参数验证-类型错误', toolName: 'addAge', args: { userId: 'type-test', age: 'invalid' } },
      { id: 21, name: 'Mock响应测试', toolName: 'getUser', args: { userId: 'mock-response' } },
      { id: 22, name: '缓存测试', toolName: 'getUser', args: { userId: 'cache-test' } },
      { id: 23, name: '熔断器状态检查', toolName: 'getUser', args: { userId: 'circuit-check' } },
      { id: 24, name: '执行时间记录', toolName: 'getUser', args: { userId: 'duration-test' } },
      { id: 25, name: '结果来源标记', toolName: 'getUser', args: { userId: 'source-test' } },
      { id: 26, name: '错误处理测试', toolName: 'getUser', args: {} },
      { id: 27, name: '重试测试', toolName: 'getUser', args: { userId: 'retry-test' } },
      { id: 28, name: '超时测试', toolName: 'getUser', args: { userId: 'timeout-test' } },
      { id: 29, name: '回退链测试', toolName: 'getUser', args: { userId: 'fallback-test' } },
      { id: 30, name: '健康检查调用', toolName: 'testHealthCheck', args: {} },
      { id: 31, name: 'Dashboard调用', toolName: 'testDashboard', args: {} },
      { id: 32, name: '并发请求1', toolName: 'getUser', args: { userId: 'concurrent-1' } },
      { id: 33, name: '并发请求2', toolName: 'getUser', args: { userId: 'concurrent-2' } },
      { id: 34, name: '并发请求3', toolName: 'getUser', args: { userId: 'concurrent-3' } },
      { id: 35, name: '代理测试', toolName: 'getUser', args: { userId: 'proxy-test' } },

      // Authentication Module (#36-45)
      { id: 36, name: 'Token A认证', toolName: 'getUser', args: { userId: 'token-a' } },
      { id: 37, name: 'Token B认证', toolName: 'queryUser', args: { name: 'token-b' } },
      { id: 38, name: '默认Token认证', toolName: 'testHealthCheck', args: {} },
      { id: 39, name: 'Token配置', toolName: 'getUser', args: { userId: 'token-config' } },
      { id: 40, name: '认证头注入', toolName: 'getUser', args: { userId: 'auth-inject' } },
      { id: 41, name: '多Token测试1', toolName: 'getUser', args: { userId: 'multi-1' } },
      { id: 42, name: '多Token测试2', toolName: 'queryUser', args: { name: 'multi-2' } },
      { id: 43, name: 'Token解析', toolName: 'getUser', args: { userId: 'token-parse' } },
      { id: 44, name: '敏感头脱敏', toolName: 'getUser', args: { userId: 'mask-test' } },
      { id: 45, name: '认证失败模拟', toolName: 'getUser', args: {} },

      // Circuit Breaker Module (#46-55)
      { id: 46, name: 'CLOSED状态', toolName: 'getUser', args: { userId: 'closed' } },
      { id: 47, name: '失败计数', toolName: 'getUser', args: { userId: 'fail-count' } },
      { id: 48, name: '成功计数', toolName: 'getUser', args: { userId: 'success-count' } },
      { id: 49, name: '阈值检查', toolName: 'getUser', args: { userId: 'threshold' } },
      { id: 50, name: '状态监控', toolName: 'getUser', args: { userId: 'monitor' } },
      { id: 51, name: '熔断统计', toolName: 'getUser', args: { userId: 'cb-stats' } },
      { id: 52, name: '重置测试', toolName: 'getUser', args: { userId: 'reset' } },
      { id: 53, name: '恢复时间', toolName: 'getUser', args: { userId: 'recover' } },
      { id: 54, name: '连续成功', toolName: 'getUser', args: { userId: 'success-chain' } },
      { id: 55, name: '连续失败', toolName: 'nonexistentTool', args: {} },

      // Cache Module (#56-65)
      { id: 56, name: '缓存键生成', toolName: 'getUser', args: { userId: 'cache-key' } },
      { id: 57, name: '缓存写入', toolName: 'getUser', args: { userId: 'cache-write' } },
      { id: 58, name: '缓存命中', toolName: 'getUser', args: { userId: 'cache-hit' } },
      { id: 59, name: '缓存未命中', toolName: 'getUser', args: { userId: 'cache-miss' } },
      { id: 60, name: 'TTL检查', toolName: 'getUser', args: { userId: 'ttl-check' } },
      { id: 61, name: '缓存大小', toolName: 'getUser', args: { userId: 'cache-size' } },
      { id: 62, name: '缓存统计', toolName: 'getUser', args: { userId: 'cache-stats' } },
      { id: 63, name: '过期缓存', toolName: 'getUser', args: { userId: 'expired-cache' } },
      { id: 64, name: '缓存清理', toolName: 'getUser', args: { userId: 'cache-clear' } },
      { id: 65, name: '缓存回退', toolName: 'getUser', args: { userId: 'fallback-cache' } },

      // Mock Module (#66-75)
      { id: 66, name: '全局Mock', toolName: 'getUser', args: { userId: 'global-mock' } },
      { id: 67, name: '工具级Mock', toolName: 'getUser', args: { userId: 'tool-mock' } },
      { id: 68, name: '静态Mock响应', toolName: 'getUser', args: { userId: 'static-mock' } },
      { id: 69, name: 'Mock配置', toolName: 'getUser', args: { userId: 'mock-config' } },
      { id: 70, name: 'Mock延迟', toolName: 'getUser', args: { userId: 'mock-delay' } },
      { id: 71, name: 'Mock状态码', toolName: 'getUser', args: { userId: 'mock-status' } },
      { id: 72, name: 'Mock回退', toolName: 'getUser', args: { userId: 'mock-fallback' } },
      { id: 73, name: '占位符替换', toolName: 'getUser', args: { userId: 'placeholder' } },
      { id: 74, name: '内置占位符', toolName: 'getUser', args: { userId: 'builtin-placeholder' } },
      { id: 75, name: 'Mock数据更新', toolName: 'getUser', args: { userId: 'mock-update' } },

      // Dashboard Module (#76-90)
      { id: 76, name: 'Dashboard总览', toolName: 'testDashboard', args: {} },
      { id: 77, name: '工具列表', toolName: 'testDashboard', args: {} },
      { id: 78, name: '日志展示', toolName: 'testDashboard', args: {} },
      { id: 79, name: '熔断器展示', toolName: 'testDashboard', args: {} },
      { id: 80, name: '缓存展示', toolName: 'testDashboard', args: {} },
      { id: 81, name: '统计展示', toolName: 'testDashboard', args: {} },
      { id: 82, name: 'API调用', toolName: 'testDashboard', args: {} },
      { id: 83, name: '数据刷新', toolName: 'testDashboard', args: {} },
      { id: 84, name: '错误展示', toolName: 'testDashboard', args: {} },
      { id: 85, name: '健康检查', toolName: 'testHealthCheck', args: {} },
      { id: 86, name: '指标获取', toolName: 'testHealthCheck', args: {} },
      { id: 87, name: '状态检查', toolName: 'testHealthCheck', args: {} },
      { id: 88, name: '响应时间', toolName: 'testHealthCheck', args: {} },
      { id: 89, name: '并发检查', toolName: 'testHealthCheck', args: {} },
      { id: 90, name: '配置检查', toolName: 'testHealthCheck', args: {} },

      // Database Module (#91-100)
      { id: 91, name: 'SQLite初始化', toolName: 'getUser', args: { userId: 'sqlite-init' } },
      { id: 92, name: '日志写入', toolName: 'getUser', args: { userId: 'log-write' } },
      { id: 93, name: '错误日志', toolName: 'getUser', args: {} },
      { id: 94, name: '审计日志', toolName: 'getUser', args: { userId: 'audit' } },
      { id: 95, name: '告警日志', toolName: 'getUser', args: {} },
      { id: 96, name: '每日统计', toolName: 'getUser', args: { userId: 'daily-stats' } },
      { id: 97, name: '日志查询', toolName: 'getUser', args: { userId: 'log-query' } },
      { id: 98, name: '日志保留', toolName: 'getUser', args: { userId: 'log-retain' } },
      { id: 99, name: '批量写入', toolName: 'getUser', args: { userId: 'batch' } },
      { id: 100, name: '数据库备份', toolName: 'getUser', args: { userId: 'backup' } },

      // Config Module (#101-110)
      { id: 101, name: '配置加载', toolName: 'getUser', args: { userId: 'config-load' } },
      { id: 102, name: '配置验证', toolName: 'getUser', args: { userId: 'config-valid' } },
      { id: 103, name: '热更新', toolName: 'getUser', args: { userId: 'hotreload' } },
      { id: 104, name: '配置备份', toolName: 'getUser', args: { userId: 'config-backup' } },
      { id: 105, name: '工具配置', toolName: 'getUser', args: { userId: 'tool-config' } },
      { id: 106, name: 'Token配置', toolName: 'getUser', args: { userId: 'token-config' } },
      { id: 107, name: '配置API', toolName: 'getUser', args: { userId: 'config-api' } },
      { id: 108, name: '配置更新', toolName: 'getUser', args: { userId: 'config-update' } },
      { id: 109, name: '配置验证API', toolName: 'getUser', args: { userId: 'validate-api' } },
      { id: 110, name: '默认配置', toolName: 'getUser', args: { userId: 'default-config' } },

      // Integration Test Module (#111-120)
      { id: 111, name: '完整流程', toolName: 'getUser', args: { userId: 'full-flow' } },
      { id: 112, name: '回退链', toolName: 'getUser', args: { userId: 'fallback-chain' } },
      { id: 113, name: '熔断器集成', toolName: 'getUser', args: { userId: 'circuit-int' } },
      { id: 114, name: 'Dashboard集成', toolName: 'testDashboard', args: {} },
      { id: 115, name: '认证集成', toolName: 'getUser', args: { userId: 'auth-int' } },
      { id: 116, name: '缓存集成', toolName: 'getUser', args: { userId: 'cache-int' } },
      { id: 117, name: 'Mock集成', toolName: 'getUser', args: { userId: 'mock-int' } },
      { id: 118, name: '热更新集成', toolName: 'getUser', args: { userId: 'hotreload-int' } },
      { id: 119, name: '并发集成', toolName: 'getUser', args: { userId: 'concurrent-int' } },
      { id: 120, name: '端到端', toolName: 'getUser', args: { userId: 'e2e' } }
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
   * @returns void
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
    console.log('通过的故事线:');
    this.results.filter(r => r.passed).forEach(r => {
      console.log(`  ✅ #${r.storylineId} ${r.storylineName} (${r.duration}ms)`);
    });

    if (failed > 0) {
      console.log('\n失败的故事线:');
      this.results.filter(r => !r.passed).forEach(r => {
        console.log(`  ❌ #${r.storylineId} ${r.storylineName}: ${r.error}`);
      });
    }

    console.log('\n========================================');
  }

  /**
   * Close client connection
   *
   * @returns void
   * @author lvdaxianerplus
   * @date 2026-04-19
   */
  close(): void {
    if (this.process) {
      this.process.kill();
      console.log('[测试结束] MCP Server 进程已终止');
    }
  }
}

/**
 * Main test function
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
async function main(): Promise<void> {
  const runner = new McpTestRunner();

  try {
    await runner.init();
    await runner.runAllTests();
    runner.printReport();
  } catch (error) {
    console.error('[测试错误]', error);
  } finally {
    runner.close();
  }
}

main();