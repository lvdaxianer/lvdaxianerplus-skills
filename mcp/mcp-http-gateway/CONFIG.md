# 配置参数详解

本文档详细说明 MCP HTTP Gateway 的所有配置参数，包括参数类型、是否可选、默认值及说明。

---

## 目录

1. [主配置结构](#主配置结构)
2. [CLI 参数](#cli-参数)
3. [服务器配置](#服务器配置)
4. [工具配置](#工具配置)
5. [熔断器配置](#熔断器配置)
6. [缓存配置](#缓存配置)
7. [限流配置](#限流配置)
8. [并发控制配置](#并发控制配置)
9. [链路追踪配置](#链路追踪配置)
10. [超时配置](#超时配置)
11. [重试配置](#重试配置)
12. [降级配置](#降级配置)
13. [Mock 配置](#mock-配置)
14. [日志配置](#日志配置)
15. [SQLite 日志配置](#sqlite-日志配置)
16. [告警配置](#告警配置)
17. [热更新配置](#热更新配置)
18. [备份配置](#备份配置)
19. [审计配置](#审计配置)
20. [压缩配置](#压缩配置)

---

## 主配置结构

### Config

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `baseUrl` | `string` | ✅ 必填 | - | API 基础 URL，所有工具路径基于此 URL |
| `tokens` | `Record<string, string>` | ❌ 可选 | - | Token 键值对映射，供工具引用 |
| `tools` | `Record<string, ToolConfig>` | ✅ 必填 | - | 工具定义映射，键为工具名 |
| `auth` | `AuthConfig` | ❌ 可选 | - | 全局认证配置 |
| `proxy` | `ProxyConfig` | ❌ 可选 | - | 代理配置 |
| `timeout` | `TimeoutConfig` | ❌ 可选 | [见超时配置](#超时配置) | 全局超时配置 |
| `retry` | `RetryConfig` | ❌ 可选 | [见重试配置](#重试配置) | 全局重试配置 |
| `circuitBreaker` | `CircuitBreakerConfig` | ❌ 可选 | [见熔断器配置](#熔断器配置) | 熔断器配置 |
| `cache` | `CacheConfig` | ❌ 可选 | [见缓存配置](#缓存配置) | 全局缓存配置 |
| `rateLimit` | `RateLimitConfig` | ❌ 可选 | [见限流配置](#限流配置) | 限流配置 |
| `concurrency` | `ConcurrencyConfig` | ❌ 可选 | [见并发控制配置](#并发控制配置) | 并发控制配置 |
| `trace` | `TraceConfig` | ❌ 可选 | [见链路追踪配置](#链路追踪配置) | 链路追踪配置 |
| `logging` | `LoggingConfig` | ❌ 可选 | [见日志配置](#日志配置) | 日志配置 |
| `metrics` | `MetricsConfig` | ❌ 可选 | `{ enabled: true, port: 11112 }` | 指标配置 |
| `healthCheck` | `HealthCheckConfig` | ❌ 可选 | `{ enabled: true, port: 11112 }` | 健康检查配置 |
| `server` | `ServerConfig` | ❌ 可选 | [见服务器配置](#服务器配置) | 服务器配置 |
| `sqlite` | `SQLiteLoggingConfig` | ❌ 可选 | [见SQLite日志配置](#sqlite-日志配置) | SQLite 日志配置 |
| `compression` | `CompressionConfig` | ❌ 可选 | [见压缩配置](#压缩配置) | 响应压缩配置 |
| `hotReload` | `HotReloadConfig` | ❌ 可选 | [见热更新配置](#热更新配置) | 配置热更新配置 |
| `backup` | `BackupConfig` | ❌ 可选 | [见备份配置](#备份配置) | 备份配置 |
| `alert` | `EnhancedAlertConfig` | ❌ 可选 | [见告警配置](#告警配置) | 告警配置 |
| `audit` | `AuditConfig` | ❌ 可选 | [见审计配置](#审计配置) | 审计配置 |
| `mock` | `MockConfig` | ❌ 可选 | `{ enabled: false }` | Mock 配置 |
| `fallback` | `FallbackConfig` | ❌ 可选 | [见降级配置](#降级配置) | 降级配置 |
| `attemptTracking` | `AttemptTrackingConfig` | ❌ 可选 | `{ enabled: false, maxAttempts: 3 }` | 尝试追踪配置 |

---

## CLI 参数

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `--config <path>` | `string` | ❌ 可选 | `./tools.json` | 配置文件路径 |
| `--transport <mode>` | `string` | ❌ 可选 | `stdio` | 传输模式：`stdio` / `sse` |
| `--sse-port <port>` | `number` | ❌ 可选 | `11113` | SSE 服务端口 |
| `--http-port <port>` | `number` | ❌ 可选 | `11112` | HTTP/Dashboard 端口 |
| `--sqlite` | `boolean` | ❌ 可选 | `false` | 启用 SQLite 日志（已废弃，使用配置文件） |
| `--sqlite-path <path>` | `string` | ❌ 可选 | `./data/logs.db` | SQLite 数据库路径（已废弃） |

---

## 服务器配置

### ServerConfig

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `transport` | `string` | ❌ 可选 | `stdio` | 传输模式：`stdio`（每次会话启动新进程）或 `sse`（持久连接） |
| `ssePort` | `number` | ❌ 可选 | `11113` | SSE 服务端口（SSE 模式使用） |
| `httpPort` | `number` | ❌ 可选 | `11112` | HTTP 服务端口（用于 Dashboard/健康检查） |
| `ssl` | `SSLConfig` | ❌ 可选 | - | SSL 配置（启用 HTTPS） |

### SSLConfig

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `enabled` | `boolean` | ❌ 可选 | `false` | 是否启用 SSL |
| `cert` | `string` | ✅ 必填（启用时） | - | SSL 证书文件路径 |
| `key` | `string` | ✅ 必填（启用时） | - | SSL 私钥文件路径 |

---

## 工具配置

### ToolConfig

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `description` | `string` | ✅ 必填 | - | 工具描述（供 LLM 理解用途） |
| `method` | `string` | ✅ 必填 | - | HTTP 方法：`GET` / `POST` / `PUT` / `DELETE` / `PATCH` |
| `path` | `string` | ✅ 必填 | - | API 路径（支持 `{param}` 路径参数，或完整 URL） |
| `beforeDescription` | `string` | ❌ 可选 | - | 工具描述前缀（返回给 LLM 时拼接到 description 之前，Dashboard 不显示） |
| `afterDescription` | `string` | ❌ 可选 | - | 工具描述后缀（返回给 LLM 时拼接到 description 之后，Dashboard 不显示） |
| `token` | `string` | ❌ 可选 | - | Token 引用键（引用 `tokens` 配置中的 key） |
| `authType` | `string` | ❌ 可选 | `bearer` | 认证类型：`bearer` / `basic` / `apiKey` |
| `headers` | `Record<string, string>` | ❌ 可选 | - | 自定义 HTTP 请求头（支持模板占位符） |
| `timeout` | `number` | ❌ 可选 | 全局 `timeout.read` | 超时时间覆盖（毫秒） |
| `retry` | `RetryConfig` | ❌ 可选 | 全局 `retry` | 重试配置覆盖 |
| `cache` | `CacheConfig` | ❌ 可选 | 全局 `cache` | 缓存配置覆盖 |
| `requestTransform` | `Record<string, string>` | ❌ 可选 | - | 请求参数名称映射（旧版，兼容） |
| `requestTransformConfig` | `RequestTransformConfig` | ❌ 可选 | - | 请求转换配置（新版，增强） |
| `responseTransform` | `ResponseTransformConfig` | ❌ 可选 | - | 响应转换配置 |
| `idempotencyKey` | `string` | ❌ 可选 | - | 幂等性键请求头名称 |
| `body` | `Record<string, ParameterDef>` | ❌ 可选 | - | POST/PUT 请求体参数定义 |
| `queryParams` | `Record<string, ParameterDef>` | ❌ 可选 | - | URL 查询参数定义 |
| `mock` | `MockToolConfig` | ❌ 可选 | - | Mock 配置（用于测试） |

### ParameterDef

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `description` | `string` | ✅ 必填 | - | 参数描述（供 LLM 理解） |
| `type` | `string` | ✅ 必填 | - | 参数类型：`string` / `number` / `boolean` / `object` / `array` |
| `required` | `boolean` | ✅ 必填 | - | 是否必填 |
| `defaultValue` | `unknown` | ❌ 可选 | - | 默认值（可选参数时使用） |

### RequestTransformConfig

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `template` | `string` | ❌ 可选 | - | 请求模板（支持 `{param}`、`{{expression}}`） |
| `expressions` | `Record<string, string>` | ❌ 可选 | - | 表达式转换映射（key 为新字段名） |
| `defaultValues` | `Record<string, unknown>` | ❌ 可选 | - | 默认值映射（字段路径 → 默认值） |
| `rename` | `Record<string, string>` | ❌ 可选 | - | 参数名重命名映射 |
| `addFields` | `Record<string, string>` | ❌ 可选 | - | 新增字段配置（key 为字段名，value 为表达式） |

### ResponseTransformConfig

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `pick` | `string[]` | ❌ 可选 | - | 包含的字段路径列表（支持嵌套路径如 `data.user.name`） |
| `rename` | `Record<string, string>` | ❌ 可选 | - | 字段重命名映射（支持嵌套路径） |
| `template` | `string` | ❌ 可选 | - | 响应模板（支持 `{param}`、`{timestamp}`） |
| `expressions` | `Record<string, string>` | ❌ 可选 | - | 表达式转换映射 |
| `omit` | `string[]` | ❌ 可选 | - | 排除的字段路径列表（与 `pick` 相反） |
| `defaultValues` | `Record<string, unknown>` | ❌ 可选 | - | 默认值映射 |
| `flatten` | `boolean` | ❌ 可选 | `false` | 是否展平嵌套对象 |
| `flattenPrefix` | `string` | ❌ 可选 | `_` | 展平时的前缀分隔符 |

---

## 熔断器配置

### CircuitBreakerConfig

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `enabled` | `boolean` | ✅ 必填 | `false` | 是否启用熔断器 |
| `failureThreshold` | `number` | ❌ 可选 | `5` | 触发熔断的连续失败次数 |
| `successThreshold` | `number` | ❌ 可选 | `2` | 关闭熔断的连续成功次数 |
| `halfOpenTime` | `number` | ❌ 可选 | `30000` | 半开状态持续时间（毫秒） |

**状态流转**：
- `CLOSED` → 正常状态
- `OPEN` → 熔断状态，拒绝请求
- `HALF_OPEN` → 半开状态，允许少量请求探测恢复

---

## 缓存配置

### CacheConfig

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `enabled` | `boolean` | ✅ 必填 | `false` | 是否启用缓存 |
| `ttl` | `number` | ❌ 可选 | `60000` | 缓存有效期（毫秒），`0` 表示永不过期 |
| `maxSize` | `number` | ❌ 可选 | `1000` | 最大缓存条目数 |

**注意**：缓存用于降级备用（非查询加速）。`ttl=0` 永不过期，适用于降级场景。

---

## 限流配置

### RateLimitConfig

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `enabled` | `boolean` | ✅ 必填 | `false` | 是否启用限流 |
| `type` | `string` | ❌ 可选 | `tokenBucket` | 限流算法：`tokenBucket`（令牌桶）/ `slidingWindow`（滑动窗口） |
| `globalLimit` | `number` | ❌ 可选 | `100` | 全局每秒最大请求数 |
| `toolLimits` | `Record<string, ToolRateLimitConfig>` | ❌ 可选 | - | 工具级限流配置（优先级高于全局） |

### ToolRateLimitConfig

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `limit` | `number` | ✅ 必填 | - | 时间窗口内最大请求数 |
| `window` | `number` | ❌ 可选 | `1000` | 时间窗口（毫秒） |

**算法对比**：

| 算法 | 特点 | 适用场景 |
|------|------|----------|
| `tokenBucket` | 允许突发流量，平滑处理 | 请求波动大、API 容错高 |
| `slidingWindow` | 精确限流，无突发 | 严格限流、防止超载 |

---

## 并发控制配置

### ConcurrencyConfig

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `enabled` | `boolean` | ✅ 必填 | `false` | 是否启用并发控制 |
| `maxConcurrent` | `number` | ❌ 可选 | `50` | 最大并发请求数 |
| `queueSize` | `number` | ❌ 可选 | `100` | 等待队列大小 |
| `queueTimeout` | `number` | ❌ 可选 | `30000` | 队列等待超时（毫秒） |

---

## 链路追踪配置

### TraceConfig

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `enabled` | `boolean` | ✅ 必填 | `true` | 是否启用链路追踪 |
| `headerName` | `string` | ❌ 可选 | `X-Trace-ID` | Trace ID HTTP 头名称 |
| `generateShort` | `boolean` | ❌ 可选 | `false` | 是否生成短 ID（默认使用完整 UUID） |
| `includeInResponse` | `boolean` | ❌ 可选 | `true` | 是否在响应头中返回 Trace ID |
| `propagateToBackend` | `boolean` | ❌ 可选 | `true` | 是否向后端传递 Trace ID |

---

## 超时配置

### TimeoutConfig

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `connect` | `number` | ❌ 可选 | `5000` | 连接超时（毫秒） |
| `read` | `number` | ❌ 可选 | `30000` | 读取超时（毫秒） |
| `write` | `number` | ❌ 可选 | `30000` | 写入超时（毫秒） |

---

## 重试配置

### RetryConfig

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `enabled` | `boolean` | ✅ 必填 | `false` | 是否启用重试 |
| `maxAttempts` | `number` | ❌ 可选 | `3` | 最大重试次数 |
| `delay` | `number` | ❌ 可选 | `1000` | 初始重试延迟（毫秒） |
| `backoff` | `number` | ❌ 可选 | `2.0` | 退避倍数（每次重试延迟乘以此值） |
| `retryOn` | `number[]` | ❌ 可选 | `[429, 500, 502, 503, 504]` | 触发重试的 HTTP 状态码列表 |

---

## 降级配置

### FallbackConfig

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `enabled` | `boolean` | ✅ 必填 | `true` | 是否启用降级 |
| `useExpiredCache` | `boolean` | ❌ 可选 | `true` | 使用过期缓存兜底 |
| `useMockAsFallback` | `boolean` | ❌ 可选 | `true` | 使用 Mock 数据兜底 |

**降级链路**：请求失败 → 缓存兜底（忽略 TTL） → Mock 兜底 → 返回错误

---

## Mock 配置

### MockConfig

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `enabled` | `boolean` | ✅ 必填 | `false` | 是否启用全局 Mock |
| `mockData` | `Record<string, MockToolConfig>` | ❌ 可选 | - | 各工具的 Mock 配置映射 |

### MockToolConfig

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `enabled` | `boolean` | ✅ 必填 | `false` | 是否启用此工具的 Mock |
| `response` | `unknown` | ❌ 可选 | - | 静态响应数据 |
| `responseTemplate` | `string` | ❌ 可选 | - | 动态响应模板（支持 `{param}`、`{timestamp}`、`{uuid}`） |
| `dynamicConfig` | `MockDynamicConfig` | ❌ 可选 | - | 动态数据生成配置 |
| `delay` | `number` | ❌ 可选 | `0` | 模拟延迟（毫秒） |
| `statusCode` | `number` | ❌ 可选 | `200` | 模拟 HTTP 状态码 |
| `headers` | `Record<string, string>` | ❌ 可选 | - | 模拟响应头 |

### MockDynamicConfig

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `enabled` | `boolean` | ✅ 必填 | `false` | 是否启用动态数据生成 |
| `fields` | `DynamicFieldConfig[]` | ✅ 必填 | - | 字段配置列表 |
| `seed` | `number` | ❌ 可选 | - | 随机种子（用于生成可复现数据） |

### DynamicFieldConfig

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `name` | `string` | ✅ 必填 | - | 字段名称 |
| `type` | `string` | ✅ 必填 | - | 字段类型：`string` / `number` / `boolean` / `date` / `array` / `object` |
| `description` | `string` | ❌ 可选 | - | 字段描述 |
| `aiHint` | `string` | ❌ 可选 | - | AI 语义提示（如"用户名"→生成中文姓名） |
| `required` | `boolean` | ❌ 可选 | `false` | 是否必填 |
| `constraints` | `DynamicFieldConstraints` | ❌ 可选 | - | 字段约束规则 |

---

## 日志配置

### LoggingConfig

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `level` | `string` | ❌ 可选 | `info` | 日志级别：`debug` / `info` / `warn` / `error` |
| `logRequest` | `boolean` | ❌ 可选 | `true` | 是否记录请求 |
| `logResponse` | `boolean` | ❌ 可选 | `true` | 是否记录响应 |
| `logHeaders` | `boolean` | ❌ 可选 | `false` | 是否记录请求头 |
| `sensitiveHeaders` | `string[]` | ❌ 可选 | `['authorization', 'x-api-key']` | 需要脱敏的请求头列表 |
| `file` | `FileLoggingConfig` | ❌ 可选 | - | 文件日志配置 |

### FileLoggingConfig

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `enabled` | `boolean` | ✅ 必填 | `false` | 是否启用文件日志 |
| `dir` | `string` | ❌ 可选 | `./logs` | 日志文件目录 |
| `maxSize` | `number` | ❌ 可选 | `300` | 单文件最大大小（MB） |
| `rotateByMonth` | `boolean` | ❌ 可选 | `true` | 是否按月轮转 |
| `logRequestBody` | `boolean` | ❌ 可选 | `true` | 是否记录请求体 |
| `logResponseBody` | `boolean` | ❌ 可选 | `true` | 是否记录响应体 |
| `logRequestHeaders` | `boolean` | ❌ 可选 | `true` | 是否记录请求头 |
| `logResponseHeaders` | `boolean` | ❌ 可选 | `true` | 是否记录响应头 |

---

## SQLite 日志配置

### SQLiteLoggingConfig

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `enabled` | `boolean` | ✅ 必填 | `true` | 是否启用 SQLite 日志 |
| `dbPath` | `string` | ❌ 可选 | `./data/logs.db` | 数据库文件路径 |
| `maxDays` | `number` | ❌ 可选 | `30` | 日志保留天数 |
| `batchSize` | `number` | ❌ 可选 | `100` | 批量写入大小 |
| `syncInterval` | `number` | ❌ 可选 | `60000` | 统计同步间隔（毫秒） |

---

## 告警配置

### EnhancedAlertConfig

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `enabled` | `boolean` | ✅ 必填 | `false` | 是否启用告警 |
| `logDir` | `string` | ❌ 可选 | `./logs` | 告警日志目录（向后兼容） |
| `channels` | `AlertChannelConfig[]` | ❌ 可选 | `[]` | 告警通知渠道列表 |
| `rules` | `AlertRuleConfig[]` | ❌ 可选 | 5 条默认规则 | 告警规则列表 |
| `templates` | `Record<string, string>` | ❌ 可选 | 默认模板 | 告警消息模板映射 |
| `historyRetention` | `number` | ❌ 可选 | `30` | 告警历史保留天数 |
| `maxAlertsPerHour` | `number` | ❌ 可选 | `10` | 每小时最大告警数（防止告警风暴） |

### AlertChannelConfig

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `type` | `string` | ✅ 必填 | - | 渠道类型：`email` / `slack` / `dingtalk` / `wechat` / `webhook` |
| `enabled` | `boolean` | ✅ 必填 | `false` | 是否启用此渠道 |
| `config` | `Record<string, unknown>` | ❌ 可选 | - | 渠道特定配置（如 webhook URL） |

### AlertRuleConfig

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `type` | `string` | ✅ 必填 | - | 规则类型：`circuitBreaker` / `rateLimit` / `concurrency` / `errorRate` / `timeout` |
| `enabled` | `boolean` | ✅ 必填 | `true` | 是否启用此规则 |
| `threshold` | `number` | ❌ 可选 | - | 触发阈值 |
| `cooldown` | `number` | ❌ 可选 | `30000` | 告警冷却时间（毫秒，防止重复告警） |
| `severity` | `string` | ❌ 可选 | `warning` | 告警严重级别：`critical` / `warning` / `info` |

---

## 热更新配置

### HotReloadConfig

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `enabled` | `boolean` | ✅ 必填 | `true` | 是否启用热更新 |
| `watchFile` | `boolean` | ❌ 可选 | `true` | 是否监听文件变化 |
| `debounceMs` | `number` | ❌ 可选 | `1000` | 变化检测延迟（毫秒） |

---

## 备份配置

### BackupConfig

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `enabled` | `boolean` | ✅ 必填 | `true` | 是否启用备份 |
| `dir` | `string` | ❌ 可选 | `./backups` | 备份目录 |
| `maxVersions` | `number` | ❌ 可选 | `10` | 最大版本数 |
| `schedule` | `string` | ❌ 可选 | `0 * * * *` | 定时备份 Cron 表达式（默认每小时） |

---

## 审计配置

### AuditConfig

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `enabled` | `boolean` | ✅ 必填 | `true` | 是否启用审计日志 |
| `maskSensitiveFields` | `boolean` | ❌ 可选 | `true` | 是否脱敏敏感字段 |

---

## 压缩配置

### CompressionConfig

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `enabled` | `boolean` | ✅ 必填 | `false` | 是否启用压缩 |
| `threshold` | `number` | ❌ 可选 | `1024` | 压缩阈值（字节） |
| `level` | `number` | ❌ 可选 | `6` | 压缩级别 1-9 |
| `mimeTypes` | `string[]` | ❌ 可选 | `['application/json', 'text/plain', 'text/html']` | 需压缩的 MIME 类型列表 |

---

## 认证配置

### AuthConfig

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `type` | `string` | ✅ 必填 | `bearer` | 认证类型：`bearer` / `basic` / `apiKey` |
| `default` | `string` | ❌ 可选 | - | 默认 Token 引用键 |

---

## 代理配置

### ProxyConfig

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `url` | `string` | ✅ 必填 | - | 代理 URL |
| `auth` | `ProxyAuth` | ❌ 可选 | - | 代理认证 |

### ProxyAuth

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `username` | `string` | ✅ 必填 | - | 代理用户名 |
| `password` | `string` | ✅ 必填 | - | 代理密码 |

---

## 尝试追踪配置

### AttemptTrackingConfig

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `enabled` | `boolean` | ✅ 必填 | `false` | 是否启用尝试追踪 |
| `maxAttempts` | `number` | ❌ 可选 | `3` | 最大尝试次数 |
| `showMetadata` | `boolean` | ❌ 可选 | `true` | 是否在失败响应中显示元数据 |

---

## 配置优先级

| 优先级 | 来源 | 说明 |
|--------|------|------|
| 1（最高） | CLI 参数 | `--config`、`--transport`、`--sse-port` 等 |
| 2 | SQLite 数据库 | 工具级缓存/Mock 配置持久化 |
| 3 | 配置文件 | `tools.json` 中的配置 |
| 4（最低） | 默认值 | 各模块的默认配置常量 |

**注意**：工具级配置优先级高于全局配置。

---

*文档版本: v1.3.0 | 更新日期: 2026-04-23*