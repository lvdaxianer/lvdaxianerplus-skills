# Mock 模块故事线

## 故事线概览

本模块包含 10 条故事线，覆盖 Mock 处理的核心功能。

---

## 故事线 66：全局 Mock 模式

### 故事目标
- **核心问题**：如何启用全局 Mock 模式用于测试
- **目标用户**：测试人员
- **预期产出**：所有请求返回 Mock 数据

### 关键节点
1. **起点**：config.mock.enabled=true
2. **中间步骤**：
   - 设置 globalMockEnabled 标志
   - 加载 mockData 配置
   - 所有请求优先检查 Mock
3. **终点**：Mock 模式生效

### 角色/参与者
| 角色 | 职责 | 输入 | 输出 |
|------|------|------|------|
| MockConfigLoader | 配置加载 | mockConfig | globalMockEnabled |
| MockDataStore | 数据存储 | mockData | 存储对象 |

### 数据流转
| 节点 | 输入数据 | 输出数据 | 传递方式 |
|------|----------|----------|----------|
| 标志设置 | enabled | globalMockEnabled | 直接赋值 |
| 数据加载 | mockData | mockDataStore | 对象赋值 |

### 异常/边界情况
| 异常类型 | 触发条件 | 处理方式 |
|----------|----------|----------|
| Mock 禁用 | enabled=false | 正常请求 |
| 无 Mock 配置 | mock 未定义 | 默认禁用 |

---

## 故事线 67：工具级 Mock 配置

### 故事目标
- **核心问题**：如何为单个工具配置 Mock
- **目标用户**：测试人员
- **预期产出**：工具使用特定 Mock 数据

### 关键节点
1. **起点**：tool.mock 配置
2. **中间步骤**：
   - 检查 tool.mock.enabled
   - 读取 tool.mock.response
   - 应用工具级 Mock
3. **终点**：工具 Mock 生效

### 角色/参与者
| 角色 | 职责 | 输入 | 输出 |
|------|------|------|------|
| ToolMockChecker | 工具检查 | tool.mock | 是否启用 |

### 数据流转
| 节点 | 输入数据 | 输出数据 | 传递方式 |
|------|----------|----------|----------|
| 启用检查 | mock.enabled | toolMockEnabled | 直接读取 |
| 数据获取 | mock.response | mockData | 直接读取 |

### 异常/边界情况
| 异常类型 | 触发条件 | 处理方式 |
|----------|----------|----------|
| 无工具 Mock | tool.mock 未定义 | 使用全局 |
| Mock 禁用 | mock.enabled=false | 正常请求 |

---

## 故事线 68：静态 Mock 响应

### 故事目标
- **核心问题**：如何返回静态 Mock 响应
- **目标用户**：测试人员
- **预期产出**：固定的 Mock 数据

### 关键节点
1. **起点**：mock.response 配置
2. **中间步骤**：
   - 读取静态响应对象
   - 处理占位符替换
   - 返回处理后的响应
3. **终点**：静态 Mock 返回

### 角色/参与者
| 角色 | 职责 | 输入 | 输出 |
|------|------|------|------|
| StaticReader | 静态读取 | response | 响应对象 |
| PlaceholderProcessor | 占位符处理 | response, args | 处理后响应 |

### 数据流转
| 节点 | 输入数据 | 输出数据 | 传递方式 |
|------|----------|----------|----------|
| 对象读取 | response | responseObject | 直接读取 |
| 占位符替换 | responseObject, args | processedResponse | 递归处理 |

### 异常/边界情况
| 异常类型 | 触发条件 | 处理方式 |
|----------|----------|----------|
| 无静态响应 | response 未定义 | 默认响应 |
| 响应格式错误 | response 非对象 | 返回原值 |

---

## 故事线 69：模板 Mock 响应

### 故事目标
- **核心问题**：如何处理模板 Mock 响应
- **目标用户**：测试人员
- **预期产出**：动态替换的 Mock 数据

### 关键节点
1. **起点**：mock.responseTemplate 配置
2. **中间步骤**：
   - 读取模板字符串
   - 替换参数占位符 {param}
   - 替换内置占位符 {timestamp}, {uuid}
   - JSON 解析结果
3. **终点**：模板 Mock 返回

### 角色/参与者
| 角色 | 职责 | 输入 | 输出 |
|------|------|------|------|
| TemplateReader | 模板读取 | responseTemplate | 模板字符串 |
| PlaceholderReplacer | 占位符替换 | template, args | 处理后字符串 |
| JsonParser | JSON 解析 | 处理后字符串 | JSON 对象 |

### 数据流转
| 节点 | 输入数据 | 输出数据 | 传递方式 |
|------|----------|----------|----------|
| 模板读取 | responseTemplate | template | 直接读取 |
| 参数替换 | template, args | replaced | 字符替换 |
| 内置替换 | replaced | processed | timestamp/uuid 替换 |
| JSON 解析 | processed | response | JSON.parse |

### 异常/边界情况
| 异常类型 | 触发条件 | 处理方式 |
|----------|----------|----------|
| 模板为空 | responseTemplate='' | 默认响应 |
| JSON 解析失败 | 解析出错 | 返回字符串 |

---

## 故事线 70：Mock 模拟延迟

### 故事目标
- **核心问题**：如何模拟响应延迟
- **目标用户**：测试人员
- **预期产出**：延迟后返回 Mock 数据

### 关键节点
1. **起点**：mock.delay 配置
2. **中间步骤**：
   - 读取延迟配置
   - setTimeout 等待
   - 返回 Mock 数据
3. **终点**：延迟 Mock 返回

### 角色/参与者
| 角色 | 职责 | 输入 | 输出 |
|------|------|------|------|
| DelayReader | 延迟读取 | mock.delay | delayMs |
| DelayExecutor | 延迟执行 | delayMs | 等待完成 |

### 数据流转
| 节点 | 输入数据 | 输出数据 | 传递方式 |
|------|----------|----------|----------|
| 延迟读取 | delay | delayMs | 直接读取 |
| 延迟等待 | delayMs | waitComplete | setTimeout |
| 数据返回 | waitComplete | mockData | 返回数据 |

### 异常/边界情况
| 异常类型 | 触发条件 | 处理方式 |
|----------|----------|----------|
| 无延迟配置 | delay 未定义 | 立即返回 |
| 延迟为 0 | delay=0 | 立即返回 |

---

## 故事线 71：Mock 状态码模拟

### 故事目标
- **核心问题**：如何模拟不同的 HTTP 状态码
- **目标用户**：测试人员
- **预期产出**：指定的状态码响应

### 关键节点
1. **起点**：mock.statusCode 配置
2. **中间步骤**：
   - 读取状态码配置
   - 根据状态码判断成功/失败
   - 返回 Mock 结果
3. **终点**：指定状态码 Mock

### 角色/参与者
| 角色 | 职责 | 输入 | 输出 |
|------|------|------|------|
| StatusCodeReader | 状态码读取 | statusCode | status |
| SuccessDeterminer | 成功判断 | status | isSuccess |

### 数据流转
| 节点 | 输入数据 | 输出数据 | 传递方式 |
|------|----------|----------|----------|
| 状态读取 | statusCode | status | 直接读取 |
| 成功判断 | status | isSuccess | >=200 && <300 |

### 异常/边界情况
| 异常类型 | 触发条件 | 处理方式 |
|----------|----------|----------|
| 无状态配置 | statusCode 未定义 | 默认 200 |
| 状态码非法 | statusCode 非数字 | 默认 200 |

---

## 故事线 72：Mock 作为回退

### 故事目标
- **核心问题**：如何在回退场景使用 Mock 数据
- **目标用户**：回退链
- **预期产出**：静态 Mock 作为最后回退

### 关键节点
1. **起点**：缓存回退失败
2. **中间步骤**：
   - 检查 useMockAsFallback
   - 检查工具是否有静态 Mock
   - 执行 Mock 回退（仅静态响应）
3. **终点**：返回 fallback_mock

### 角色/参与者
| 角色 | 职责 | 输入 | 输出 |
|------|------|------|------|
| MockFallbackChecker | Mock 回退检查 | mock.response | 是否可用 |
| MockFallbackExecutor | Mock 回退执行 | staticResponse | Mock 数据 |

### 数据流转
| 节点 | 输入数据 | 输出数据 | 传递方式 |
|------|----------|----------|----------|
| 配置检查 | useMockAsFallback | enabled | 直接读取 |
| 可用性检查 | mock.response | available | 条件判断 |
| 回退执行 | response | mockData | executeMockFallback |

### 异常/边界情况
| 异常类型 | 触发条件 | 处理方式 |
|----------|----------|----------|
| 无静态响应 | response 未定义 | 返回错误 |
| Mock 禁用 | useMockAsFallback=false | 返回错误 |

---

## 故事线 73：占位符参数替换

### 故事目标
- **核心问题**：如何替换 {param} 占位符为实际参数
- **目标用户**：Mock 处理
- **预期产出**：参数值替换完成

### 关键节点
1. **起点**：模板包含 {param}
2. **中间步骤**：
   - 遍历 arguments
   - 正则匹配 {key}
   - 替换为 args[key]
3. **终点**：占位符替换完成

### 角色/参与者
| 角色 | 职责 | 输入 | 输出 |
|------|------|------|------|
| ParamReplacer | 参数替换 | template, args | 替换后字符串 |

### 数据流转
| 节点 | 输入数据 | 输出数据 | 传递方式 |
|------|----------|----------|----------|
| 参数遍历 | args | paramList | Object.entries |
| 正则匹配 | {key} | matched | 正则表达式 |
| 值替换 | matched, args[key] | replaced | 字符替换 |

### 异常/边界情况
| 异常类型 | 触发条件 | 处理方式 |
|----------|----------|----------|
| 参数不存在 | args 无此 key | 保持原占位符 |
| 值为空 | args[key]='' | 替换为空字符串 |

---

## 故事线 74：内置占位符替换

### 故事目标
- **核心问题**：如何替换内置占位符 {timestamp}, {uuid}, {random}
- **目标用户**：Mock 处理
- **预期产出**：内置值替换完成

### 关键节点
1. **起点**：模板包含内置占位符
2. **中间步骤**：
   - {timestamp} → 当前时间 ISO
   - {uuid} → 生成 UUID
   - {random} → 随机数
3. **终点**：内置占位符替换完成

### 角色/参与者
| 角色 | 职责 | 输入 | 输出 |
|------|------|------|------|
| TimestampReplacer | 时间替换 | {timestamp} | ISO 时间 |
| UUIDReplacer | UUID 替换 | {uuid} | UUID |
| RandomReplacer | 随机替换 | {random} | 随机数 |

### 数据流转
| 节点 | 输入数据 | 输出数据 | 传递方式 |
|------|----------|----------|----------|
| 时间生成 | {timestamp} | new Date().toISOString() | Date |
| UUID 生成 | {uuid} | uuidv4() | uuid 库 |
| 随机生成 | {random} | Math.random() | Math |

### 异常/边界情况
| 异常类型 | 触发条件 | 处理方式 |
|----------|----------|----------|
| UUID 库失败 | uuid 抛错 | 使用时间戳替代 |
| 时间格式错误 | toISOString 失败 | 使用 Date.now() |

---

## 故事线 75：Mock 数据更新

### 故事目标
- **核心问题**：如何动态更新 Mock 数据
- **目标用户**：测试人员
- **预期产出**：Mock 数据实时更新

### 关键节点
1. **起点**：Dashboard Mock 编辑
2. **中间步骤**：
   - 接收新 Mock 配置
   - 更新 mockDataStore
   - 日志记录更新
3. **终点**：Mock 数据更新完成

### 角色/参与者
| 角色 | 职责 | 输入 | 输出 |
|------|------|------|------|
| MockUpdater | Mock 更新 | toolName, mockConfig | 更新结果 |

### 数据流转
| 节点 | 输入数据 | 输出数据 | 传递方式 |
|------|----------|----------|----------|
| 数据更新 | mockConfig | mockDataStore[toolName] | 对象赋值 |
| 日志记录 | toolName | logEntry | logger.info |

### 异常/边界情况
| 异常类型 | 触发条件 | 处理方式 |
|----------|----------|----------|
| 工具不存在 | toolName 未注册 | 创建新条目 |
| 配置无效 | mockConfig 格式错误 | 拒绝更新 |

---

*Generated by 故事线技能 | Date: 2026-04-19*