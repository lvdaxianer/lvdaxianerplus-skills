# Changelog

English | [中文](CHANGELOG.md)

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Version Strategy

> **Even versions (Stable)**: e.g., 1.0, 1.2, 2.0 — thoroughly tested, suitable for production use
> 
> **Odd versions (Fast Iteration)**: e.g., 1.1, 1.3, 2.1 — includes latest features, may have unstable factors, suitable for testing and preview

---

## [1.0.6] - 2026-04-24

### Stable Version (Feature Enhancement)

> This version adds Dual mode startup, fixes circuit breaker, SSE CORS and other issues, documentation simplified to focus on core content.

### Added

- ✨ **Dual Mode Startup**
  - Support `--transport=dual` to start both STDIO + SSE transport modes simultaneously
  - Claude Code connects via STDIO, VSCode/other tools connect via SSE at the same time
  - Port allocation: SSE port `--sse-port` (default 11114), Dashboard port `--http-port` (default 11115)

### Fixed

- 🐛 **Circuit Breaker Config Persistence**
  - Circuit breaker config persisted to SQLite database
  - Config priority: CLI params > SQLite database > Config file > Default values
  - Dashboard correctly displays circuit breaker status and failure count

- 🐛 **SSE Server CORS Support**
  - Added CORS response headers, support MCP Inspector Proxy connection
  - SSE Server listens on `0.0.0.0`, support external access

- 🐛 **Mock Call Logging**
  - Mock call success/failure logged to SQLite
  - Dashboard metrics correctly displays Mock call statistics

- 🐛 **Dual Mode HTTP Server Port Fix**
  - Dual mode correctly returns actual HTTP port used
  - Dashboard access URL correctly displayed

### Changed

- 📝 **Documentation Simplified**
  - README.md and README_CN.md simplified, focus on Dual mode and safety usage
  - Added config documentation links (CONFIG.md / CONFIG_EN.md)

---

## [1.0.5] - 2026-04-23

### Stable Version (Bug Fix Release)

> This version fixes the SSE mode Dashboard issue and updates documentation.

### Fixed

- 🐛 **Fix SSE Mode Dashboard Not Working**
  - Issue: Dashboard returns "Not found" in SSE mode
  - Cause: SSE HTTP Server only handles /sse and /message paths, Dashboard routes not registered
  - Solution: Start independent Dashboard HTTP Server in SSE mode (port = SSE port - 1)
  - Port allocation: SSE MCP port defaults to 11114, Dashboard uses 11113

### Changed

- 📝 **Documentation Updates**
  - README adds port allocation table, distinguishing STDIO and SSE modes
  - Add multiple methods to confirm actual port (console log, page badge, command line query, health check)
  - Update CLI parameters table with default values column
  - Update SSE config examples, port changed from 11113 to 11114

---

## [1.0.3] - 2026-04-23

### Stable Version (Bug Fix Release)

> This version fixes multiple critical issues and enhances user experience and stability.

### Added

- ✨ **Automatic Port Conflict Handling**
  - Detect port usage status
  - Automatically kill old node processes (same-type process cleanup)
  - Automatically try next available port (up to 10 attempts)
  - Dashboard page top shows current port badge

### Changed

- 📦 **Build Optimization**
  - Use esbuild to bundle into single CommonJS file (dist/cli.cjs)
  - Remove tsc compilation, reduce package size
  - Add shebang support for direct npx execution

- 📝 **Documentation Updates**
  - Add Dashboard usage instructions (how to view, port confirmation methods)
  - Add npm publish checklist (NPM_PUBLISH_CHECKLIST.md)
  - Fix cli.js → cli.cjs references in README

### Fixed

- 🐛 **Fix npx Execution Failure**
  - Add CLI shebang (`#!/usr/bin/env node`)
  - Remove invalid package.json fields (main, types, exports)
  - Fix import.meta unavailable in CJS format

---

## [1.0.0] - 2026-04-23

### First Official Release (Stable Version)

> This version is the first official stable release, containing the complete MCP HTTP Gateway feature set.

### Added

- ✨ **HTTP Request Forwarding**
  - Forward MCP tool calls to HTTP REST API
  - Support GET, POST, PUT, DELETE, PATCH methods
  - Path template supports `{param}` dynamic parameters
  - Request header management and Token authentication

- ✨ **Enhanced Request/Response Transform Templates**
  - Variable replacement: `{param}`, `{timestamp}`, `{uuid}`, `{random}`, `{date}`, `{now}`
  - Nested field access: `{data.user.name}`, `{items[0].id}`
  - Expression calculation: `{{value + 10}}`, `{{value * 2}}`
  - Default value syntax: `{value|default}`, `{value ?? 'default'}`
  - Date part variables: `{year}`, `{month}`, `{day}`, `{hour}`, `{minute}`, `{second}`
  - Support omit field exclusion, flatten object flattening, defaultValues default value filling

- ✨ **Tracing ID (Tracing)**
  - Generate unique Trace ID (UUID or short ID)
  - Trace ID is passed throughout request lifecycle
  - Logs include Trace ID
  - HTTP response header returns Trace ID (X-Trace-ID)
  - Pass Trace ID to backend
  - Dashboard API: `/api/trace/:id`, `/api/trace/recent`, `/api/trace/tool/:name`, `/api/trace/stats`

- ✨ **Circuit Breaker**
  - CLOSED / OPEN / HALF_OPEN state flow
  - Failure threshold configuration (failureThreshold, successThreshold)
  - Half-open state duration configuration (halfOpenTime)

- ✨ **Fallback Strategy**
  - Cache fallback (ignore TTL)
  - Mock data fallback
  - Fallback condition configuration

- ✨ **Cache Mechanism**
  - LRU cache strategy
  - TTL expiration control (supports TTL=0 never expire)
  - Tool-level cache configuration persistence
  - Cache configuration priority: CLI > SQLite > Config file > Default value

- ✨ **Mock Mode**
  - Global Mock switch
  - Tool-level Mock configuration persistence
  - Dynamic data generation (supports `{timestamp}`, `{uuid}` and other variables)
  - AI hint generation (aiHint)

- ✨ **Rate Limiting**
  - Token Bucket algorithm: allows burst traffic
  - Sliding Window algorithm: precise rate control
  - Global rate limit configuration: `rateLimit.globalLimit` (default 100/sec)
  - Tool-level rate limit configuration: `rateLimit.toolLimits` (higher priority than global)

- ✨ **Concurrency Control**
  - Maximum concurrent request limit: `concurrency.maxConcurrent` (default 50)
  - Waiting queue mechanism: requests exceeding limit enter queue to wait
  - Queue timeout configuration: `concurrency.queueTimeout` (default 30 seconds)

- ✨ **Timeout Abort**
  - AbortController forced interrupt mechanism
  - Global timeout configuration: `timeout.read` (default 30 seconds)
  - Tool-level timeout configuration (higher priority than global)

- ✨ **Attempt Tracking**
  - Global `maxAttempts` configuration (default 3 attempts)
  - Return `metadata` field on failure (attempt count, remaining attempts, suggestion)

- ✨ **Enhanced Health Check**
  - `/health` - Comprehensive health check (returns 7 component statuses)
  - `/health/detail` - Detailed component status (with more metrics)
  - `/health/ready` - K8s readiness probe
  - `/health/live` - K8s liveness probe
  - `/health/startup` - K8s startup probe
  - Check components: config, database, circuitBreakers, cache, rateLimit, concurrency, trace

- ✨ **Alert Notification**
  - Support multiple notification channels: Webhook, Slack, DingTalk, WeCom
  - Alert rules: circuit breaker state change, rate limit rejection, concurrency exceeded, error rate threshold, timeout
  - Alert cooldown mechanism: prevent duplicate alerts
  - Alert storm protection: maximum alerts per hour limit
  - Alert history records: SQLite persistence
  - Alert template support customization

- ✨ **Config Version Control**
  - Config change records: version number, change content, change time, changer
  - Config rollback: supports rollback to specified version
  - Config comparison: compare differences between versions
  - Config export: export specified version configuration
  - Config content checksum: prevent tampering

- ✨ **Canary Release**
  - Canary strategy: by percentage, by user, by tool
  - Canary status: running, paused, completed, rolled_back
  - Canary monitoring: real-time monitoring of canary effect
  - Canary rollback: quick rollback to baseline version
  - Auto rollback threshold: automatically rollback when error rate exceeds threshold

- ✨ **SQLite Logging**
  - Request logs (request_logs)
  - Response logs
  - Error logs (error_logs)
  - Audit logs (audit_logs)
  - Trace logs (trace_logs)
  - Auto cleanup: supports maxDays configuration
  - WAL mode: supports concurrent read/write

- ✨ **Dashboard Monitoring Panel**
  - Real-time statistics (success rate, Top tools)
  - Log query (pagination, filtering)
  - Configuration management (cache, mock, rate limit, concurrency)
  - Hot reload (no restart required)

- ✨ **Transport Mode**
  - STDIO mode: Claude Code automatically manages process
  - SSE mode: persistent connection, avoid port conflict (recommended)

- ✨ **Tool-level Configuration Persistence**
  - Cache configuration persistence to SQLite
  - Mock configuration persistence to SQLite
  - Configuration priority: CLI > SQLite > Config file > Default value

- 📝 **Documentation**
  - README.md: Feature overview, MCP configuration, troubleshooting
  - CONFIG.md: All configuration parameter details (type, optional, default value)
  - CHANGELOG.md: Version change records

### Fixed

- 🔧 Cache TTL=0 never expires
- 🔧 SQLite logging named parameter issue
- 🔧 SSE connection uses SSEServerTransport

---

## Links

[1.0.0]: https://github.com/lvdaxianer/lvdaxianerplus-ai/releases/tag/v1.0.0