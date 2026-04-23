# Configuration Parameters Reference

English | [中文](CONFIG.md)

This document details all configuration parameters for MCP HTTP Gateway, including parameter types, optional status, default values, and descriptions.

---

## Table of Contents

1. [Main Configuration Structure](#main-configuration-structure)
2. [CLI Parameters](#cli-parameters)
3. [Server Configuration](#server-configuration)
4. [Tool Configuration](#tool-configuration)
5. [Circuit Breaker Configuration](#circuit-breaker-configuration)
6. [Cache Configuration](#cache-configuration)
7. [Rate Limiting Configuration](#rate-limiting-configuration)
8. [Concurrency Control Configuration](#concurrency-control-configuration)
9. [Tracing Configuration](#tracing-configuration)
10. [Timeout Configuration](#timeout-configuration)
11. [Retry Configuration](#retry-configuration)
12. [Fallback Configuration](#fallback-configuration)
13. [Mock Configuration](#mock-configuration)
14. [Logging Configuration](#logging-configuration)
15. [SQLite Logging Configuration](#sqlite-logging-configuration)
16. [Alert Configuration](#alert-configuration)
17. [Hot Reload Configuration](#hot-reload-configuration)
18. [Backup Configuration](#backup-configuration)
19. [Audit Configuration](#audit-configuration)
20. [Compression Configuration](#compression-configuration)

---

## Main Configuration Structure

### Config

| Parameter | Type | Required | Default | Description |
|------|------|------|--------|------|
| `baseUrl` | `string` | ✅ Required | - | API base URL, all tool paths are based on this URL |
| `tokens` | `Record<string, string>` | ❌ Optional | - | Token key-value mapping for tool reference |
| `tools` | `Record<string, ToolConfig>` | ✅ Required | - | Tool definition mapping, key is tool name |
| `auth` | `AuthConfig` | ❌ Optional | - | Global authentication configuration |
| `proxy` | `ProxyConfig` | ❌ Optional | - | Proxy configuration |
| `timeout` | `TimeoutConfig` | ❌ Optional | [See Timeout Config](#timeout-configuration) | Global timeout configuration |
| `retry` | `RetryConfig` | ❌ Optional | [See Retry Config](#retry-configuration) | Global retry configuration |
| `circuitBreaker` | `CircuitBreakerConfig` | ❌ Optional | [See Circuit Breaker Config](#circuit-breaker-configuration) | Circuit breaker configuration |
| `cache` | `CacheConfig` | ❌ Optional | [See Cache Config](#cache-configuration) | Global cache configuration |
| `rateLimit` | `RateLimitConfig` | ❌ Optional | [See Rate Limit Config](#rate-limiting-configuration) | Rate limiting configuration |
| `concurrency` | `ConcurrencyConfig` | ❌ Optional | [See Concurrency Config](#concurrency-control-configuration) | Concurrency control configuration |
| `trace` | `TraceConfig` | ❌ Optional | [See Tracing Config](#tracing-configuration) | Tracing configuration |
| `logging` | `LoggingConfig` | ❌ Optional | [See Logging Config](#logging-configuration) | Logging configuration |
| `metrics` | `MetricsConfig` | ❌ Optional | `{ enabled: true, port: 11112 }` | Metrics configuration |
| `healthCheck` | `HealthCheckConfig` | ❌ Optional | `{ enabled: true, port: 11112 }` | Health check configuration |
| `server` | `ServerConfig` | ❌ Optional | [See Server Config](#server-configuration) | Server configuration |
| `sqlite` | `SQLiteLoggingConfig` | ❌ Optional | [See SQLite Logging Config](#sqlite-logging-configuration) | SQLite logging configuration |
| `compression` | `CompressionConfig` | ❌ Optional | [See Compression Config](#compression-configuration) | Response compression configuration |
| `hotReload` | `HotReloadConfig` | ❌ Optional | [See Hot Reload Config](#hot-reload-configuration) | Hot reload configuration |
| `backup` | `BackupConfig` | ❌ Optional | [See Backup Config](#backup-configuration) | Backup configuration |
| `alert` | `EnhancedAlertConfig` | ❌ Optional | [See Alert Config](#alert-configuration) | Alert configuration |
| `audit` | `AuditConfig` | ❌ Optional | [See Audit Config](#audit-configuration) | Audit configuration |
| `mock` | `MockConfig` | ❌ Optional | `{ enabled: false }` | Mock configuration |
| `fallback` | `FallbackConfig` | ❌ Optional | [See Fallback Config](#fallback-configuration) | Fallback configuration |
| `attemptTracking` | `AttemptTrackingConfig` | ❌ Optional | `{ enabled: false, maxAttempts: 3 }` | Attempt tracking configuration |

---

## CLI Parameters

| Parameter | Type | Required | Default | Description |
|------|------|------|--------|------|
| `--config <path>` | `string` | ❌ Optional | `./tools.json` | Configuration file path |
| `--transport <mode>` | `string` | ❌ Optional | `stdio` | Transport mode: `stdio` / `sse` |
| `--sse-port <port>` | `number` | ❌ Optional | `11113` | SSE server port |
| `--http-port <port>` | `number` | ❌ Optional | `11112` | HTTP/Dashboard port |
| `--sqlite` | `boolean` | ❌ Optional | `false` | Enable SQLite logging (deprecated, use config file) |
| `--sqlite-path <path>` | `string` | ❌ Optional | `./data/logs.db` | SQLite database path (deprecated) |

---

## Server Configuration

### ServerConfig

| Parameter | Type | Required | Default | Description |
|------|------|------|--------|------|
| `transport` | `string` | ❌ Optional | `stdio` | Transport mode: `stdio` (new process per session) or `sse` (persistent connection) |
| `ssePort` | `number` | ❌ Optional | `11113` | SSE server port (used in SSE mode) |
| `httpPort` | `number` | ❌ Optional | `11112` | HTTP server port (for Dashboard/health check) |
| `ssl` | `SSLConfig` | ❌ Optional | - | SSL configuration (enable HTTPS) |

### SSLConfig

| Parameter | Type | Required | Default | Description |
|------|------|------|--------|------|
| `enabled` | `boolean` | ❌ Optional | `false` | Whether to enable SSL |
| `cert` | `string` | ✅ Required (when enabled) | - | SSL certificate file path |
| `key` | `string` | ✅ Required (when enabled) | - | SSL private key file path |

---

## Tool Configuration

### ToolConfig

| Parameter | Type | Required | Default | Description |
|------|------|------|--------|------|
| `description` | `string` | ✅ Required | - | Tool description (for LLM to understand purpose) |
| `method` | `string` | ✅ Required | - | HTTP method: `GET` / `POST` / `PUT` / `DELETE` / `PATCH` |
| `path` | `string` | ✅ Required | - | API path (supports `{param}` path parameters, or full URL) |
| `beforeDescription` | `string` | ❌ Optional | - | Tool description prefix (appended before description when returned to LLM, not shown in Dashboard) |
| `afterDescription` | `string` | ❌ Optional | - | Tool description suffix (appended after description when returned to LLM, not shown in Dashboard) |
| `token` | `string` | ❌ Optional | - | Token reference key (references key in `tokens` config) |
| `authType` | `string` | ❌ Optional | `bearer` | Authentication type: `bearer` / `basic` / `apiKey` |
| `headers` | `Record<string, string>` | ❌ Optional | - | Custom HTTP request headers (supports template placeholders) |
| `timeout` | `number` | ❌ Optional | Global `timeout.read` | Timeout override (milliseconds) |
| `retry` | `RetryConfig` | ❌ Optional | Global `retry` | Retry configuration override |
| `cache` | `CacheConfig` | ❌ Optional | Global `cache` | Cache configuration override |
| `requestTransform` | `Record<string, string>` | ❌ Optional | - | Request parameter name mapping (legacy, compatible) |
| `requestTransformConfig` | `RequestTransformConfig` | ❌ Optional | - | Request transform configuration (new, enhanced) |
| `responseTransform` | `ResponseTransformConfig` | ❌ Optional | - | Response transform configuration |
| `idempotencyKey` | `string` | ❌ Optional | - | Idempotency key request header name |
| `body` | `Record<string, ParameterDef>` | ❌ Optional | - | POST/PUT request body parameter definition |
| `queryParams` | `Record<string, ParameterDef>` | ❌ Optional | - | URL query parameter definition |
| `mock` | `MockToolConfig` | ❌ Optional | - | Mock configuration (for testing) |

### ParameterDef

| Parameter | Type | Required | Default | Description |
|------|------|------|--------|------|
| `description` | `string` | ✅ Required | - | Parameter description (for LLM to understand) |
| `type` | `string` | ✅ Required | - | Parameter type: `string` / `number` / `boolean` / `object` / `array` |
| `required` | `boolean` | ✅ Required | - | Whether the parameter is required |
| `defaultValue` | `unknown` | ❌ Optional | - | Default value (used for optional parameters) |

### RequestTransformConfig

| Parameter | Type | Required | Default | Description |
|------|------|------|--------|------|
| `template` | `string` | ❌ Optional | - | Request template (supports `{param}`, `{{expression}}`) |
| `expressions` | `Record<string, string>` | ❌ Optional | - | Expression transform mapping (key is new field name) |
| `defaultValues` | `Record<string, unknown>` | ❌ Optional | - | Default value mapping (field path → default value) |
| `rename` | `Record<string, string>` | ❌ Optional | - | Parameter name rename mapping |
| `addFields` | `Record<string, string>` | ❌ Optional | - | New field configuration (key is field name, value is expression) |

### ResponseTransformConfig

| Parameter | Type | Required | Default | Description |
|------|------|------|--------|------|
| `pick` | `string[]` | ❌ Optional | - | Included field path list (supports nested paths like `data.user.name`) |
| `rename` | `Record<string, string>` | ❌ Optional | - | Field rename mapping (supports nested paths) |
| `template` | `string` | ❌ Optional | - | Response template (supports `{param}`, `{timestamp}`) |
| `expressions` | `Record<string, string>` | ❌ Optional | - | Expression transform mapping |
| `omit` | `string[]` | ❌ Optional | - | Excluded field path list (opposite of `pick`) |
| `defaultValues` | `Record<string, unknown>` | ❌ Optional | - | Default value mapping |
| `flatten` | `boolean` | ❌ Optional | `false` | Whether to flatten nested objects |
| `flattenPrefix` | `string` | ❌ Optional | `_` | Prefix separator when flattening |

---

## Circuit Breaker Configuration

### CircuitBreakerConfig

| Parameter | Type | Required | Default | Description |
|------|------|------|--------|------|
| `enabled` | `boolean` | ✅ Required | `false` | Whether to enable circuit breaker |
| `failureThreshold` | `number` | ❌ Optional | `5` | Consecutive failure count to trigger circuit breaker |
| `successThreshold` | `number` | ❌ Optional | `2` | Consecutive success count to close circuit breaker |
| `halfOpenTime` | `number` | ❌ Optional | `30000` | Half-open state duration (milliseconds) |

**State Flow**:
- `CLOSED` → Normal state
- `OPEN` → Circuit breaker state, reject requests
- `HALF_OPEN` → Half-open state, allow少量 requests to probe recovery

---

## Cache Configuration

### CacheConfig

| Parameter | Type | Required | Default | Description |
|------|------|------|--------|------|
| `enabled` | `boolean` | ✅ Required | `false` | Whether to enable cache |
| `ttl` | `number` | ❌ Optional | `60000` | Cache validity period (milliseconds), `0` means never expire |
| `maxSize` | `number` | ❌ Optional | `1000` | Maximum cache entries |

**Note**: Cache is used for fallback backup (not query acceleration). `ttl=0` never expires, suitable for fallback scenarios.

---

## Rate Limiting Configuration

### RateLimitConfig

| Parameter | Type | Required | Default | Description |
|------|------|------|--------|------|
| `enabled` | `boolean` | ✅ Required | `false` | Whether to enable rate limiting |
| `type` | `string` | ❌ Optional | `tokenBucket` | Rate limiting algorithm: `tokenBucket` (token bucket) / `slidingWindow` (sliding window) |
| `globalLimit` | `number` | ❌ Optional | `100` | Global maximum requests per second |
| `toolLimits` | `Record<string, ToolRateLimitConfig>` | ❌ Optional | - | Tool-level rate limit configuration (higher priority than global) |

### ToolRateLimitConfig

| Parameter | Type | Required | Default | Description |
|------|------|------|--------|------|
| `limit` | `number` | ✅ Required | - | Maximum requests within time window |
| `window` | `number` | ❌ Optional | `1000` | Time window (milliseconds) |

**Algorithm Comparison**:

| Algorithm | Feature | Suitable Scenario |
|------|------|----------|
| `tokenBucket` | Allows burst traffic, smooth handling | High request fluctuation, high API tolerance |
| `slidingWindow` | Precise rate limiting, no burst | Strict rate limiting, prevent overload |

---

## Concurrency Control Configuration

### ConcurrencyConfig

| Parameter | Type | Required | Default | Description |
|------|------|------|--------|------|
| `enabled` | `boolean` | ✅ Required | `false` | Whether to enable concurrency control |
| `maxConcurrent` | `number` | ❌ Optional | `50` | Maximum concurrent requests |
| `queueSize` | `number` | ❌ Optional | `100` | Waiting queue size |
| `queueTimeout` | `number` | ❌ Optional | `30000` | Queue wait timeout (milliseconds) |

---

## Tracing Configuration

### TraceConfig

| Parameter | Type | Required | Default | Description |
|------|------|------|--------|------|
| `enabled` | `boolean` | ✅ Required | `true` | Whether to enable tracing |
| `headerName` | `string` | ❌ Optional | `X-Trace-ID` | Trace ID HTTP header name |
| `generateShort` | `boolean` | ❌ Optional | `false` | Whether to generate short ID (default uses full UUID) |
| `includeInResponse` | `boolean` | ❌ Optional | `true` | Whether to return Trace ID in response header |
| `propagateToBackend` | `boolean` | ❌ Optional | `true` | Whether to pass Trace ID to backend |

---

## Timeout Configuration

### TimeoutConfig

| Parameter | Type | Required | Default | Description |
|------|------|------|--------|------|
| `connect` | `number` | ❌ Optional | `5000` | Connection timeout (milliseconds) |
| `read` | `number` | ❌ Optional | `30000` | Read timeout (milliseconds) |
| `write` | `number` | ❌ Optional | `30000` | Write timeout (milliseconds) |

---

## Retry Configuration

### RetryConfig

| Parameter | Type | Required | Default | Description |
|------|------|------|--------|------|
| `enabled` | `boolean` | ✅ Required | `false` | Whether to enable retry |
| `maxAttempts` | `number` | ❌ Optional | `3` | Maximum retry attempts |
| `delay` | `number` | ❌ Optional | `1000` | Initial retry delay (milliseconds) |
| `backoff` | `number` | ❌ Optional | `2.0` | Backoff multiplier (each retry delay multiplied by this value) |
| `retryOn` | `number[]` | ❌ Optional | `[429, 500, 502, 503, 504]` | HTTP status codes that trigger retry |

---

## Fallback Configuration

### FallbackConfig

| Parameter | Type | Required | Default | Description |
|------|------|------|--------|------|
| `enabled` | `boolean` | ✅ Required | `true` | Whether to enable fallback |
| `useExpiredCache` | `boolean` | ❌ Optional | `true` | Use expired cache as fallback |
| `useMockAsFallback` | `boolean` | ❌ Optional | `true` | Use Mock data as fallback |

**Fallback Chain**: Request failure → Cache fallback (ignore TTL) → Mock fallback → Return error

---

## Mock Configuration

### MockConfig

| Parameter | Type | Required | Default | Description |
|------|------|------|--------|------|
| `enabled` | `boolean` | ✅ Required | `false` | Whether to enable global Mock |
| `mockData` | `Record<string, MockToolConfig>` | ❌ Optional | - | Mock configuration mapping for each tool |

### MockToolConfig

| Parameter | Type | Required | Default | Description |
|------|------|------|--------|------|
| `enabled` | `boolean` | ✅ Required | `false` | Whether to enable Mock for this tool |
| `response` | `unknown` | ❌ Optional | - | Static response data |
| `responseTemplate` | `string` | ❌ Optional | - | Dynamic response template (supports `{param}`, `{timestamp}`, `{uuid}`) |
| `dynamicConfig` | `MockDynamicConfig` | ❌ Optional | - | Dynamic data generation configuration |
| `delay` | `number` | ❌ Optional | `0` | Simulated delay (milliseconds) |
| `statusCode` | `number` | ❌ Optional | `200` | Simulated HTTP status code |
| `headers` | `Record<string, string>` | ❌ Optional | - | Simulated response headers |

### MockDynamicConfig

| Parameter | Type | Required | Default | Description |
|------|------|------|--------|------|
| `enabled` | `boolean` | ✅ Required | `false` | Whether to enable dynamic data generation |
| `fields` | `DynamicFieldConfig[]` | ✅ Required | - | Field configuration list |
| `seed` | `number` | ❌ Optional | - | Random seed (for generating reproducible data) |

### DynamicFieldConfig

| Parameter | Type | Required | Default | Description |
|------|------|------|--------|------|
| `name` | `string` | ✅ Required | - | Field name |
| `type` | `string` | ✅ Required | - | Field type: `string` / `number` / `boolean` / `date` / `array` / `object` |
| `description` | `string` | ❌ Optional | - | Field description |
| `aiHint` | `string` | ❌ Optional | - | AI semantic hint (e.g., "username" → generates Chinese name) |
| `required` | `boolean` | ❌ Optional | `false` | Whether the field is required |
| `constraints` | `DynamicFieldConstraints` | ❌ Optional | - | Field constraint rules |

---

## Logging Configuration

### LoggingConfig

| Parameter | Type | Required | Default | Description |
|------|------|------|--------|------|
| `level` | `string` | ❌ Optional | `info` | Log level: `debug` / `info` / `warn` / `error` |
| `logRequest` | `boolean` | ❌ Optional | `true` | Whether to log requests |
| `logResponse` | `boolean` | ❌ Optional | `true` | Whether to log responses |
| `logHeaders` | `boolean` | ❌ Optional | `false` | Whether to log request headers |
| `sensitiveHeaders` | `string[]` | ❌ Optional | `['authorization', 'x-api-key']` | Headers that need to be masked |
| `file` | `FileLoggingConfig` | ❌ Optional | - | File logging configuration |

### FileLoggingConfig

| Parameter | Type | Required | Default | Description |
|------|------|------|--------|------|
| `enabled` | `boolean` | ✅ Required | `false` | Whether to enable file logging |
| `dir` | `string` | ❌ Optional | `./logs` | Log file directory |
| `maxSize` | `number` | ❌ Optional | `300` | Maximum single file size (MB) |
| `rotateByMonth` | `boolean` | ❌ Optional | `true` | Whether to rotate by month |
| `logRequestBody` | `boolean` | ❌ Optional | `true` | Whether to log request body |
| `logResponseBody` | `boolean` | ❌ Optional | `true` | Whether to log response body |
| `logRequestHeaders` | `boolean` | ❌ Optional | `true` | Whether to log request headers |
| `logResponseHeaders` | `boolean` | ❌ Optional | `true` | Whether to log response headers |

---

## SQLite Logging Configuration

### SQLiteLoggingConfig

| Parameter | Type | Required | Default | Description |
|------|------|------|--------|------|
| `enabled` | `boolean` | ✅ Required | `true` | Whether to enable SQLite logging |
| `dbPath` | `string` | ❌ Optional | `./data/logs.db` | Database file path |
| `maxDays` | `number` | ❌ Optional | `30` | Log retention days |
| `batchSize` | `number` | ❌ Optional | `100` | Batch write size |
| `syncInterval` | `number` | ❌ Optional | `60000` | Statistics sync interval (milliseconds) |

---

## Alert Configuration

### EnhancedAlertConfig

| Parameter | Type | Required | Default | Description |
|------|------|------|--------|------|
| `enabled` | `boolean` | ✅ Required | `false` | Whether to enable alerts |
| `logDir` | `string` | ❌ Optional | `./logs` | Alert log directory (backward compatibility) |
| `channels` | `AlertChannelConfig[]` | ❌ Optional | `[]` | Alert notification channel list |
| `rules` | `AlertRuleConfig[]` | ❌ Optional | 5 default rules | Alert rule list |
| `templates` | `Record<string, string>` | ❌ Optional | Default templates | Alert message template mapping |
| `historyRetention` | `number` | ❌ Optional | `30` | Alert history retention days |
| `maxAlertsPerHour` | `number` | ❌ Optional | `10` | Maximum alerts per hour (prevent alert storm) |

### AlertChannelConfig

| Parameter | Type | Required | Default | Description |
|------|------|------|--------|------|
| `type` | `string` | ✅ Required | - | Channel type: `email` / `slack` / `dingtalk` / `wechat` / `webhook` |
| `enabled` | `boolean` | ✅ Required | `false` | Whether to enable this channel |
| `config` | `Record<string, unknown>` | ❌ Optional | - | Channel-specific configuration (e.g., webhook URL) |

### AlertRuleConfig

| Parameter | Type | Required | Default | Description |
|------|------|------|--------|------|
| `type` | `string` | ✅ Required | - | Rule type: `circuitBreaker` / `rateLimit` / `concurrency` / `errorRate` / `timeout` |
| `enabled` | `boolean` | ✅ Required | `true` | Whether to enable this rule |
| `threshold` | `number` | ❌ Optional | - | Trigger threshold |
| `cooldown` | `number` | ❌ Optional | `30000` | Alert cooldown time (milliseconds, prevent duplicate alerts) |
| `severity` | `string` | ❌ Optional | `warning` | Alert severity level: `critical` / `warning` / `info` |

---

## Hot Reload Configuration

### HotReloadConfig

| Parameter | Type | Required | Default | Description |
|------|------|------|--------|------|
| `enabled` | `boolean` | ✅ Required | `true` | Whether to enable hot reload |
| `watchFile` | `boolean` | ❌ Optional | `true` | Whether to watch file changes |
| `debounceMs` | `number` | ❌ Optional | `1000` | Change detection delay (milliseconds) |

---

## Backup Configuration

### BackupConfig

| Parameter | Type | Required | Default | Description |
|------|------|------|--------|------|
| `enabled` | `boolean` | ✅ Required | `true` | Whether to enable backup |
| `dir` | `string` | ❌ Optional | `./backups` | Backup directory |
| `maxVersions` | `number` | ❌ Optional | `10` | Maximum version count |
| `schedule` | `string` | ❌ Optional | `0 * * * *` | Scheduled backup Cron expression (default hourly) |

---

## Audit Configuration

### AuditConfig

| Parameter | Type | Required | Default | Description |
|------|------|------|--------|------|
| `enabled` | `boolean` | ✅ Required | `true` | Whether to enable audit logging |
| `maskSensitiveFields` | `boolean` | ❌ Optional | `true` | Whether to mask sensitive fields |

---

## Compression Configuration

### CompressionConfig

| Parameter | Type | Required | Default | Description |
|------|------|------|--------|------|
| `enabled` | `boolean` | ✅ Required | `false` | Whether to enable compression |
| `threshold` | `number` | ❌ Optional | `1024` | Compression threshold (bytes) |
| `level` | `number` | ❌ Optional | `6` | Compression level 1-9 |
| `mimeTypes` | `string[]` | ❌ Optional | `['application/json', 'text/plain', 'text/html']` | MIME types to compress |

---

## Authentication Configuration

### AuthConfig

| Parameter | Type | Required | Default | Description |
|------|------|------|--------|------|
| `type` | `string` | ✅ Required | `bearer` | Authentication type: `bearer` / `basic` / `apiKey` |
| `default` | `string` | ❌ Optional | - | Default token reference key |

---

## Proxy Configuration

### ProxyConfig

| Parameter | Type | Required | Default | Description |
|------|------|------|--------|------|
| `url` | `string` | ✅ Required | - | Proxy URL |
| `auth` | `ProxyAuth` | ❌ Optional | - | Proxy authentication |

### ProxyAuth

| Parameter | Type | Required | Default | Description |
|------|------|------|--------|------|
| `username` | `string` | ✅ Required | - | Proxy username |
| `password` | `string` | ✅ Required | - | Proxy password |

---

## Attempt Tracking Configuration

### AttemptTrackingConfig

| Parameter | Type | Required | Default | Description |
|------|------|------|--------|------|
| `enabled` | `boolean` | ✅ Required | `false` | Whether to enable attempt tracking |
| `maxAttempts` | `number` | ❌ Optional | `3` | Maximum attempt count |
| `showMetadata` | `boolean` | ❌ Optional | `true` | Whether to show metadata in failure response |

---

## Configuration Priority

| Priority | Source | Description |
|--------|------|------|
| 1 (Highest) | CLI Parameters | `--config`, `--transport`, `--sse-port` etc. |
| 2 | SQLite Database | Tool-level cache/mock configuration persistence |
| 3 | Configuration File | Configuration in `tools.json` |
| 4 (Lowest) | Default Values | Default configuration constants for each module |

**Note**: Tool-level configuration has higher priority than global configuration.

---

*Document Version: v1.0.0 | Updated: 2026-04-23*