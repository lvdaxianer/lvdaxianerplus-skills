# MCP HTTP Gateway

一个基于 MCP 协议的 HTTP 网关服务，用于将大模型（LLM）的工具调用请求转发到现有的 HTTP REST 接口。

## 功能特性

- **MCP 协议支持** - 兼容 MCP 客户端，支持 STDIO 和 SSE 两种传输模式
- **动态配置** - 通过 JSON 文件定义工具，无需修改代码
- **多种认证** - 支持 Bearer、Basic、API Key 三种认证方式
- **请求重试** - 支持指数退避重试策略
- **熔断器** - 防止故障扩散，保护后端服务
- **响应缓存** - LRU 缓存，减少重复请求
- **请求/响应转换** - 参数名称映射、字段过滤
- **监控面板** - 可视化监控面板，展示调用统计、熔断状态、缓存命中率
- **健康检查** - 提供 /health 端点检查服务状态

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

## NPM 发布配置

如果你想将包发布到自己的私有 npm 仓库，修改 `package.json`：

```json
{
  "name": "@your-org/mcp-http-gateway",
  "version": "1.0.0",
  "publishConfig": {
    "registry": "https://your-private-npm-server.com"
  }
}
```

发布命令：

```bash
# 登录私有仓库
npm login --registry=https://your-private-npm-server.com

# 发布
npm publish --registry=https://your-private-npm-server.com
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
      "body": {},
      "queryParams": {}
    }
  }
}
```

### 2. 启动服务

```bash
mcp-http-gateway --config ./tools.json
```

### 3. 在 Claude Desktop 中配置

修改 `~/.claude/settings.json`：

```json
{
  "mcpServers": {
    "http-gateway": {
      "command": "mcp-http-gateway",
      "args": ["--config", "/absolute/path/to/tools.json"]
    }
  }
}
```

或者使用 npx 方式（无需全局安装）：

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

---

## 配置详解

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
    "sensitiveHeaders": ["authorization", "x-api-key"]
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

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `level` | string | "info" | 日志级别：`debug` / `info` / `warn` / `error` |
| `logRequest` | boolean | true | 是否记录请求 |
| `logResponse` | boolean | true | 是否记录响应 |
| `logHeaders` | boolean | false | 是否记录请求头 |
| `sensitiveHeaders` | string[] | ["authorization", "x-api-key"] | 日志中需要脱敏的 header 名称 |

#### metrics / healthCheck（指标和健康检查）

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `enabled` | boolean | false | 是否启用 |
| `port` | number | 11112 | 服务端口 |

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
| `path` | string | ✅ | API 路径，支持 `{param}` 作为路径参数占位符 |
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

| 端点 | 方法 | 说明 |
|------|------|------|
| `/health` | GET | 服务健康状态 |
| `/health/ready` | GET | 就绪检查（含后端连通性） |
| `/health/live` | GET | 存活检查 |
| `/metrics` | GET | Prometheus 格式指标 |
| `/dashboard` | GET | HTML 监控面板 |
| `/api/dashboard` | GET | JSON 格式监控数据 |

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

## 示例：完整工具配置

```json
{
  "baseUrl": "https://api.example.com",
  "tokens": {
    "user-service": "sk-user-123",
    "order-service": "sk-order-456"
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
      "queryParams": {
        "includeDetail": {
          "description": "是否包含详细信息",
          "type": "boolean",
          "required": false,
          "default": false
        }
      }
    },
    "queryUsers": {
      "description": "根据条件查询用户列表",
      "method": "GET",
      "path": "/users",
      "token": "user-service",
      "queryParams": {
        "name": {
          "description": "用户名（模糊匹配）",
          "type": "string",
          "required": false
        },
        "city": {
          "description": "所在城市",
          "type": "string",
          "required": false
        },
        "page": {
          "description": "页码",
          "type": "number",
          "required": false,
          "default": 1
        },
        "pageSize": {
          "description": "每页数量",
          "type": "number",
          "required": false,
          "default": 10
        }
      }
    },
    "createOrder": {
      "description": "创建订单",
      "method": "POST",
      "path": "/order/create",
      "token": "order-service",
      "retry": {
        "enabled": true,
        "maxAttempts": 3
      },
      "body": {
        "userId": {
          "description": "用户ID",
          "type": "string",
          "required": true
        },
        "productId": {
          "description": "商品ID",
          "type": "string",
          "required": true
        },
        "quantity": {
          "description": "数量",
          "type": "number",
          "required": true
        }
      }
    }
  }
}
```

---

## 许可证

MIT
