# Tool Executor 模块故事线

## 故事线概览

本模块包含 20 条故事线，覆盖 HTTP 请求执行的核心流程。

---

## 故事线 16：全局 Mock 检查

### 故事目标
- **核心问题**：如何在全局 Mock 模式下快速返回 Mock 数据
- **目标用户**：测试人员
- **预期产出**：快速 Mock 响应，无需真实调用

### 关键节点
1. **起点**：收到工具调用请求
2. **中间步骤**：
   - 检查 globalMockEnabled 标志
   - 检查工具级 mock.enabled
   - 执行 Mock 生成
   - 返回 Mock 数据
3. **终点**：返回 Mock 响应

### 角色/参与者
| 角色 | 职责 | 输入 | 输出 |
|------|------|------|------|
| MockChecker | Mock 检查 | 工具名 | Mock 状态 |
| MockExecutor | Mock 执行 | Mock 配置 | Mock 数据 |

### 数据流转
| 节点 | 输入数据 | 输出数据 | 传递方式 |
|------|----------|----------|----------|
| 全局检查 | config.mock.enabled | boolean | 直接读取 |
| 工具检查 | tool.mock.enabled | boolean | 直接读取 |
| Mock 执行 | mockConfig | 模拟数据 | generateMockResponse |

### 异常/边界情况
| 异常类型 | 触发条件 | 处理方式 |
|----------|----------|----------|
| 无 Mock 配置 | mock 未定义 | 继续真实调用 |
| Mock 生成失败 | dynamicConfig 错误 | 返回默认 Mock |

---

## 故事线 17：熔断器状态检查

### 故事目标
- **核心问题**：如何检查熔断器状态，决定是否允许请求
- **目标用户**：系统管理员
- **预期产出**：OPEN 状态触发回退链

### 关键节点
1. **起点**：准备执行真实调用
2. **中间步骤**：
   - 检查 circuitBreaker.enabled
   - 查询工具熔断器状态
   - OPEN 状态触发回退
   - HALF_OPEN 允许尝试
3. **终点**：决定是否继续调用

### 角色/参与者
| 角色 | 职责 | 输入 | 输出 |
|------|------|------|------|
| CircuitChecker | 状态检查 | 工具名 | 状态值 |
| FallbackTrigger | 回退触发 | OPEN 状态 | 回退链调用 |

### 数据流转
| 节点 | 输入数据 | 输出数据 | 传递方式 |
|------|----------|----------|----------|
| 状态查询 | toolName | state | checkCircuitBreaker |
| 决策判断 | state | action | switch/case |
| 回退触发 | OPEN | fallbackChain | 函数调用 |

### 异常/边界情况
| 异常类型 | 触发条件 | 处理方式 |
|----------|----------|----------|
| 熔断器禁用 | enabled=false | 跳过检查 |
| 状态未知 | 状态值异常 | 默认 CLOSED |

---

## 故事线 18：真实服务调用

### 故事目标
- **核心问题**：如何发起真实的 HTTP API 调用
- **目标用户**：API 服务提供方
- **预期产出**：HTTP 响应数据

### 关键节点
1. **起点**：熔断器检查通过
2. **中间步骤**：
   - 构建 URL
   - 解析认证
   - 添加请求头
   - 构建请求体
   - 发送 HTTP 请求
   - 解析响应
3. **终点**：返回响应数据

### 角色/参与者
| 角色 | 职责 | 输入 | 输出 |
|------|------|------|------|
| UrlBuilder | URL 构建 | baseUrl + path + params | 完整 URL |
| AuthResolver | 认证解析 | token 引用 | 实际 token |
| HttpClient | HTTP 请求 | 请求配置 | HTTP 响应 |
| ResponseParser | 响应解析 | HTTP body | 数据对象 |

### 数据流转
| 节点 | 输入数据 | 输出数据 | 传递方式 |
|------|----------|----------|----------|
| URL 构建 | baseUrl, path, params | URL | 字符拼接 |
| 认证解析 | tokenRef | authHeader | Map 查找 |
| 请求发送 | config | response | fetch |
| 响应解析 | body | data | JSON.parse |

### 异常/边界情况
| 异常类型 | 触发条件 | 处理方式 |
|----------|----------|----------|
| 网络超时 | timeout | 触发回退链 |
| DNS 解析失败 | hostname 错误 | 触发回退链 |
| 连接拒绝 | ECONNREFUSED | 触发回退链 |

---

## 故事线 19：缓存数据作为回退

### 故事目标
- **核心问题**：如何使用缓存数据作为服务降级的回退
- **目标用户**：服务使用者
- **预期产出**：过期缓存仍可使用的回退数据

### 关键节点
1. **起点**：真实调用失败
2. **中间步骤**：
   - 检查 fallback.enabled
   - 检查 useExpiredCache
   - 查询缓存（忽略 TTL）
   - 返回缓存数据
3. **终点**：返回 fallback_cache 响应

### 角色/参与者
| 角色 | 职责 | 输入 | 输出 |
|------|------|------|------|
| FallbackChecker | 回退检查 | fallbackConfig | 是否启用 |
| CacheFallback | 缓存回退 | toolName + args | 缓存数据 |

### 数据流转
| 节点 | 输入数据 | 输出数据 | 传递方式 |
|------|----------|----------|----------|
| 配置检查 | config.fallback | enabled | 直接读取 |
| 缓存查询 | toolName, args | cachedData | getCachedResponseForFallback |
| 来源标记 | 来源 | source='fallback_cache' | 结果构建 |

### 异常/边界情况
| 异常类型 | 触发条件 | 处理方式 |
|----------|----------|----------|
| 无缓存数据 | cache miss | 继续到 Mock 回退 |
| 缓存禁用 | cache.enabled=false | 继续到 Mock 回退 |

---

## 故事线 20：Mock 数据作为回退

### 故事目标
- **核心问题**：如何使用 Mock 数据作为最后的回退手段
- **目标用户**：服务使用者
- **预期产出**：静态 Mock 数据作为最终回退

### 关键节点
1. **起点**：缓存回退失败
2. **中间步骤**：
   - 检查 useMockAsFallback
   - 检查工具是否有静态 Mock
   - 执行 Mock 回退
   - 返回 Mock 数据
3. **终点**：返回 fallback_mock 响应

### 角色/参与者
| 角色 | 职责 | 输入 | 输出 |
|------|------|------|------|
| MockFallbackChecker | Mock 回退检查 | tool.mock | 是否可用 |
| MockFallbackExecutor | Mock 回退执行 | mockConfig | Mock 数据 |

### 数据流转
| 节点 | 输入数据 | 输出数据 | 传递方式 |
|------|----------|----------|----------|
| 配置检查 | useMockAsFallback | enabled | 直接读取 |
| Mock 可用性检查 | mock.response | 是否可用 | canUseMockAsFallback |
| Mock 执行 | mockConfig | mockData | executeMockFallback |

### 异常/边界情况
| 异常类型 | 触发条件 | 处理方式 |
|----------|----------|----------|
| 无 Mock 配置 | mock.response 缺失 | 返回错误 |
| Mock 禁用 | useMockAsFallback=false | 返回错误 |

---

## 故事线 21：错误返回

### 故事目标
- **核心问题**：当所有回退都失败时如何返回错误
- **目标用户**：LLM 客户端
- **预期产出**：清晰的错误消息和原因

### 关键节点
1. **起点**：缓存和 Mock 都不可用
2. **中间步骤**：
   - 构建错误消息
   - 包含原始错误原因
   - 包含回退尝试记录
   - 返回 error 响应
3. **终点**：返回详细错误信息

### 角色/参与者
| 角色 | 职责 | 输入 | 输出 |
|------|------|------|------|
| ErrorBuilder | 错误构建 | 原始错误 + 回退原因 | 错误消息 |

### 数据流转
| 节点 | 输入数据 | 输出数据 | 传递方式 |
|------|----------|----------|----------|
| 消息构建 | error, fallbackReason | message | 字符拼接 |
| 来源标记 | 来源 | source='error' | 结果构建 |
| 日志记录 | 错误信息 | logEntry | logger.error |

### 异常/边界情况
| 异常类型 | 触发条件 | 处理方式 |
|----------|----------|----------|
| 未知错误类型 | error 不是 Error | 默认消息 |
| 部分回退成功 | 某个回退部分成功 | 返回部分数据 |

---

## 故事线 22：成功响应缓存

### 故事目标
- **核心问题**：如何缓存成功的 GET 响应供回退使用
- **目标用户**：系统自身
- **预期产出**：缓存的数据供后续回退

### 关键节点
1. **起点**：真实调用成功
2. **中间步骤**：
   - 检查是否 GET 请求
   - 检查响应状态码
   - 检查缓存是否启用
   - 存储响应数据
3. **终点**：缓存存储完成

### 角色/参与者
| 角色 | 职责 | 输入 | 输出 |
|------|------|------|------|
| CacheDecider | 缓存决策 | method + status | 是否缓存 |
| CacheStorer | 缓存存储 | data | 缓存条目 |

### 数据流转
| 节点 | 输入数据 | 输出数据 | 传递方式 |
|------|----------|----------|----------|
| 方法检查 | method | isGet | 条件判断 |
| 状态检查 | statusCode | isSuccess | 比较运算 |
| 数据存储 | responseData | cacheEntry | cacheResponse |

### 异常/边界情况
| 异常类型 | 触发条件 | 处理方式 |
|----------|----------|----------|
| POST 请求 | method 不是 GET | 不缓存 |
| 错误响应 | status >= 400 | 不缓存 |

---

## 故事线 23：请求参数分离

### 故事目标
- **核心问题**：如何分离路径参数、查询参数和 Body 参数
- **目标用户**：HTTP 客户端
- **预期产出**：正确分离的参数集合

### 关键节点
1. **起点**：arguments 对象
2. **中间步骤**：
   - 提取路径参数名（{param}）
   - 分离路径参数值
   - 分离查询参数值
   - 分离 Body 参数值
3. **终点**：三类参数分别输出

### 角色/参与者
| 角色 | 职责 | 输入 | 输出 |
|------|------|------|------|
| PathParamExtractor | 路径提取 | path + args | pathParams |
| QueryParamExtractor | 查询提取 | queryParams + args | queryParams |
| BodyParamExtractor | Body 提取 | body + args | bodyParams |

### 数据流转
| 节点 | 输入数据 | 输出数据 | 传递方式 |
|------|----------|----------|----------|
| 路径参数名提取 | path | paramNames | 正则匹配 |
| 路径值提取 | args, paramNames | pathParams | Map 查找 |
| 查询值提取 | args, queryParams | queryParams | 遍历提取 |

### 异常/边界情况
| 异常类型 | 触发条件 | 处理方式 |
|----------|----------|----------|
| 缺失路径参数 | required 参数未提供 | 使用默认值或报错 |
| 参数类型不匹配 | type 不一致 | 类型转换 |

---

## 故事线 24：请求体构建

### 故事目标
- **核心问题**：如何根据 body 配置构建请求体
- **目标用户**：HTTP 客户端
- **预期产出**：正确格式化的 JSON 请求体

### 关键节点
1. **起点**：body 配置 + arguments
2. **中间步骤**：
   - 遍历 body 字段定义
   - 从 arguments 提取值
   - 应用默认值
   - JSON 序列化
3. **终点**：请求体字符串

### 角色/参与者
| 角色 | 职责 | 输入 | 输出 |
|------|------|------|------|
| BodyBuilder | Body 构建 | bodyConfig + args | bodyObject |
| JsonSerializer | JSON 序列化 | bodyObject | bodyString |

### 数据流转
| 节点 | 输入数据 | 输出数据 | 传递方式 |
|------|----------|----------|----------|
| 字段遍历 | body.fields | fieldValues | forEach |
| 值提取 | args, fieldName | fieldValue | Map 查找 |
| 默认值应用 | defaultValue | appliedValue | 条件赋值 |
| JSON 序列化 | bodyObject | bodyString | JSON.stringify |

### 异常/边界情况
| 异常类型 | 触发条件 | 处理方式 |
|----------|----------|----------|
| 缺失必填字段 | required 未提供 | 返回错误 |
| 无效 JSON | 序列化失败 | 返回错误 |

---

## 故事线 25：认证头构建

### 故事目标
- **核心问题**：如何根据认证配置构建 Authorization 头
- **目标用户**：API 服务提供方
- **预期产出**：正确的认证头格式

### 关键节点
1. **起点**：auth 配置 + token 引用
2. **中间步骤**：
   - 解析 authType（bearer/basic/apiKey）
   - 查找实际 token 值
   - 构建 Authorization 头
   - 添加到 headers
3. **终点**：完整的认证头

### 角色/参与者
| 角色 | 职责 | 输入 | 输出 |
|------|------|------|------|
| TokenTypeResolver | 类型解析 | authType | 认证格式 |
| TokenValueResolver | 值解析 | tokenRef | 实际 token |
| AuthHeaderBuilder | 头构建 | type + value | Authorization 头 |

### 数据流转
| 节点 | 输入数据 | 输出数据 | 传递方式 |
|------|----------|----------|----------|
| 类型识别 | authType | format | switch/case |
| 值查找 | token, tokens | tokenValue | Map 查找 |
| 头构建 | type, value | header | 字符拼接 |

### 异常/边界情况
| 异常类型 | 触发条件 | 处理方式 |
|----------|----------|----------|
| Token 未找到 | tokens 无此 key | 跳过认证 |
| 认证类型未知 | authType 无效 | 默认 bearer |

---

## 故事线 26：请求头合并

### 故事目标
- **核心问题**：如何合并工具自定义头和认证头
- **目标用户**：HTTP 客户端
- **预期产出**：完整的请求头集合

### 关键节点
1. **起点**：认证头 + 工具自定义头
2. **中间步骤**：
   - 添加基础 Content-Type
   - 合并认证头
   - 合并自定义头
   - 处理 Token 引用
3. **终点**：完整的 headers 对象

### 角色/参与者
| 角色 | 职责 | 输入 | 输出 |
|------|------|------|------|
| HeaderMerger | 头合并 | baseHeaders + customHeaders | 合并头 |
| TokenResolver | Token 解析 | header 值引用 | 实际值 |

### 数据流转
| 节点 | 输入数据 | 输出数据 | 传递方式 |
|------|----------|----------|----------|
| 基础头添加 | Content-Type | headers | Object.assign |
| 认证头添加 | Authorization | headers | Object.assign |
| 自定义头添加 | tool.headers | headers | 遍历添加 |
| Token 解析 | 引用值 | 实际值 | tokens 查找 |

### 异常/边界情况
| 异常类型 | 触发条件 | 处理方式 |
|----------|----------|----------|
| 头冲突 | 同名头不同值 | 工具头优先 |
| Token 引用无效 | 无此 token | 保持原值 |

---

## 故事线 27：超时配置应用

### 故事目标
- **核心问题**：如何应用超时配置到 HTTP 请求
- **目标用户**：HTTP 客户端
- **预期产出**：正确的超时设置

### 关键节点
1. **起点**：timeout 配置
2. **中间步骤**：
   - 获取全局超时配置
   - 获取工具级超时覆盖
   - 计算最终超时值
   - 应用到 HTTP 客户端
3. **终点**：超时设置生效

### 角色/参与者
| 角色 | 职责 | 输入 | 输出 |
|------|------|------|------|
| TimeoutResolver | 超时解析 | globalTimeout + toolTimeout | 最终超时 |
| HttpClientConfig | 客户端配置 | timeout | 配置对象 |

### 数据流转
| 节点 | 输入数据 | 输出数据 | 传递方式 |
|------|----------|----------|----------|
| 全局获取 | config.timeout | globalTimeout | 直接读取 |
| 工具获取 | tool.timeout | toolTimeout | 直接读取 |
| 值选择 | global, tool | finalTimeout | 条件选择 |
| 配置应用 | timeout | httpClient | 构造参数 |

### 异常/边界情况
| 异常类型 | 触发条件 | 处理方式 |
|----------|----------|----------|
| 无配置 | timeout 未定义 | 使用默认 30s |
| 非法值 | timeout <= 0 | 使用默认值 |

---

## 故事线 28：重试策略执行

### 故事目标
- **核心问题**：如何在失败时执行重试策略
- **目标用户**：HTTP 客户端
- **预期产出**：重试后的最终结果

### 关键节点
1. **起点**：HTTP 请求失败
2. **中间步骤**：
   - 检查 retry.enabled
   - 检查状态码是否在 retryOn 中
   - 计算重试次数和延迟
   - 执行重试请求
3. **终点**：返回最终结果

### 角色/参与者
| 角色 | 职责 | 输入 | 输出 |
|------|------|------|------|
| RetryDecider | 重试决策 | statusCode + retryConfig | 是否重试 |
| RetryExecutor | 重试执行 | 请求函数 | 最终结果 |
| BackoffCalculator | 退避计算 | delay + backoff | 下一延迟 |

### 数据流转
| 节点 | 输入数据 | 输出数据 | 传递方式 |
|------|----------|----------|----------|
| 状态检查 | statusCode | shouldRetry | includes 检查 |
| 次数检查 | attempt | remaining | 比较运算 |
| 退避计算 | delay, backoff | nextDelay | delay * backoff |
| 请求重试 | requestFn | result | 函数调用 |

### 异常/边界情况
| 异常类型 | 触发条件 | 处理方式 |
|----------|----------|----------|
| 重试次数耗尽 | attempt >= maxAttempts | 返回失败 |
| 不重试状态 | status 不在 retryOn | 返回失败 |

---

## 故事线 29：响应解析

### 故事目标
- **核心问题**：如何解析 HTTP 响应体
- **目标用户**：Executor
- **预期产出**：解析后的数据对象

### 关键节点
1. **起点**：HTTP 响应 body
2. **中间步骤**：
   - 检查 body 是否存在
   - 尝试 JSON 解析
   - 处理解析失败
   - 返回数据
3. **终点**：数据对象

### 角色/参与者
| 角色 | 职责 | 输入 | 输出 |
|------|------|------|------|
| BodyChecker | Body 检查 | response.body | 是否存在 |
| JsonParser | JSON 解析 | bodyString | dataObject |

### 数据流转
| 节点 | 输入数据 | 输出数据 | 传递方式 |
|------|----------|----------|----------|
| 存在检查 | body | hasBody | 条件判断 |
| JSON 解析 | body | data | JSON.parse |
| 失败处理 | parse error | rawBody | 返回原值 |

### 异常/边界情况
| 异常类型 | 触发条件 | 处理方式 |
|----------|----------|----------|
| 空响应 | body 为空 | 返回 undefined |
| 非 JSON | JSON.parse 失败 | 返回原始字符串 |

---

## 故事线 30：响应转换

### 故事目标
- **核心问题**：如何根据 responseTransform 配置转换响应
- **目标用户**：LLM 客户端
- **预期产出**：转换后的响应数据

### 关键节点
1. **起点**：原始响应数据
2. **中间步骤**：
   - 检查 responseTransform 配置
   - 应用 pick 字段筛选
   - 应用 rename 字段重命名
   - 返回转换后数据
3. **终点**：转换后的数据

### 角色/参与者
| 角色 | 职责 | 输入 | 输出 |
|------|------|------|------|
| PickApplier | 字段筛选 | data + pick | 筛选数据 |
| RenameApplier | 字段重命名 | data + rename | 重命名数据 |

### 数据流转
| 节点 | 输入数据 | 输出数据 | 传递方式 |
|------|----------|----------|----------|
| 配置检查 | responseTransform | hasTransform | 条件判断 |
| 字段筛选 | data, pick | filteredData | 遍历提取 |
| 字段重命名 | data, rename | renamedData | 键名替换 |

### 异常/边界情况
| 异常类型 | 触发条件 | 处理方式 |
|----------|----------|----------|
| 字段不存在 | pick 字段缺失 | 跳过该字段 |
| 嵌套对象 | pick 包含嵌套路径 | 递归处理 |

---

## 故事线 31：熔断器成功记录

### 故事目标
- **核心问题**：如何在成功后记录熔断器状态
- **目标用户**：熔断器管理
- **预期产出**：更新熔断器为 CLOSED 状态

### 关键节点
1. **起点**：HTTP 请求成功
2. **中间步骤**：
   - 检查 circuitBreaker.enabled
   - 调用 recordSuccess
   - 更新成功计数
   - 检查是否需要状态转换
3. **终点**：熔断器状态更新

### 角色/参与者
| 角色 | 职责 | 输入 | 输出 |
|------|------|------|------|
| SuccessRecorder | 成功记录 | toolName | 成功计数 |
| StateTransitioner | 状态转换 | 计数 | 新状态 |

### 数据流转
| 节点 | 输入数据 | 输出数据 | 传递方式 |
|------|----------|----------|----------|
| 记录调用 | toolName | successCount | recordSuccess |
| 阈值检查 | count, threshold | shouldTransition | 比较运算 |
| 状态转换 | HALF_OPEN | CLOSED | setState |

### 异常/边界情况
| 异常类型 | 触发条件 | 处理方式 |
|----------|----------|----------|
| 熔断器禁用 | enabled=false | 跳过记录 |
| 非 HALF_OPEN | 其他状态 | 保持状态 |

---

## 故事线 32：熔断器失败记录

### 故事目标
- **核心问题**：如何在失败后记录熔断器状态
- **目标用户**：熔断器管理
- **预期产出**：更新熔断器失败计数或转为 OPEN

### 关键节点
1. **起点**：HTTP 请求失败
2. **中间步骤**：
   - 检查 circuitBreaker.enabled
   - 调用 recordFailure
   - 更新失败计数
   - 检查是否触发 OPEN
3. **终点**：熔断器状态更新

### 角色/参与者
| 角色 | 职责 | 输入 | 输出 |
|------|------|------|------|
| FailureRecorder | 失败记录 | toolName | 失败计数 |
| StateTransitioner | 状态转换 | 计数 | 新状态 |

### 数据流转
| 节点 | 输入数据 | 输出数据 | 传递方式 |
|------|----------|----------|----------|
| 记录调用 | toolName | failureCount | recordFailure |
| 阈值检查 | count, threshold | shouldTransition | 比较运算 |
| 状态转换 | CLOSED | OPEN | setState |

### 异常/边界情况
| 异常类型 | 触发条件 | 处理方式 |
|----------|----------|----------|
| 熔断器禁用 | enabled=false | 跳过记录 |
| 已是 OPEN | 当前 OPEN | 保持状态 |

---

## 故事线 33：请求日志记录

### 故事目标
- **核心问题**：如何记录请求详情到日志
- **目标用户**：运维人员
- **预期产出**：完整的请求日志条目

### 关键节点
1. **起点**：HTTP 请求发送前
2. **中间步骤**：
   - 记录工具名、方法、URL
   - 记录请求头（脱敏）
   - 记录请求体
   - 记录时间戳
3. **终点**：日志条目写入

### 角色/参与者
| 角色 | 职责 | 输入 | 输出 |
|------|------|------|------|
| RequestLogger | 请求日志 | 请求信息 | 日志条目 |
| HeaderSanitizer | 头脱敏 | headers | 脱敏头 |
| LoggerWriter | 日志写入 | 日志条目 | 写入结果 |

### 数据流转
| 节点 | 输入数据 | 输出数据 | 传递方式 |
|------|----------|----------|----------|
| 信息收集 | request | logData | 对象构建 |
| 头脱敏 | headers | maskedHeaders | 字段替换 |
| 日志写入 | logData | writeResult | logger.info |

### 异常/边界情况
| 异常类型 | 触发条件 | 处理方式 |
|----------|----------|----------|
| 日志禁用 | logRequest=false | 跳过记录 |
| 请求体大 | body 超限 | 截断记录 |

---

## 故事线 34：响应日志记录

### 故事目标
- **核心问题**：如何记录响应详情到日志
- **目标用户**：运维人员
- **预期产出**：完整的响应日志条目

### 关键节点
1. **起点**：HTTP 响应返回后
2. **中间步骤**：
   - 记录状态码、耗时
   - 记录响应体
   - 记录响应头
   - 写入日志
3. **终点**：日志条目写入

### 角色/参与者
| 角色 | 职责 | 输入 | 输出 |
|------|------|------|------|
| ResponseLogger | 响应日志 | 响应信息 | 日志条目 |
| DurationCalculator | 耗时计算 | startTime | duration |

### 数据流转
| 节点 | 输入数据 | 输出数据 | 传递方式 |
|------|----------|----------|----------|
| 耗时计算 | startTime, now | duration | 时间差 |
| 信息收集 | response | logData | 对象构建 |
| 日志写入 | logData | writeResult | logger.info |

### 异常/边界情况
| 异常类型 | 触发条件 | 处理方式 |
|----------|----------|----------|
| 日志禁用 | logResponse=false | 跳过记录 |
| 响应体大 | body 超限 | 截断记录 |

---

## 故事线 35：错误日志记录

### 故事目标
- **核心问题**：如何记录错误详情到日志
- **目标用户**：运维人员、开发人员
- **预期产出**：详细的错误日志条目

### 关键节点
1. **起点**：请求执行失败
2. **中间步骤**：
   - 记录错误类型
   - 记录错误消息
   - 记录错误堆栈
   - 记录上下文信息
3. **终点**：错误日志写入

### 角色/参与者
| 角色 | 职责 | 输入 | 输出 |
|------|------|------|------|
| ErrorLogger | 错误日志 | Error 对象 | 日志条目 |
| StackExtractor | 堆栈提取 | Error | stack 字符串 |

### 数据流转
| 节点 | 输入数据 | 输出数据 | 传递方式 |
|------|----------|----------|----------|
| 类型识别 | Error | errorType | instanceof |
| 消息提取 | Error | message | 属性读取 |
| 堆栈提取 | Error | stack | 属性读取 |
| 日志写入 | logData | writeResult | logger.error |

### 异常/边界情况
| 异常类型 | 触发条件 | 处理方式 |
|----------|----------|----------|
| 非 Error 对象 | error 无 message | 默认消息 |
| 堆栈缺失 | stack 为空 | 跳过堆栈 |

---

*Generated by 故事线技能 | Date: 2026-04-19*