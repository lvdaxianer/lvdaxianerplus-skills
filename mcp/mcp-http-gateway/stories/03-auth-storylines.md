# 认证模块故事线

## 故事线概览

本模块包含 10 条故事线，覆盖认证处理的核心功能。

---

## 故事线 36：Bearer Token 认证

### 故事目标
- **核心问题**：如何构建 Bearer Token 认证头
- **目标用户**：API 服务提供方
- **预期产出**：正确的 Authorization: Bearer <token> 格式

### 关键节点
1. **起点**：authType='bearer' + token 引用
2. **中间步骤**：
   - 从 tokens 中查找实际值
   - 构建 Bearer 格式
   - 添加到 Authorization 头
3. **终点**：完整的认证头

### 角色/参与者
| 角色 | 职责 | 输入 | 输出 |
|------|------|------|------|
| TokenResolver | Token 查找 | tokenRef | tokenValue |
| BearerBuilder | Bearer 构建 | tokenValue | Authorization 头 |

### 数据流转
| 节点 | 输入数据 | 输出数据 | 传递方式 |
|------|----------|----------|----------|
| Token 查找 | tokenKey | tokenValue | Map.get |
| 格式构建 | tokenValue | headerValue | 字符拼接 |
| 头添加 | headerValue | headers | Object.assign |

### 异常/边界情况
| 异常类型 | 触发条件 | 处理方式 |
|----------|----------|----------|
| Token 未找到 | tokens 无此 key | 跳过认证 |
| Token 为空 | tokenValue='' | 跳过认证 |

---

## 故事线 37：Basic 认证

### 故事目标
- **核心问题**：如何构建 Basic 认证头
- **目标用户**：API 服务提供方
- **预期产出**：正确的 Authorization: Basic <base64> 格式

### 关键节点
1. **起点**：authType='basic' + credentials
2. **中间步骤**：
   - 分离 username 和 password
   - Base64 编码
   - 构建 Basic 格式
3. **终点**：完整的认证头

### 角色/参与者
| 角色 | 职责 | 输入 | 输出 |
|------|------|------|------|
| CredentialParser | 凭证解析 | credentials | username + password |
| Base64Encoder | Base64 编码 | username:password | encodedString |

### 数据流转
| 节点 | 输入数据 | 输出数据 | 传递方式 |
|------|----------|----------|----------|
| 凭证分离 | credentials | parts | 字符分割 |
| Base64 编码 | credentialsString | encoded | Buffer.toString |
| 头构建 | encoded | header | 字符拼接 |

### 异常/边界情况
| 异常类型 | 触发条件 | 处理方式 |
|----------|----------|----------|
| 格式错误 | 无 username:password 格式 | 跳过认证 |
| 密码为空 | password='' | 编码 username: |

---

## 故事线 38：API Key 认证

### 故事目标
- **核心问题**：如何构建 API Key 认证头
- **目标用户**：API 服务提供方
- **预期产出**：正确的 X-API-Key: <key> 格式

### 关键节点
1. **起点**：authType='apiKey' + key
2. **中间步骤**：
   - 查找 API Key 值
   - 添加到 X-API-Key 头
3. **终点**：完整的认证头

### 角色/参与者
| 角色 | 职责 | 输入 | 输出 |
|------|------|------|------|
| KeyResolver | Key 查找 | keyRef | keyValue |

### 数据流转
| 节点 | 输入数据 | 输出数据 | 传递方式 |
|------|----------|----------|----------|
| Key 查找 | keyRef | keyValue | Map.get |
| 头添加 | keyValue | headers | headers['X-API-Key'] = |

### 异常/边界情况
| 异常类型 | 触发条件 | 处理方式 |
|----------|----------|----------|
| Key 未找到 | tokens 无此 key | 跳过认证 |
| Key 为空 | keyValue='' | 跳过认证 |

---

## 故事线 39：认证优先级解析

### 故事目标
- **核心问题**：如何确定认证 Token 的优先级
- **目标用户**：Executor
- **预期产出**：正确的 Token 选择

### 关键节点
1. **起点**：多个 Token 配置存在
2. **中间步骤**：
   - 检查工具级 token
   - 检查全局 default token
   - 检查第一个可用 token
3. **终点**：确定使用的 token

### 角色/参与者
| 角色 | 职责 | 输入 | 输出 |
|------|------|------|------|
| PriorityResolver | 优先级解析 | 配置 | selectedToken |

### 数据流转
| 节点 | 输入数据 | 输出数据 | 传递方式 |
|------|----------|----------|----------|
| 工具检查 | tool.token | toolToken | 直接读取 |
| 全局检查 | auth.default | defaultToken | 直接读取 |
| 首个可用 | tokens | firstToken | Object.keys[0] |

### 异常/边界情况
| 异常类型 | 触发条件 | 处理方式 |
|----------|----------|----------|
| 无 Token 配置 | tokens 为空 | 无认证 |
| 所有 Token 无效 | 所有 key 不存在 | 无认证 |

---

## 故事线 40：Token 引用解析

### 故事目标
- **核心问题**：如何解析 headers 中的 Token 引用
- **目标用户**：HTTP 客户端
- **预期产出**：实际的 Token 值

### 关键节点
1. **起点**：headers 配置包含 Token 引用
2. **中间步骤**：
   - 检测引用格式
   - 查找 tokens 映射
   - 替换引用为实际值
3. **终点**：实际的 header 值

### 角色/参与者
| 角色 | 职责 | 输入 | 输出 |
|------|------|------|------|
| ReferenceDetector | 引用检测 | headerValue | 是否引用 |
| TokenReplacer | Token 替换 | 引用 + tokens | 实际值 |

### 数据流转
| 节点 | 输入数据 | 输出数据 | 传递方式 |
|------|----------|----------|----------|
| 引用检测 | headerValue | isReference | tokens 查找 |
| 值替换 | referenceKey | actualValue | Map.get |
| 头更新 | actualValue | headers | 属性赋值 |

### 异常/边界情况
| 异常类型 | 触发条件 | 处理方式 |
|----------|----------|----------|
| 引用无效 | tokens 无此 key | 保持原值 |
| 非引用值 | 值不在 tokens 中 | 保持原值 |

---

## 故事线 41：全局认证配置

### 故事目标
- **核心问题**：如何应用全局认证配置
- **目标用户**：系统管理员
- **预期产出**：所有工具使用默认认证

### 关键节点
1. **起点**：auth.default 配置
2. **中间步骤**：
   - 读取全局 auth 配置
   - 解析 default token
   - 应用到所有工具
3. **终点**：默认认证生效

### 角色/参与者
| 角色 | 职责 | 输入 | 输出 |
|------|------|------|------|
| GlobalAuthLoader | 全局加载 | config.auth | authConfig |
| DefaultResolver | 默认解析 | auth.default | defaultToken |

### 数据流转
| 节点 | 输入数据 | 输出数据 | 传递方式 |
|------|----------|----------|----------|
| 配置读取 | config.auth | authConfig | 直接读取 |
| 默认解析 | auth.default | defaultKey | 直接读取 |
| Token 查找 | defaultKey | defaultToken | tokens.get |

### 异常/边界情况
| 异常类型 | 触发条件 | 处理方式 |
|----------|----------|----------|
| 无 auth 配置 | auth 未定义 | 无默认认证 |
| 无 default | default 未定义 | 使用首个 token |

---

## 故事线 42：工具级认证覆盖

### 故事目标
- **核心问题**：如何让工具覆盖全局认证
- **目标用户**：特殊认证需求的工具
- **预期产出**：工具使用特定认证

### 关键节点
1. **起点**：工具定义 token 字段
2. **中间步骤**：
   - 检查 tool.token
   - 解析工具级 authType
   - 覆盖全局认证
3. **终点**：工具使用特定认证

### 角色/参与者
| 角色 | 职责 | 输入 | 输出 |
|------|------|------|------|
| ToolAuthResolver | 工具认证解析 | tool.auth | 工具认证 |

### 数据流转
| 节点 | 输入数据 | 输出数据 | 传递方式 |
|------|----------|----------|----------|
| Token 检查 | tool.token | toolToken | 直接读取 |
| 类型检查 | tool.authType | toolAuthType | 直接读取 |
| 认证构建 | toolToken, toolAuthType | authHeader | 认证函数 |

### 异常/边界情况
| 异常类型 | 触发条件 | 处理方式 |
|----------|----------|----------|
| 无工具认证 | tool 无 token/authType | 使用全局 |
| Token 引用无效 | tokens 无此 key | 使用全局 |

---

## 故事线 43：多 Token 管理

### 故事目标
- **核心问题**：如何管理多个 Token 配置
- **目标用户**：系统管理员
- **预期产出**：Token 安全存储和引用

### 关键节点
1. **起点**：tokens 配置对象
2. **中间步骤**：
   - 存储 Token 键值对
   - 提供 Token 查找
   - 支持 Token 更新
3. **终点**：Token 管理完成

### 角色/参与者
| 角色 | 职责 | 输入 | 输出 |
|------|------|------|------|
| TokenStore | Token 存储 | config.tokens | 存储对象 |
| TokenLookup | Token 查找 | key | value |

### 数据流转
| 节点 | 输入数据 | 输出数据 | 传递方式 |
|------|----------|----------|----------|
| 存储初始化 | tokens | tokenMap | Map 初始化 |
| Token 查找 | key | value | Map.get |
| Token 更新 | key, value | 更新结果 | Map.set |

### 异常/边界情况
| 异常类型 | 触发条件 | 处理方式 |
|----------|----------|----------|
| Token 不存在 | key 无对应值 | 返回 undefined |
| Token 格式错误 | value 非字符串 | 转换为字符串 |

---

## 故事线 44：敏感信息脱敏

### 故事目标
- **核心问题**：如何在日志中脱敏认证信息
- **目标用户**：运维人员
- **预期产出**：安全的日志输出

### 关键节点
1. **起点**：headers 包含认证信息
2. **中间步骤**：
   - 识别敏感头（authorization, x-api-key）
   - 替换为 [REDACTED]
   - 输出脱敏日志
3. **终点**：安全日志

### 角色/参与者
| 角色 | 职责 | 输入 | 输出 |
|------|------|------|------|
| SensitiveDetector | 敏感检测 | headers | 敏感字段列表 |
| MaskApplier | 脱敏应用 | sensitiveHeaders | 脱敏头 |

### 数据流转
| 节点 | 输入数据 | 输出数据 | 传递方式 |
|------|----------|----------|----------|
| 检测 | headers | sensitiveKeys | 配置匹配 |
| 替换 | sensitiveKeys | maskedHeaders | 值替换 |

### 异常/边界情况
| 异常类型 | 触发条件 | 处理方式 |
|----------|----------|----------|
| 无敏感配置 | sensitiveHeaders=[] | 不脱敏 |
| 头不存在 | headers 无此 key | 跳过 |

---

## 故事线 45：认证失败处理

### 故事目标
- **核心问题**：如何处理认证失败的响应
- **目标用户**：LLM 客户端
- **预期产出**：清晰的认证错误消息

### 关键节点
1. **起点**：HTTP 401/403 响应
2. **中间步骤**：
   - 检查状态码
   - 识别认证错误类型
   - 构建错误消息
   - 记录日志
3. **终点**：返回认证错误

### 角色/参与者
| 角色 | 职责 | 输入 | 输出 |
|------|------|------|------|
| AuthErrorDetector | 认证错误检测 | statusCode | 错误类型 |
| AuthErrorMessage | 错误消息构建 | 错误类型 | 用户消息 |

### 数据流转
| 节点 | 输入数据 | 输出数据 | 传递方式 |
|------|----------|----------|----------|
| 状态检测 | statusCode | authError | 比较运算 |
| 类型识别 | authError | errorType | 条件判断 |
| 消息构建 | errorType | message | 字符拼接 |

### 异常/边界情况
| 异常类型 | 触发条件 | 处理方式 |
|----------|----------|----------|
| 401 Unauthorized | 认证无效 | 提示检查 Token |
| 403 Forbidden | 权限不足 | 提示权限问题 |

---

*Generated by 故事线技能 | Date: 2026-04-19*