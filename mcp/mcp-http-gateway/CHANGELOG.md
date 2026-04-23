# Changelog

[English](CHANGELOG_EN.md) | 中文

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 版本策略

> **偶数版本（稳定版）**：如 1.0、1.2、2.0 — 经过充分测试，适合生产环境使用
> 
> **奇数版本（快速迭代版）**：如 1.1、1.3、2.1 — 包含最新功能，可能存在不稳定因素，适合测试和预览

---

## [1.0.3] - 2026-04-23

### 稳定版（修复版）

> 本版本修复了多个关键问题，增强用户体验和稳定性。

### Added

- ✨ **端口冲突自动处理**
  - 检测端口占用情况
  - 自动杀死同类 node 进程（同类进程清理）
  - 自动尝试下一个可用端口（最多 10 个）
  - Dashboard 页面顶部显示当前端口徽章

### Changed

- 📦 **构建优化**
  - 使用 esbuild 打包为单文件 CommonJS（dist/cli.cjs）
  - 移除 tsc 编译，减小包体积
  - 添加 shebang 支持 npx 直接执行

- 📝 **文档更新**
  - 添加 Dashboard 使用说明（如何查看、端口确认方法）
  - 添加 npm 发布检查清单（NPM_PUBLISH_CHECKLIST.md）
  - 修复 README 中 cli.js → cli.cjs 引用

### Fixed

- 🐛 **修复 npx 执行失败**
  - 添加 CLI shebang（`#!/usr/bin/env node`）
  - 移除无效的 package.json 字段（main、types、exports）
  - 修复 import.meta 在 CJS 格式下不可用问题

---

## [1.0.0] - 2026-04-23

### 首次正式发布（稳定版）

> 本版本为首个正式发布的稳定版本，包含完整的 MCP HTTP Gateway 功能集。

### Added

- ✨ **HTTP 请求转发**
  - 将 MCP 工具调用转发到 HTTP REST API
  - 支持 GET、POST、PUT、DELETE、PATCH 方法
  - 路径模板支持 `{param}` 动态参数
  - 请求头管理和 Token 认证

- ✨ **增强请求/响应转换模板**
  - 变量替换：`{param}`、`{timestamp}`、`{uuid}`、`{random}`、`{date}`、`{now}`
  - 嵌套字段访问：`{data.user.name}`、`{items[0].id}`
  - 表达式计算：`{{value + 10}}`、`{{value * 2}}`
  - 默认值语法：`{value|default}`、`{value ?? 'default'}`
  - 日期部分变量：`{year}`、`{month}`、`{day}`、`{hour}`、`{minute}`、`{second}`
  - 支持 omit 字段排除、flatten 对象展平、defaultValues 默认值填充

- ✨ **链路追踪 ID（Tracing）**
  - 生成唯一 Trace ID（UUID 或短 ID）
  - Trace ID 在请求生命周期中传递
  - 日志中包含 Trace ID
  - HTTP 响应头返回 Trace ID（X-Trace-ID）
  - 向后端传递 Trace ID
  - Dashboard API：`/api/trace/:id`、`/api/trace/recent`、`/api/trace/tool/:name`、`/api/trace/stats`

- ✨ **熔断器（Circuit Breaker）**
  - CLOSED / OPEN / HALF_OPEN 状态流转
  - 故障阈值配置（failureThreshold、successThreshold）
  - 半开状态持续时间配置（halfOpenTime）

- ✨ **降级策略（Fallback）**
  - 缓存兜底（忽略 TTL）
  - Mock 数据兜底
  - 降级条件配置

- ✨ **缓存机制（Cache）**
  - LRU 缓存策略
  - TTL 过期控制（支持 TTL=0 永不过期）
  - 工具级缓存配置持久化
  - 缓存配置优先级：CLI > SQLite > 配置文件 > 默认值

- ✨ **Mock 模式**
  - 全局 Mock 开关
  - 工具级 Mock 配置持久化
  - 动态数据生成（支持 `{timestamp}`、`{uuid}` 等变量）
  - AI 提示生成（aiHint）

- ✨ **请求限流（Rate Limit）**
  - 令牌桶算法（Token Bucket）：允许突发流量
  - 滑动窗口算法（Sliding Window）：精确控制速率
  - 全局限流配置：`rateLimit.globalLimit`（默认 100/秒）
  - 工具级限流配置：`rateLimit.toolLimits`（优先级高于全局）

- ✨ **并发控制（Concurrency Control）**
  - 最大并发请求限制：`concurrency.maxConcurrent`（默认 50）
  - 等待队列机制：超出限制的请求进入队列等待
  - 队列超时配置：`concurrency.queueTimeout`（默认 30 秒）

- ✨ **超时强制中断（Timeout Abort）**
  - AbortController 强制中断机制
  - 全局超时配置：`timeout.read`（默认 30 秒）
  - 工具级超时配置（优先级高于全局）

- ✨ **尝试次数限制（Attempt Tracking）**
  - 全局 `maxAttempts` 配置（默认 3 次）
  - 失败时返回 `metadata` 字段（尝试次数、剩余次数、建议）

- ✨ **增强健康检查（Health Check）**
  - `/health` - 综合健康检查（返回 7 个组件状态）
  - `/health/detail` - 详细组件状态（含更多指标）
  - `/health/ready` - K8s 就绪探针
  - `/health/live` - K8s 存活探针
  - `/health/startup` - K8s 启动探针
  - 检查组件：config、database、circuitBreakers、cache、rateLimit、concurrency、trace

- ✨ **告警通知（Alert Notification）**
  - 支持多种通知渠道：Webhook、Slack、钉钉、企业微信
  - 告警规则：熔断器状态变更、限流拒绝、并发超限、错误率阈值、超时
  - 告警冷却机制：防止重复告警
  - 告警风暴防护：每小时最大告警数限制
  - 告警历史记录：SQLite 持久化
  - 告警模板支持自定义

- ✨ **配置版本控制（Config Version Control）**
  - 配置变更记录：版本号、变更内容、变更时间、变更人
  - 配置回滚：支持回滚到指定版本
  - 配置比较：比较不同版本的差异
  - 配置导出：导出指定版本的配置
  - 配置内容校验和：防止篡改

- ✨ **灰度发布（Canary Release）**
  - 灰度策略：按百分比、按用户、按工具
  - 灰度状态：running、paused、completed、rolled_back
  - 灰度监控：实时监控灰度效果
  - 灰度回滚：快速回滚到基线版本
  - 自动回滚阈值：错误率超过阈值自动回滚

- ✨ **SQLite 日志记录**
  - 请求日志（request_logs）
  - 响应日志
  - 错误日志（error_logs）
  - 审计日志（audit_logs）
  - 链路追踪日志（trace_logs）
  - 自动清理：支持 maxDays 配置
  - WAL 模式：支持并发读写

- ✨ **Dashboard 监控面板**
  - 实时统计（成功率、Top 工具）
  - 日志查询（分页、筛选）
  - 配置管理（缓存、Mock、限流、并发）
  - 热更新（无需重启）

- ✨ **传输模式**
  - STDIO 模式：Claude Code 自动管理进程
  - SSE 模式：持久连接，避免端口冲突（推荐）

- ✨ **工具级配置持久化**
  - 缓存配置持久化到 SQLite
  - Mock 配置持久化到 SQLite
  - 配置优先级：CLI > SQLite > 配置文件 > 默认值

- 📝 **文档**
  - README.md：功能概览、MCP 配置、故障排查
  - CONFIG.md：所有配置参数详解（类型、是否可选、默认值）
  - CHANGELOG.md：版本变更记录

### Fixed

- 🔧 缓存 TTL=0 永不过期
- 🔧 SQLite 日志记录 named parameter 问题
- 🔧 SSE 连接使用 SSEServerTransport

---

## Links

[1.0.0]: https://github.com/lvdaxianer/lvdaxianerplus-ai/releases/tag/v1.0.0