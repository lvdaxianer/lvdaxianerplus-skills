# MCP HTTP Gateway

一个基于 MCP 协议的 HTTP 网关服务，用于将大模型（LLM）的工具调用请求转发到现有的 HTTP REST 接口。

## 功能特性

- **MCP 协议支持** - 兼容 MCP 客户端，支持 STDIO 和 SSE 两种传输模式
- **动态配置** - 通过 JSON 文件定义工具，无需修改代码
- **配置热更新** - 支持文件监听和 API 触发配置重载，无需重启服务
- **配置备份** - 自动备份配置文件，支持版本管理和恢复
- **多种认证** - 支持 Bearer、Basic、API Key 三种认证方式
- **请求重试** - 支持指数退避重试策略
- **熔断器** - 防止故障扩散，保护后端服务
- **响应缓存** - LRU 缓存，支持按工具清除，减少重复请求
- **请求/响应转换** - 参数名称映射、字段过滤
- **完整 URL 支持** - 工具 path 可使用 `http://` 或 `https://` 开头的完整 URL
- **SQLite 日志** - 请求/错误日志持久化，按天统计，Dashboard 从数据库查询
- **审计日志** - 记录调用者身份、操作链，敏感参数自动脱敏
- **告警日志** - 熔断/错误率监控，单独日志文件，支持告警解决标记
- **Mock 工具** - 开发测试阶段模拟工具响应，支持模板插值和延迟模拟
- **监控面板** - 可视化监控面板，展示调用统计、熔断状态、缓存命中率
- **健康检查** - 提供 /health 端点检查服务状态
- **优雅关闭** - 等待正在处理的请求完成后再退出

---

## 安装

### 方式一：npm 安装（推荐）

```bash
# 全局安装
npm install -g mcp-http-gateway

# 或作为项目依赖
npm install --save-dev mcp-http-gateway
```

安装后可直接使用命令：

```bash
mcp-http-gateway --config ./tools.json
```

### 方式二：从源码安装

```bash
# 克隆项目
git clone <repository-url>
cd mcp-http-gateway

# 安装依赖
npm install

# 编译
npm run build
```

---

## 快速开始

### 1. 创建配置文件

创建 `tools.json`：

```json
{
  "baseUrl": "https://api.example.com",
  "tokens": {
    "default": "your-api-token"
  },
  "tools": {
    "getUser": {
      "description": "根据ID获取用户信息",
      "method": "GET",
      "path": "/user/{userId}",
      "queryParams": {
        "userId": {
          "description": "用户ID",
          "type": "string",
          "required": true
        }
      }
    }
  }
}
```

### 2. 在 Claude Desktop 中配置

修改 `~/.claude/settings.json`：

**方式一：直接运行（需要先 build）**

```json
{
  "mcpServers": {
    "http-gateway": {
      "command": "node",
      "args": ["<项目路径>/dist/cli.js", "--config", "<配置文件路径>/tools.json"]
    }
  }
}
```

**方式二：npx 方式（无需全局安装）**

```json
{
  "mcpServers": {
    "http-gateway": {
      "command": "npx",
      "args": ["-y", "mcp-http-gateway", "--config", "/absolute/path/to/tools.json"]
    }
  }
}
```

**方式三：项目级配置 `.mcp.json`**

在项目根目录创建 `.mcp.json`：

```json
{
  "mcpServers": {
    "http-gateway": {
      "command": "node",
      "args": ["./mcp/mcp-http-gateway/dist/cli.js", "--config", "./mcp/mcp-http-gateway/tools.json"]
    }
  }
}
```

**说明**：Claude Desktop 会在需要时自动启动 MCP 服务，无需手动运行。npx 方式会自动下载包，适合不想全局安装的场景。

### 3. 本地测试（可选）

如果需要测试配置是否正确，可以手动启动：

```bash
cd mcp/mcp-http-gateway
npm run build
node dist/cli.js --config ./tools.json
```

或者启用 HTTP 监控面板进行调试：

```bash
node dist/cli.js --config ./tools.json --http
# 访问 http://localhost:11112/dashboard
```

---

## CLI 参数

| 参数 | 说明 |
|------|------|
| `--config <path>` | 指定配置文件路径（默认：./tools.json） |
| `--http` | 启用 HTTP 服务器（监控面板） |
| `--transport <mode>` | 传输模式：`stdio` / `sse` / `all`（默认：stdio） |
| `--sse-port <port>` | SSE 端口（默认：11113） |
| `--http-port <port>` | HTTP 端口（默认：11112） |

示例：

```bash
# STDIO 模式（默认）
mcp-http-gateway --config ./tools.json

# 启用 HTTP 监控面板
mcp-http-gateway --config ./tools.json --http

# SSE 远程模式
mcp-http-gateway --config ./tools.json --transport sse --sse-port 11113

# 同时启用多种模式
mcp-http-gateway --config ./tools.json --http --transport sse --sse-port 11113
```

### 优雅关闭

支持优雅关闭（Graceful Shutdown）：

- **Ctrl+C (SIGINT)**：等待正在处理的请求完成
- **SIGTERM**：同上

关闭时会：
1. 停止配置文件监听
2. 刷新 SQLite 日志缓冲区
3. 关闭数据库连接
4. 关闭文件日志

---

## 启动方式

### 完整配置示例 (tools.json)

```json
{
  "baseUrl": "https://api.example.com",

  "auth": {
    "type": "bearer",
    "default": "default-token"
  },

  "proxy": {
    "url": "http://proxy.example.com:8080",
    "auth": {
      "username": "user",
      "password": "pass"
    }
  },

  "timeout": {
    "connect": 5000,
    "read": 30000,
    "write": 30000
  },

  "retry": {
    "enabled": true,
    "maxAttempts": 3,
    "delay": 1000,
    "backoff": 2.0,
    "retryOn": [429, 500, 502, 503, 504]
  },

  "circuitBreaker": {
    "enabled": true,
    "failureThreshold": 5,
    "successThreshold": 2,
    "halfOpenTime": 30000
  },

  "cache": {
    "enabled": true,
    "ttl": 60000,
    "maxSize": 1000
  },

  "logging": {
    "level": "info",
    "logRequest": true,
    "logResponse": true,
    "logHeaders": false,
    "sensitiveHeaders": ["authorization", "x-api-key"],
    "file": {
      "enabled": true,
      "dir": "./logs",
      "maxSize": 300,
      "rotateByMonth": true,
      "logRequestBody": true,
      "logResponseBody": true
    }
  },

  "metrics": {
    "enabled": true,
    "port": 11112
  },

  "healthCheck": {
    "enabled": true,
    "port": 11112
  },

  "tokens": {
    "A": "sk-token-aaa",
    "B": "sk-token-bbb"
  },

  // 新增：SQLite 日志
  "sqlite": {
    "enabled": true,
    "dbPath": "./data/logs.db",
    "maxDays": 30
  },

  // 新增：配置热更新
  "hotReload": {
    "enabled": true,
    "watchFile": true
  },

  // 新增：配置备份
  "backup": {
    "enabled": true,
    "dir": "./backups"
  },

  // 新增：告警配置
  "alert": {
    "enabled": true,
    "errorRateThreshold": 10
  },

  // 新增：审计配置
  "audit": {
    "enabled": true
  },

  "tools": {
    "addAge": {
      "description": "添加用户年龄",
      "method": "POST",
      "path": "/user/age",
      "token": "A",
      "body": {
        "userId": {
          "description": "用户ID",
          "type": "string",
          "required": true
        },
        "age": {
          "description": "年龄（0-150）",
          "type": "number",
          "required": true
        }
      }
    }
  }
}
```

### 配置字段说明

#### 顶层配置

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `baseUrl` | string | ✅ | API 基础地址，所有工具的 path 会拼接在此后面 |
| `auth` | object | ❌ | 全局认证配置 |
| `proxy` | object | ❌ | HTTP(S) 代理配置 |
| `timeout` | object | ❌ | 全局超时配置 |
| `retry` | object | ❌ | 全局重试配置 |
| `circuitBreaker` | object | ❌ | 全局熔断器配置 |
| `cache` | object | ❌ | 全局缓存配置 |
| `logging` | object | ❌ | 日志配置 |
| `metrics` | object | ❌ | 指标监控配置 |
| `healthCheck` | object | ❌ | 健康检查配置 |
| `tokens` | object | ❌ | Token 集合，key 为名称，value 为 token 值 |
| `tools` | object | ✅ | 工具定义集合，key 为工具名 |
| `sqlite` | object | ❌ | SQLite 日志配置 |
| `mock` | object | ❌ | Mock 工具全局配置 |
| `hotReload` | object | ❌ | 配置热更新配置 |
| `backup` | object | ❌ | 配置备份配置 |
| `alert` | object | ❌ | 告警日志配置 |
| `audit` | object | ❌ | 审计日志配置 |
| `compression` | object | ❌ | 响应压缩配置 |

#### auth（认证配置）

| 字段 | 类型 | 说明 |
|------|------|------|
| `type` | string | 认证类型：`bearer` / `basic` / `apiKey` |
| `default` | string | 默认使用的 token key（引用 tokens 中的 key） |

#### proxy（代理配置）

| 字段 | 类型 | 说明 |
|------|------|------|
| `url` | string | 代理服务器地址 |
| `auth.username` | string | 代理认证用户名 |
| `auth.password` | string | 代理认证密码 |

#### timeout（超时配置）

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `connect` | number | 5000 | 连接超时（毫秒） |
| `read` | number | 30000 | 读取超时（毫秒） |
| `write` | number | 30000 | 写入超时（毫秒） |

#### retry（重试配置）

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `enabled` | boolean | false | 是否启用重试 |
| `maxAttempts` | number | 3 | 最大重试次数 |
| `delay` | number | 1000 | 初始重试延迟（毫秒） |
| `backoff` | number | 2.0 | 退避系数（指数增长） |
| `retryOn` | number[] | [429, 500-599] | 需要重试的 HTTP 状态码 |

#### circuitBreaker（熔断器配置）

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `enabled` | boolean | false | 是否启用熔断器 |
| `failureThreshold` | number | 5 | 触发熔断的连续失败次数 |
| `successThreshold` | number | 2 | 关闭熔断的连续成功次数 |
| `halfOpenTime` | number | 30000 | 熔断后尝试恢复的时间（毫秒） |

#### cache（缓存配置）

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `enabled` | boolean | false | 是否启用缓存 |
| `ttl` | number | 60000 | 缓存过期时间（毫秒） |
| `maxSize` | number | 1000 | 最大缓存条目数 |

#### logging（日志配置）

> **说明**：日志系统有两种模式：
> - **SQLite 日志**（默认开启）：结构化存储，支持 Dashboard 查询和统计分析
> - **文件日志**（可选）：JSON Lines 格式，适合调试和日志归档

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `level` | string | "info" | 日志级别：`debug` / `info` / `warn` / `error` |
| `logRequest` | boolean | true | 是否记录请求 |
| `logResponse` | boolean | true | 是否记录响应 |
| `logHeaders` | boolean | false | 是否记录请求头 |
| `sensitiveHeaders` | string[] | ["authorization", "x-api-key"] | 日志中需要脱敏的 header 名称 |
| `file` | object | 见下方 | 文件日志配置（可选） |

**file 子配置（可选）**：

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `enabled` | boolean | false | 是否启用文件日志 |
| `dir` | string | "./logs" | 日志文件目录 |
| `maxSize` | number | 300 | 单文件最大大小（MB） |
| `rotateByMonth` | boolean | true | 是否按月轮转 |
| `logRequestBody` | boolean | true | 是否记录请求体 |
| `logResponseBody` | boolean | true | 是否记录响应体 |

#### metrics / healthCheck（指标和健康检查）

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `enabled` | boolean | false | 是否启用 |
| `port` | number | 11112 | 服务端口 |

#### sqlite（SQLite 日志配置）

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `enabled` | boolean | true | 是否启用 SQLite 日志（默认开启） |
| `dbPath` | string | "./data/logs.db" | 数据库文件路径 |
| `maxDays` | number | 30 | 日志保留天数 |
| `batchSize` | number | 100 | 批量写入条数 |
| `syncInterval` | number | 60000 | 统计同步间隔（毫秒） |

#### mock（Mock 工具全局配置）

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `enabled` | boolean | false | 是否启用全局 Mock |
| `mockData` | object | {} | 各工具的 Mock 数据配置 |

#### hotReload（配置热更新配置）

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `enabled` | boolean | true | 是否启用热更新 |
| `watchFile` | boolean | true | 是否监听文件变化 |
| `debounceMs` | number | 1000 | 防抖延迟（毫秒） |

#### backup（配置备份配置）

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `enabled` | boolean | true | 是否启用备份 |
| `dir` | string | "./backups" | 备份目录 |
| `maxVersions` | number | 10 | 最大保留版本数 |
| `schedule` | string | "0 * * * *" | 定时备份 Cron 表达式 |

#### alert（告警日志配置）

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `enabled` | boolean | true | 是否启用告警日志 |
| `logDir` | string | "./logs" | 告警日志目录 |
| `errorRateThreshold` | number | 10 | 错误率告警阈值（%） |

#### audit（审计日志配置）

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `enabled` | boolean | true | 是否启用审计日志 |
| `maskSensitiveFields` | boolean | true | 是否脱敏敏感字段 |

#### compression（响应压缩配置）

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `enabled` | boolean | false | 是否启用响应压缩 |
| `threshold` | number | 1024 | 最小压缩大小（字节） |
| `level` | number | 6 | 压缩级别（1-9） |

#### tokens（Token 集合）

```json
"tokens": {
  "A": "sk-token-aaa",
  "B": "sk-token-bbb"
}
```

- **key**：自定义名称，用于在工具中引用
- **value**：实际的 token 字符串

#### tools（工具配置）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `description` | string | ✅ | 工具描述，用于大模型理解工具用途 |
| `method` | string | ✅ | HTTP 方法：`GET` / `POST` / `PUT` / `DELETE` / `PATCH` |
| `path` | string | ✅ | API 路径，支持 `{param}` 占位符，或完整 URL（`http://`/`https://`） |
| `token` | string | ❌ | 引用的 token key（对应 tokens 中的 key） |
| `authType` | string | ❌ | 认证类型：`bearer` / `basic` / `apiKey` |
| `headers` | object | ❌ | 额外的 HTTP 请求头 |
| `timeout` | number | ❌ | 覆盖全局超时配置（毫秒） |
| `retry` | object | ❌ | 覆盖全局重试配置 |
| `cache` | object | ❌ | 覆盖全局缓存配置 |
| `requestTransform` | object | ❌ | 请求参数名称映射 |
| `responseTransform` | object | ❌ | 响应转换配置 |
| `body` | object | ❌ | POST/PUT 请求体参数定义 |
| `queryParams` | object | ❌ | 查询参数定义 |
| `mock` | object | ❌ | Mock 配置（用于测试） |

##### mock（工具 Mock 配置）

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `enabled` | boolean | false | 是否启用 Mock |
| `response` | any | - | 静态返回数据 |
| `responseTemplate` | string | - | 动态模板，支持 `{param}`、`{timestamp}`、`{uuid}`、`{random}` |
| `delay` | number | 0 | 模拟延迟（毫秒） |
| `statusCode` | number | 200 | 模拟状态码 |
| `headers` | object | {} | 模拟响应头 |

##### path（路径配置说明）

- **相对路径**：拼接 baseUrl，如 `/user/{userId}`
- **完整 URL**：不拼接 baseUrl，如 `https://external-api.com/data`

```json
{
  "getUser": {
    "path": "/user/{userId}"  // 相对路径 → baseUrl/user/{userId}
  },
  "callExternal": {
    "path": "https://external-service.com/api/data"  // 完整 URL → 直接使用
  }
}

##### body / queryParams（参数定义）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `description` | string | ✅ | 参数描述 |
| `type` | string | ✅ | 参数类型：`string` / `number` / `boolean` / `object` / `array` |
| `required` | boolean | ✅ | 是否必填 |
| `default` | any | ❌ | 默认值 |

##### requestTransform（请求转换）

```json
"requestTransform": {
  "user_name": "userName",
  "create_at": "createdAt"
}
```

将请求中的 `user_name` 映射为 `userName`。

##### responseTransform（响应转换）

```json
"responseTransform": {
  "pick": ["id", "name", "age"],
  "rename": {
    "user_name": "userName"
  }
}
```

- `pick`：只返回指定字段
- `rename`：字段重命名

---

## 启动方式

### 本地启动（STDIO 模式）

适用于 Claude Desktop、MCP Inspector 等本地 MCP 客户端。

```bash
npm start
```

### HTTP 服务器模式

同时启动 STDIO 和 HTTP 服务器：

```bash
npm start -- --http
```

或

```bash
node dist/index.js --http
```

启动后可访问：
- 监控面板：`http://localhost:11112/dashboard`
- 健康检查：`http://localhost:11112/health`
- 指标数据：`http://localhost:11112/metrics`

### SSE 模式（远程连接）

适用于远程 MCP 客户端连接：

```bash
node dist/index.js --transport sse --sse-port 11113
```

### 多模式同时启动

```bash
node dist/index.js --transport stdio,sse --sse-port 11113 --http
```

| 端口 | 模式 | 说明 |
|------|------|------|
| STDIO | 标准输入输出 | 本地 MCP 客户端 |
| 11112 | HTTP | 健康检查/监控面板 |
| 11113 | SSE | 远程客户端/Studio |

### Docker 部署

```bash
# 构建镜像
docker build -t mcp-http-gateway .

# 运行
docker run -v $(pwd)/tools.json:/app/tools.json mcp-http-gateway
```

### Docker Compose

```yaml
version: '3.8'
services:
  mcp-gateway:
    build: .
    ports:
      - "11112:11112"
      - "11113:11113"
    volumes:
      - ./tools.json:/app/tools.json:ro
    restart: unless-stopped
```

---

## Claude Desktop 配置

### STDIO 模式

在 `~/.claude/settings.json` 中添加：

```json
{
  "mcpServers": {
    "http-gateway": {
      "command": "node",
      "args": ["/path/to/mcp-http-gateway/dist/index.js", "--config", "/path/to/tools.json"]
    }
  }
}
```

### SSE 模式

```json
{
  "mcpServers": {
    "http-gateway": {
      "url": "http://localhost:11113/sse"
    }
  }
}
```

---

## 监控面板

启动 HTTP 服务器后访问 `http://localhost:11112/dashboard`

面板包含：

1. **整体状态卡片** - 总请求数、成功率、错误率、平均延迟
2. **工具调用排行** - Top 10 最常调用的工具
3. **熔断器状态** - 各工具的熔断状态
4. **缓存命中率** - 缓存性能指标
5. **请求延迟分布** - p50 / p95 / p99 延迟
6. **重试统计** - 重试次数和成功率
7. **错误分布** - 按错误类型统计
8. **最近调用日志** - 最近 N 次调用详情

---

## API 端点

### 基础端点

| 端点 | 方法 | 说明 |
|------|------|------|
| `/health` | GET | 服务健康状态 |
| `/health/ready` | GET | 就绪检查（含后端连通性） |
| `/health/live` | GET | 存活检查 |
| `/metrics` | GET | Prometheus 格式指标 |
| `/dashboard` | GET | HTML 监控面板 |
| `/api/dashboard` | GET | JSON 格式监控数据 |

### 缓存管理 API

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/cache` | GET | 获取缓存统计（条目数、最大条目、TTL） |
| `/api/cache` | DELETE | 清空所有缓存 |
| `/api/cache/:toolName` | DELETE | 清除指定工具的缓存 |

### 日志查询 API

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/logs` | GET | 查询请求日志（支持 `?date=` `?tool=` `?limit=`） |
| `/api/errors` | GET | 查询错误日志（支持 `?date=` `?limit=`） |
| `/api/stats` | GET | 查询统计（支持 `?startDate=` `?endDate=`） |
| `/api/database/stats` | GET | 获取数据库统计 |

### 告警管理 API

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/alerts` | GET | 查询告警日志（支持 `?date=` `?unresolved=true`） |
| `/api/alerts/:id/resolve` | POST | 标记告警已解决 |

### 审计查询 API

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/audit` | GET | 查询审计日志（支持 `?date=` `?session=` `?startDate=` `?endDate=`） |

### 配置管理 API

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/config/backups` | GET | 列出所有备份版本 |
| `/api/config/restore/:version` | POST | 恢复指定备份版本 |

### Mock 管理 API

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/mock` | GET | 获取 Mock 配置状态 |
| `/api/mock` | POST | 设置全局 Mock 开关（`{"enabled": true}`） |

### API 使用示例

```bash
# 查询今日日志
curl http://localhost:11112/api/logs?date=2026-04-19

# 查询指定工具的日志
curl http://localhost:11112/api/logs?tool=getUser

# 清除 getUser 工具的缓存
curl -X DELETE http://localhost:11112/api/cache/getUser

# 获取未解决的告警
curl http://localhost:11112/api/alerts?unresolved=true

# 开启全局 Mock
curl -X POST http://localhost:11112/api/mock -d '{"enabled": true}'

# 查询审计报告
curl "http://localhost:11112/api/audit?startDate=2026-04-01&endDate=2026-04-19"
```

---

## 错误处理

| 错误类型 | 说明 |
|----------|------|
| 工具不存在 | `{"error": "Tool not found: {name}"}` |
| 参数缺失 | `{"error": "Missing required parameter: {param}"}` |
| 熔断器开启 | `{"error": "Circuit breaker is OPEN"}` |
| 网络错误 | `{"error": "Network error: {message}"}` |
| 请求超时 | `{"error": "Request timeout after {ms}ms"}` |

---

## 示例：完整工具配置（含新功能）

```json
{
  "baseUrl": "https://api.example.com",
  "tokens": {
    "user-service": "sk-user-123",
    "order-service": "sk-order-456"
  },
  
  // SQLite 日志配置
  "sqlite": {
    "enabled": true,
    "dbPath": "./data/logs.db",
    "maxDays": 30,
    "batchSize": 100
  },
  
  // 配置热更新
  "hotReload": {
    "enabled": true,
    "watchFile": true,
    "debounceMs": 1000
  },
  
  // 配置备份
  "backup": {
    "enabled": true,
    "dir": "./backups",
    "maxVersions": 10
  },
  
  // 告警配置
  "alert": {
    "enabled": true,
    "errorRateThreshold": 10
  },
  
  // 审计配置
  "audit": {
    "enabled": true,
    "maskSensitiveFields": true
  },
  
  // Mock 配置
  "mock": {
    "enabled": false,
    "mockData": {
      "getUser": {
        "enabled": true,
        "response": { "id": "mock-123", "name": "Mock User" },
        "delay": 100
      }
    }
  },
  
  "tools": {
    "addAge": {
      "description": "添加用户年龄信息",
      "method": "POST",
      "path": "/user/age",
      "token": "user-service",
      "body": {
        "userId": {
          "description": "用户ID",
          "type": "string",
          "required": true
        },
        "age": {
          "description": "年龄（有效值：0-150）",
          "type": "number",
          "required": true
        }
      }
    },
    "getUser": {
      "description": "根据用户ID获取用户信息",
      "method": "GET",
      "path": "/user/{userId}",
      "token": "user-service",
      // 工具级 Mock 配置
      "mock": {
        "enabled": false,
        "response": { "id": "{userId}", "name": "Mock User" }
      },
      "queryParams": {
        "includeDetail": {
          "description": "是否包含详细信息",
          "type": "boolean",
          "required": false,
          "default": false
        }
      }
    },
    // 使用完整 URL（不拼接 baseUrl）
    "callExternalService": {
      "description": "调用外部第三方服务",
      "method": "GET",
      "path": "https://external-api.com/v1/data",
      "headers": {
        "X-Api-Key": "external-service-token"
      }
    },
    // 使用模板插值的 Mock
    "createOrder": {
      "description": "创建订单（测试用 Mock）",
      "method": "POST",
      "path": "/order/create",
      "mock": {
        "enabled": true,
        "responseTemplate": "{\"orderId\": \"{uuid}", \"userId\": \"{userId}", \"status\": \"created\", \"timestamp\": \"{timestamp}\"}",
        "statusCode": 201,
        "delay": 50
      },
      "body": {
        "userId": {
          "description": "用户ID",
          "type": "string",
          "required": true
        }
      }
    }
  }
}
```

### Mock 执行机制

> **重要说明**：Mock 启用后，**不会调用真实 HTTP 接口**，直接返回 Mock 数据。

执行顺序：
1. **Mock 检查**（第一位）→ 启用则返回 Mock 响应，短路退出
2. **熔断器检查** → Mock 未启用才执行
3. **缓存检查** → Mock 未启用才执行
4. **真实 HTTP 请求** → Mock 未启用才执行

**适用场景**：
- 开发调试：无需真实后端服务
- 测试验证：模拟各种响应场景
- 性能测试：模拟延迟和错误

### Mock 模板插值

模板支持以下占位符：

| 占位符 | 说明 | 示例 |
|--------|------|------|
| `{param}` | 替换为请求参数值 | `{userId}` → `"123"` |
| `{timestamp}` | 当前 ISO 时间戳 | `"2026-04-19T10:30:00.000Z"` |
| `{uuid}` | 生成 UUID | `"550e8400-e29b-41d4-a716-..."` |
| `{random}` | 随机数 | `"8472"` |

## 许可证

MIT
