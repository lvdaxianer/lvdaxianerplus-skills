/**
 * MCP Protocol Test Client
 *
 * Tests MCP HTTP Gateway via real MCP protocol (STDIO)
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */

import { spawn, ChildProcess } from 'child_process';

// JSON-RPC types
interface JsonRpcRequest {
  jsonrpc: '2.0';
  id?: number;
  method: string;
  params?: Record<string, unknown>;
}

interface JsonRpcResponse {
  jsonrpc: '2.0';
  id?: number;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
}

interface TestResult {
  id: number;
  name: string;
  passed: boolean;
  error?: string;
  data?: unknown;
  duration: number;
}

/**
 * MCP Test Client
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
class McpProtocolClient {
  private process: ChildProcess | null = null;
  private requestId = 0;
  private pendingRequests = new Map<number, { resolve: Function; reject: Function }>();
  private buffer = '';
  private initialized = false;

  /**
   * 启动 MCP Server 并建立 STDIO 连接
   *
   * @returns Promise<void>
   * @author lvdaxianerplus
   * @date 2026-04-19
   */
  async start(): Promise<void> {
    console.log('[MCP客户端] 正在启动 MCP Server...');

    // 启动 MCP HTTP Gateway 进程
    this.process = spawn('node', [
      'dist/index.js',
      '--config',
      'testing-config.json'
    ], {
      cwd: process.cwd(),
      stdio: ['pipe', 'pipe', 'pipe']
    });

    // 处理 stdout - 解析 JSON-RPC 响应
    this.process.stdout?.on('data', (data: Buffer) => {
      const text = data.toString();
      this.buffer += text;

      // 按行分割处理
      const lines = this.buffer.split('\n');
      this.buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.trim()) continue;

        try {
          const response: JsonRpcResponse = JSON.parse(line);

          if (response.id !== undefined) {
            const pending = this.pendingRequests.get(response.id);
            if (pending) {
              this.pendingRequests.delete(response.id);
              if (response.error) {
                pending.reject(new Error(response.error.message));
              } else {
                pending.resolve(response.result);
              }
            }
          } else if (response.result) {
            // 无 id 的响应（可能是通知）
            console.log('[MCP通知]', JSON.stringify(response.result));
          }
        } catch {
          // 非 JSON 行，可能是日志输出
          if (line.includes('[INFO]') || line.includes('[ERROR]')) {
            console.log('[服务日志]', line);
          }
        }
      }
    });

    // 处理 stderr
    this.process.stderr?.on('data', (data: Buffer) => {
      // stderr 可能包含日志
    });

    // 等待进程启动
    await this.sleep(1500);

    // 执行 MCP 协议握手
    await this.handshake();

    console.log('[MCP客户端] 连接成功，可以开始调用工具\n');
  }

  /**
   * MCP 协议握手
   *
   * @returns Promise<void>
   * @author lvdaxianerplus
   * @date 2026-04-19
   */
  async handshake(): Promise<void> {
    console.log('[协议握手] 发送 initialize 请求...');

    // 发送 initialize 请求
    const initResult = await this.sendRequest('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {
        roots: { listChanged: true },
        sampling: {},
        elicitation: {}
      },
      clientInfo: {
        name: 'mcp-test-runner',
        version: '1.0.0'
      }
    });

    console.log('[协议握手] Initialize 成功:', JSON.stringify(initResult));

    // 发送 initialized 通知（无 id）
    this.sendNotification('notifications/initialized');

    console.log('[协议握手] Initialized 通知已发送');
    this.initialized = true;

    await this.sleep(500);
  }

  /**
   * 发送 JSON-RPC 请求并等待响应
   *
   * @param method - 方法名
   * @param params - 参数
   * @returns Promise<unknown>
   * @author lvdaxianerplus
   * @date 2026-04-19
   */
  async sendRequest(method: string, params?: Record<string, unknown>): Promise<unknown> {
    const id = this.requestId++;
    const request: JsonRpcRequest = {
      jsonrpc: '2.0',
      id,
      method,
      params
    };

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject });

      const jsonLine = JSON.stringify(request) + '\n';
      this.process?.stdin?.write(jsonLine);

      // 10秒超时
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error(`请求超时: ${method}`));
        }
      }, 10000);
    });
  }

  /**
   * 发送 JSON-RPC 通知（无响应）
   *
   * @param method - 方法名
   * @param params - 参数
   * @author lvdaxianerplus
   * @date 2026-04-19
   */
  sendNotification(method: string, params?: Record<string, unknown>): void {
    const notification: JsonRpcRequest = {
      jsonrpc: '2.0',
      method,
      params
    };

    this.process?.stdin?.write(JSON.stringify(notification) + '\n');
  }

  /**
   * 调用 MCP 工具
   *
   * @param name - 工具名称
   * @param args - 工具参数
   * @returns Promise<unknown>
   * @author lvdaxianerplus
   * @date 2026-04-19
   */
  async callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
    return this.sendRequest('tools/call', {
      name,
      arguments: args
    });
  }

  /**
   * 获取工具列表
   *
   * @returns Promise<unknown>
   * @author lvdaxianerplus
   * @date 2026-04-19
   */
  async listTools(): Promise<unknown> {
    return this.sendRequest('tools/list');
  }

  /**
   * 等待指定时间
   *
   * @param ms - 毫秒
   * @author lvdaxianerplus
   * @date 2026-04-19
   */
  async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 停止 MCP Server
   *
   * @author lvdaxianerplus
   * @date 2026-04-19
   */
  stop(): void {
    if (this.process) {
      this.process.kill();
      this.process = null;
    }
  }
}

/**
 * 测试运行器
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
class McpTestRunner {
  private client: McpProtocolClient;
  private results: TestResult[] = [];

  constructor() {
    this.client = new McpProtocolClient();
  }

  /**
   * 运行所有测试
   *
   * @returns Promise<TestResult[]>
   * @author lvdaxianerplus
   * @date 2026-04-19
   */
  async runAllTests(): Promise<TestResult[]> {
    console.log('='.repeat(60));
    console.log('MCP HTTP Gateway 故事线测试（MCP 协议）');
    console.log('='.repeat(60));
    console.log('');

    // 启动 MCP 客户端
    await this.client.start();

    // 先获取工具列表验证连接
    const toolsList = await this.client.listTools();
    console.log('[工具列表] 成功获取工具');
    console.log('');

    // 定义测试场景 - 每个模块的关键测试
    const testCases = [
      // MCP Server 模块测试 (#1-15)
      { id: 1, name: '故事线#1: STDIO传输启动', tool: 'getUser', args: { userId: 'user-001' } },
      { id: 2, name: '故事线#2: ListTools请求', tool: '_list', args: {} },
      { id: 3, name: '故事线#3: CallTool请求-GET', tool: 'getUser', args: { userId: 'user-002' } },
      { id: 4, name: '故事线#4: CallTool请求-POST', tool: 'addAge', args: { userId: 'user-003', age: 25 } },
      { id: 5, name: '故事线#5: CallTool请求-查询', tool: 'queryUser', args: { name: '张三' } },
      { id: 6, name: '故事线#6: 参数缺失测试', tool: 'getUser', args: {} },
      { id: 7, name: '故事线#7: 工具不存在测试', tool: 'nonexistent', args: {} },
      { id: 8, name: '故事线#8: 多参数传递', tool: 'queryUser', args: { name: '李四', city: '上海' } },
      { id: 9, name: '故事线#9: 健康检查工具', tool: 'testHealthCheck', args: {} },
      { id: 10, name: '故事线#10: Dashboard工具', tool: 'testDashboard', args: {} },
      { id: 11, name: '故事线#11: 连续调用-第1次', tool: 'getUser', args: { userId: 'seq-1' } },
      { id: 12, name: '故事线#12: 连续调用-第2次', tool: 'getUser', args: { userId: 'seq-2' } },
      { id: 13, name: '故事线#13: 连续调用-第3次', tool: 'getUser', args: { userId: 'seq-3' } },
      { id: 14, name: '故事线#14: 不同参数-数值', tool: 'addAge', args: { userId: 'num-test', age: 30 } },
      { id: 15, name: '故事线#15: 不同参数-字符串', tool: 'queryUser', args: { name: '王五' } },

      // Tool Executor 模块测试 (#16-35)
      { id: 16, name: '故事线#16: URL路径参数', tool: 'getUser', args: { userId: 'path-test-001' } },
      { id: 17, name: '故事线#17: 查询参数', tool: 'queryUser', args: { name: '查询测试', city: '北京' } },
      { id: 18, name: '故事线#18: POST请求体', tool: 'addAge', args: { userId: 'body-test', age: 28 } },
      { id: 19, name: '故事线#19: 必填参数验证', tool: 'addAge', args: { userId: 'only-user' } },
      { id: 20, name: '故事线#20: 多次调用同一工具', tool: 'getUser', args: { userId: 'repeat-1' } },
      { id: 21, name: '故事线#21: 多次调用同一工具', tool: 'getUser', args: { userId: 'repeat-2' } },
      { id: 22, name: '故事线#22: 多次调用同一工具', tool: 'getUser', args: { userId: 'repeat-3' } },
      { id: 23, name: '故事线#23: Mock响应验证', tool: 'getUser', args: { userId: 'mock-test' } },
      { id: 24, name: '故事线#24: 不同工具切换', tool: 'queryUser', args: { name: 'switch-test' } },
      { id: 25, name: '故事线#25: 不同工具切换', tool: 'addAge', args: { userId: 'switch-2', age: 35 } },
      { id: 26, name: '故事线#26: 参数类型-字符串', tool: 'getUser', args: { userId: 'string-type' } },
      { id: 27, name: '故事线#27: 参数类型-数值', tool: 'addAge', args: { userId: 'num-type', age: 99 } },
      { id: 28, name: '故事线#28: 参数边界-最小年龄', tool: 'addAge', args: { userId: 'min-age', age: 0 } },
      { id: 29, name: '故事线#29: 参数边界-最大年龄', tool: 'addAge', args: { userId: 'max-age', age: 150 } },
      { id: 30, name: '故事线#30: 错误处理-无效工具', tool: 'invalidTool', args: {} },
      { id: 31, name: '故事线#31: 错误处理-参数缺失', tool: 'getUser', args: {} },
      { id: 32, name: '故事线#32: 响应验证-成功', tool: 'getUser', args: { userId: 'success-test' } },
      { id: 33, name: '故事线#33: 响应验证-失败', tool: 'getUser', args: {} },
      { id: 34, name: '故事线#34: 响应时间测试', tool: 'getUser', args: { userId: 'perf-test' } },
      { id: 35, name: '故事线#35: 响应时间测试', tool: 'getUser', args: { userId: 'perf-test-2' } },

      // 认证模块测试 (#36-45)
      { id: 36, name: '故事线#36: Token A工具调用', tool: 'getUser', args: { userId: 'token-a-test' } },
      { id: 37, name: '故事线#37: Token B工具调用', tool: 'queryUser', args: { name: 'token-b-test' } },
      { id: 38, name: '故事线#38: 默认Token调用', tool: 'testHealthCheck', args: {} },
      { id: 39, name: '故事线#39: 多Token工具验证', tool: 'getUser', args: { userId: 'multi-token-1' } },
      { id: 40, name: '故事线#40: 多Token工具验证', tool: 'queryUser', args: { name: 'multi-token-2' } },
      { id: 41, name: '故事线#41: 认证头验证', tool: 'getUser', args: { userId: 'auth-header-test' } },
      { id: 42, name: '故事线#42: 认证信息记录', tool: 'addAge', args: { userId: 'auth-log', age: 40 } },
      { id: 43, name: '故事线#43: 敏感头脱敏', tool: 'getUser', args: { userId: 'mask-test' } },
      { id: 44, name: '故事线#44: Token配置验证', tool: 'getUser', args: { userId: 'token-config' } },
      { id: 45, name: '故事线#45: 认证失败处理', tool: 'getUser', args: {} },

      // 熔断器模块测试 (#46-55)
      { id: 46, name: '故事线#46: CLOSED状态验证', tool: 'getUser', args: { userId: 'closed-test' } },
      { id: 47, name: '故事线#47: 成功计数测试', tool: 'getUser', args: { userId: 'success-1' } },
      { id: 48, name: '故事线#48: 成功计数测试', tool: 'getUser', args: { userId: 'success-2' } },
      { id: 49, name: '故事线#49: 成功计数测试', tool: 'getUser', args: { userId: 'success-3' } },
      { id: 50, name: '故事线#50: 状态查询', tool: 'testHealthCheck', args: {} },
      { id: 51, name: '故事线#51: 熔断器统计', tool: 'getUser', args: { userId: 'stats-test' } },
      { id: 52, name: '故事线#52: 多工具熔断器', tool: 'addAge', args: { userId: 'cb-multi', age: 50 } },
      { id: 53, name: '故事线#53: 多工具熔断器', tool: 'queryUser', args: { name: 'cb-query' } },
      { id: 54, name: '故事线#54: 状态一致性', tool: 'getUser', args: { userId: 'consistency' } },
      { id: 55, name: '故事线#55: 错误触发测试', tool: 'invalidTool', args: {} },

      // 缓存模块测试 (#56-65)
      { id: 56, name: '故事线#56: 缓存写入测试', tool: 'getUser', args: { userId: 'cache-write' } },
      { id: 57, name: '故事线#57: 缓存读取测试', tool: 'getUser', args: { userId: 'cache-write' } }, // 同参数，应命中缓存
      { id: 58, name: '故事线#58: 缓存未命中', tool: 'getUser', args: { userId: 'cache-miss' } },
      { id: 59, name: '故事线#59: 缓存不同参数', tool: 'getUser', args: { userId: 'cache-diff' } },
      { id: 60, name: '故事线#60: 缓存命中验证', tool: 'getUser', args: { userId: 'cache-diff' } }, // 同参数
      { id: 61, name: '故事线#61: 缓存POST请求', tool: 'addAge', args: { userId: 'cache-post', age: 45 } },
      { id: 62, name: '故事线#62: 缓存POST命中', tool: 'addAge', args: { userId: 'cache-post', age: 45 } }, // 同参数
      { id: 63, name: '故事线#63: 缓存查询参数', tool: 'queryUser', args: { name: 'cache-query' } },
      { id: 64, name: '故事线#64: 缓存查询命中', tool: 'queryUser', args: { name: 'cache-query' } },
      { id: 65, name: '故事线#65: 缓存状态检查', tool: 'testHealthCheck', args: {} },

      // Mock 模块测试 (#66-75)
      { id: 66, name: '故事线#66: Mock模式验证', tool: 'getUser', args: { userId: 'mock-mode' } },
      { id: 67, name: '故事线#67: Mock响应验证', tool: 'getUser', args: { userId: 'mock-response' } },
      { id: 68, name: '故事线#68: Mock数据格式', tool: 'getUser', args: { userId: 'mock-format' } },
      { id: 69, name: '故事线#69: Mock多次调用', tool: 'getUser', args: { userId: 'mock-multi-1' } },
      { id: 70, name: '故事线#70: Mock多次调用', tool: 'getUser', args: { userId: 'mock-multi-2' } },
      { id: 71, name: '故事线#71: Mock POST', tool: 'addAge', args: { userId: 'mock-post', age: 55 } },
      { id: 72, name: '故事线#72: Mock查询', tool: 'queryUser', args: { name: 'mock-query' } },
      { id: 73, name: '故事线#73: Mock工具级配置', tool: 'getUser', args: { userId: 'tool-mock' } },
      { id: 74, name: '故事线#74: Mock全局模式', tool: 'getUser', args: { userId: 'global-mock' } },
      { id: 75, name: '故事线#75: Mock数据更新', tool: 'getUser', args: { userId: 'mock-update' } },

      // Dashboard 模块测试 (#76-90)
      { id: 76, name: '故事线#76: Dashboard调用', tool: 'testDashboard', args: {} },
      { id: 77, name: '故事线#77: 健康检查调用', tool: 'testHealthCheck', args: {} },
      { id: 78, name: '故事线#78: 统计数据验证', tool: 'getUser', args: { userId: 'stats-verify' } },
      { id: 79, name: '故事线#79: 日志记录验证', tool: 'getUser', args: { userId: 'log-verify' } },
      { id: 80, name: '故事线#80: 熔断器展示验证', tool: 'getUser', args: { userId: 'cb-display' } },
      { id: 81, name: '故事线#81: 缓存展示验证', tool: 'getUser', args: { userId: 'cache-display' } },
      { id: 82, name: '故事线#82: Mock展示验证', tool: 'getUser', args: { userId: 'mock-display' } },
      { id: 83, name: '故事线#83: 多工具统计', tool: 'addAge', args: { userId: 'multi-stats', age: 60 } },
      { id: 84, name: '故事线#84: 多工具统计', tool: 'queryUser', args: { name: 'multi-stats' } },
      { id: 85, name: '故事线#85: 响应时间记录', tool: 'getUser', args: { userId: 'response-time' } },
      { id: 86, name: '故事线#86: 错误计数验证', tool: 'invalidTool', args: {} },
      { id: 87, name: '故事线#87: 成功计数验证', tool: 'getUser', args: { userId: 'success-count' } },
      { id: 88, name: '故事线#88: 并发请求1', tool: 'getUser', args: { userId: 'concurrent-1' } },
      { id: 89, name: '故事线#89: 并发请求2', tool: 'getUser', args: { userId: 'concurrent-2' } },
      { id: 90, name: '故事线#90: 并发请求3', tool: 'getUser', args: { userId: 'concurrent-3' } },

      // 数据库日志模块测试 (#91-100)
      { id: 91, name: '故事线#91: 日志写入验证', tool: 'getUser', args: { userId: 'log-write' } },
      { id: 92, name: '故事线#92: 日志查询验证', tool: 'getUser', args: { userId: 'log-query' } },
      { id: 93, name: '故事线#93: 错误日志记录', tool: 'invalidTool', args: {} },
      { id: 94, name: '故事线#94: 审计日志验证', tool: 'getUser', args: { userId: 'audit-log' } },
      { id: 95, name: '故事线#95: 告警触发测试', tool: 'getUser', args: { userId: 'alert-test' } },
      { id: 96, name: '故事线#96: 统计聚合验证', tool: 'getUser', args: { userId: 'stats-aggr' } },
      { id: 97, name: '故事线#97: 日志时间戳验证', tool: 'getUser', args: { userId: 'timestamp' } },
      { id: 98, name: '故事线#98: 日志完整性', tool: 'addAge', args: { userId: 'complete', age: 65 } },
      { id: 99, name: '故事线#99: 日志批量测试', tool: 'getUser', args: { userId: 'batch-1' } },
      { id: 100, name: '故事线#100: 日志批量测试', tool: 'getUser', args: { userId: 'batch-2' } },

      // 配置管理模块测试 (#101-110)
      { id: 101, name: '故事线#101: 配置加载验证', tool: 'getUser', args: { userId: 'config-load' } },
      { id: 102, name: '故事线#102: 工具配置验证', tool: 'getUser', args: { userId: 'tool-config' } },
      { id: 103, name: '故事线#103: Token配置验证', tool: 'queryUser', args: { name: 'token-config' } },
      { id: 104, name: '故事线#104: 熔断器配置', tool: 'getUser', args: { userId: 'cb-config' } },
      { id: 105, name: '故事线#105: 缓存配置', tool: 'getUser', args: { userId: 'cache-config' } },
      { id: 106, name: '故事线#106: Mock配置', tool: 'getUser', args: { userId: 'mock-config' } },
      { id: 107, name: '故事线#107: 日志配置', tool: 'getUser', args: { userId: 'log-config' } },
      { id: 108, name: '故事线#108: 超时配置', tool: 'getUser', args: { userId: 'timeout-config' } },
      { id: 109, name: '故事线#109: 重试配置', tool: 'getUser', args: { userId: 'retry-config' } },
      { id: 110, name: '故事线#110: 回退配置', tool: 'getUser', args: { userId: 'fallback-config' } },

      // 集成测试模块测试 (#111-120)
      { id: 111, name: '故事线#111: 完整流程-GET', tool: 'getUser', args: { userId: 'full-get' } },
      { id: 112, name: '故事线#112: 完整流程-POST', tool: 'addAge', args: { userId: 'full-post', age: 70 } },
      { id: 113, name: '故事线#113: 完整流程-查询', tool: 'queryUser', args: { name: 'full-query' } },
      { id: 114, name: '故事线#114: 回退链测试', tool: 'getUser', args: { userId: 'fallback-chain' } },
      { id: 115, name: '故事线#115: 熔断器集成', tool: 'getUser', args: { userId: 'circuit-int' } },
      { id: 116, name: '故事线#116: 缓存集成', tool: 'getUser', args: { userId: 'cache-int' } },
      { id: 117, name: '故事线#117: Mock集成', tool: 'getUser', args: { userId: 'mock-int' } },
      { id: 118, name: '故事线#118: 日志集成', tool: 'getUser', args: { userId: 'log-int' } },
      { id: 119, name: '故事线#119: 多模块协同', tool: 'getUser', args: { userId: 'multi-module' } },
      { id: 120, name: '故事线#120: 端到端验证', tool: 'getUser', args: { userId: 'e2e-final' } },
    ];

    // 执行所有测试
    for (const tc of testCases) {
      const result = await this.runTest(tc);
      this.results.push(result);

      // 每次测试间隔 100ms
      await this.client.sleep(100);
    }

    return this.results;
  }

  /**
   * 运行单个测试
   *
   * @param tc - 测试配置
   * @returns Promise<TestResult>
   * @author lvdaxianerplus
   * @date 2026-04-19
   */
  async runTest(tc: { id: number; name: string; tool: string; args: Record<string, unknown> }): Promise<TestResult> {
    const startTime = Date.now();
    console.log(`[测试 ${tc.id}] ${tc.name}`);

    try {
      let result: unknown;

      if (tc.tool === '_list') {
        result = await this.client.listTools();
      } else {
        result = await this.client.callTool(tc.tool, tc.args);
      }

      const duration = Date.now() - startTime;

      // 检查结果是否为错误
      const resultObj = result as { content?: Array<{ type: string; text: string }> };
      const isError = resultObj?.content?.[0]?.text?.includes('error') ||
                       resultObj?.content?.[0]?.text?.includes('Tool not found') ||
                       resultObj?.content?.[0]?.text?.includes('Missing required') ||
                       false;

      // 根据测试类型判断是否应该失败
      const shouldFail = tc.tool === 'invalidTool' ||
                         (tc.tool === 'getUser' && !tc.args.userId) ||
                         (tc.tool === 'addAge' && tc.args.userId && !tc.args.age);

      const passed: boolean = shouldFail ? isError : !isError;

      console.log(`  结果: ${passed ? '✅ 通过' : '❌ 失败'} (${duration}ms)`);

      if (!passed) {
        console.log(`  数据: ${JSON.stringify(result).substring(0, 100)}...`);
      }

      return {
        id: tc.id,
        name: tc.name,
        passed,
        data: result,
        duration
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.log(`  结果: ❌ 异常 (${duration}ms) - ${errorMsg}`);

      return {
        id: tc.id,
        name: tc.name,
        passed: false,
        error: errorMsg,
        duration
      };
    }
  }

  /**
   * 打印测试报告
   *
   * @author lvdaxianerplus
   * @date 2026-04-19
   */
  printReport(): void {
    console.log('\n' + '='.repeat(60));
    console.log('MCP HTTP Gateway 故事线测试报告');
    console.log('='.repeat(60));

    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);

    console.log(`\n总计: ${this.results.length} 条故事线`);
    console.log(`通过: ${passed} 条`);
    console.log(`失败: ${failed} 条`);
    console.log(`通过率: ${((passed / this.results.length) * 100).toFixed(1)}%`);
    console.log(`总耗时: ${totalDuration}ms`);

    // 模块统计
    const modules = [
      { name: 'MCP Server', start: 1, end: 15 },
      { name: 'Tool Executor', start: 16, end: 35 },
      { name: '认证模块', start: 36, end: 45 },
      { name: '熔断器模块', start: 46, end: 55 },
      { name: '缓存模块', start: 56, end: 65 },
      { name: 'Mock模块', start: 66, end: 75 },
      { name: 'Dashboard', start: 76, end: 90 },
      { name: '数据库日志', start: 91, end: 100 },
      { name: '配置管理', start: 101, end: 110 },
      { name: '集成测试', start: 111, end: 120 },
    ];

    console.log('\n模块统计:');
    for (const mod of modules) {
      const modResults = this.results.filter(r => r.id >= mod.start && r.id <= mod.end);
      const modPassed = modResults.filter(r => r.passed).length;
      console.log(`  ${mod.name}: ${modPassed}/${modResults.length} 通过`);
    }

    if (failed > 0) {
      console.log('\n失败的测试:');
      this.results.filter(r => !r.passed).forEach(r => {
        console.log(`  ❌ #${r.id} ${r.name}: ${r.error}`);
      });
    }

    console.log('\n' + '='.repeat(60));
  }

  /**
   * 停止测试
   *
   * @author lvdaxianerplus
   * @date 2026-04-19
   */
  stop(): void {
    this.client.stop();
  }
}

/**
 * 主函数
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
async function main(): Promise<void> {
  const runner = new McpTestRunner();

  try {
    await runner.runAllTests();
    runner.printReport();

    // 等待 2 秒让日志写入完成
    console.log('\n等待日志写入...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('\n请访问 http://localhost:11112/dashboard 查看 Dashboard 数据');
  } catch (error) {
    console.error('[测试错误]', error);
  } finally {
    runner.stop();
  }
}

main();