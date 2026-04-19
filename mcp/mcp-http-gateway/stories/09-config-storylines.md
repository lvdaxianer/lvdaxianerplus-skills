# 配置管理模块故事线

## 故事线概览

本模块包含 10 条故事线，覆盖配置管理的核心功能。

---

## 故事线 101：配置文件加载

### 故事目标
- **核心问题**：如何从 JSON 文件加载配置
- **目标用户**：系统自身
- **预期产出**：解析后的 Config 对象

### 关键节点
1. **起点**：CLI 启动指定配置路径
2. **中间步骤**：
   - 检查文件存在
   - 读取文件内容
   - JSON 解析
   - 合并默认值
3. **终点**：Config 对象创建

### 角色/参与者
| 角色 | 职责 | 输入 | 输出 |
|------|------|------|------|
| FileChecker | 文件检查 | filePath | exists |
| FileReader | 文件读取 | filePath | content |
| JsonParser | JSON 解析 | content | config |
| DefaultMerger | 默认合并 | config | mergedConfig |

### 数据流转
| 节点 | 输入数据 | 输出数据 | 传递方式 |
|------|----------|----------|----------|
| 存在检查 | filePath | exists | fs.existsSync |
| 内容读取 | filePath | content | fs.readFileSync |
| JSON 解析 | content | config | JSON.parse |
| 默认合并 | config | finalConfig | Object.assign |

### 异常/边界情况
| 异常类型 | 触发条件 | 处理方式 |
|----------|----------|----------|
| 文件不存在 | filePath 无效 | 进程退出 |
| JSON 格式错误 | parse 失败 | 进程退出 |
| 配置缺失字段 | required 字段空 | 使用默认值 |

---

## 故事线 102：配置验证

### 故事目标
- **核心问题**：如何验证配置格式和内容
- **目标用户**：系统自身
- **预期产出**：验证通过的配置

### 关键节点
1. **起点**：Config 对象创建
2. **中间步骤**：
   - 验证 baseUrl 格式
   - 验证 tools 结构
   - 验证类型字段
   - 验证数值范围
3. **终点**：验证完成

### 角色/参与者
| 角色 | 职责 | 输入 | 输出 |
|------|------|------|------|
| UrlValidator | URL 验证 | baseUrl | valid |
| ToolsValidator | 工具验证 | tools | valid |
| TypeValidator | 类型验证 | fields | valid |

### 数据流转
| 节点 | 输入数据 | 输出数据 | 传递方式 |
|------|----------|----------|----------|
| URL 检查 | baseUrl | isValidUrl | 正则匹配 |
| 工具检查 | tools | isToolsValid | 遍历验证 |
| 类型检查 | type fields | isTypesValid | schema 校验 |

### 异常/边界情况
| 异常类型 | 触发条件 | 处理方式 |
|----------|----------|----------|
| baseUrl 无效 | URL 格式错误 | 进程退出 |
| tools 为空 | 无工具定义 | 进程退出 |
| 类型非法 | type 不在支持范围 | 使用默认 |

---

## 故事线 103：配置热更新

### 故事目标
- **核心问题**：如何实现配置文件热更新
- **目标用户**：系统管理员
- **预期产出**：配置自动更新生效

### 关键节点
1. **起点**：配置文件修改
2. **中间步骤**：
   - 文件监听触发
   - 解析新配置
   - 验证新配置
   - 更新运行配置
3. **终点**：新配置生效

### 角色/参与者
| 角色 | 职责 | 输入 | 输出 |
|------|------|------|------|
| FileWatcher | 文件监听 | filePath | changeEvent |
| ConfigReloader | 配置重载 | changeEvent | newConfig |

### 数据流转
| 节点 | 输入数据 | 输出数据 | 传递方式 |
|------|----------|----------|----------|
| 变更检测 | file change | changeEvent | fs.watch |
| debounce | changeEvent | reloadSignal | setTimeout |
| 配置解析 | reloadSignal | newConfig | loadConfig |
| 配置更新 | newConfig | currentConfig | 对象替换 |

### 异常/边界情况
| 异常类型 | 触发条件 | 处理方式 |
|----------|----------|----------|
| 解析失败 | JSON 错误 | 保持旧配置 |
| 验证失败 | schema 错误 | 保持旧配置 |
| 监听失败 | watch 错误 | 手动重载 |

---

## 故事线 104：配置备份

### 故事目标
- **核心问题**：如何备份配置文件
- **目标用户**：系统管理员
- **预期产出**：配置备份文件

### 关键节点
1. **起点**：配置修改/保存
2. **中间步骤**：
   - 读取当前配置
   - 复制到备份目录
   - 添加时间戳命名
   - 限制备份版本数
3. **终点**：备份完成

### 角色/参与者
| 角色 | 职责 | 输入 | 输出 |
|------|------|------|------|
| BackupCreator | 备份创建 | configPath | backupPath |
| BackupCleaner | 备份清理 | maxVersions | 删除计数 |

### 数据流转
| 节点 | 输入数据 | 输出数据 | 传递方式 |
|------|----------|----------|----------|
| 文件复制 | configPath | backupFile | fs.copy |
| 时间戳命名 | timestamp | fileName | 日期格式化 |
| 旧备份删除 | maxVersions | deleted | fs.unlink |

### 异常/边界情况
| 异常类型 | 触发条件 | 处理方式 |
|----------|----------|----------|
| 复制失败 | fs 错误 | 记录错误 |
| 备份目录不存在 | dir 无效 | 创建目录 |

---

## 故事线 105：工具配置解析

### 故事目标
- **核心问题**：如何解析工具配置定义
- **目标用户**：McpServer
- **预期产出**：完整的 ToolConfig 对象

### 关键节点
1. **起点**：tools 配置项
2. **中间步骤**：
   - 遍历工具定义
   - 解析参数定义
   - 解析认证配置
   - 解析 Mock 配置
3. **终点**：工具配置解析完成

### 角色/参与者
| 角色 | 职责 | 输入 | 输出 |
|------|------|------|------|
| ToolParser | 工具解析 | toolDef | ToolConfig |
| ParamParser | 参数解析 | queryParams/body | ParameterDef |

### 数据流转
| 节点 | 输入数据 | 输出数据 | 传递方式 |
|------|----------|----------|----------|
| 工具遍历 | tools | toolDefs | Object.entries |
| 参数解析 | body/queryParams | paramDefs | 类型转换 |
| 配置合并 | defaults | finalToolConfig | Object.assign |

### 异常/边界情况
| 异常类型 | 触发条件 | 处理方式 |
|----------|----------|----------|
| 缺少 description | description 为空 | 使用默认 |
| 缺少 method | method 未定义 | 默认 GET |
| 缺少 path | path 未定义 | 进程退出 |

---

## 故事线 106：Token 配置解析

### 故事目标
- **核心问题**：如何解析 Token 配置
- **目标用户**：认证模块
- **预期产出**：Token 键值对 Map

### 关键节点
1. **起点**：tokens 配置项
2. **中间步骤**：
   - 遍历 Token 定义
   - 存储 Token 键值对
   - 提供查找接口
3. **终点**：Token Map 创建

### 角色/参与者
| 角色 | 职责 | 输入 | 输出 |
|------|------|------|------|
| TokenParser | Token 解析 | tokens | TokenMap |

### 数据流转
| 节点 | 输入数据 | 输出数据 | 传递方式 |
|------|----------|----------|----------|
| Token 遍历 | tokens | tokenEntries | Object.entries |
| Map 构建 | tokenEntries | tokenMap | new Map |
| 查找接口 | key | value | Map.get |

### 异常/边界情况
| 异常类型 | 触发条件 | 处理方式 |
|----------|----------|----------|
| Token 为空 | value='' | 跳过 |
| Token 值非法 | value 非 string | 转换为 string |

---

## 故事线 107：配置 API 提供

### 故事目标
- **核心问题**：如何提供配置查询 API
- **目标用户**：Dashboard
- **预期产出**：配置信息（敏感信息脱敏）

### 关键节点
1. **起点**：GET /api/config 请求
2. **中间步骤**：
   - 读取当前配置
   - 脱敏 Token 值
   - 脱敏敏感字段
   - 返回 JSON
3. **终点**：配置返回

### 角色/参与者
| 角色 | 职责 | 输入 | 输出 |
|------|------|------|------|
| ConfigReader | 配置读取 | currentConfig | config |
| SensitiveMasker | 脱敏处理 | config | maskedConfig |

### 数据流转
| 节点 | 输入数据 | 输出数据 | 传递方式 |
|------|----------|----------|----------|
| 配置获取 | currentConfig | configObj | 直接读取 |
| Token 脱敏 | tokens | maskedTokens | 值替换为 [MASKED] |
| JSON 返回 | maskedConfig | response | JSON.stringify |

### 异常/边界情况
| 异常类型 | 触发条件 | 处理方式 |
|----------|----------|----------|
| 配置未加载 | currentConfig 为空 | 返回默认 |
| 脱敏失败 | 字段不存在 | 保持原值 |

---

## 故事线 108：配置更新 API

### 故事目标
- **核心问题**：如何提供配置更新 API
- **目标用户**：Dashboard
- **预期产出**：配置更新并生效

### 关键节点
1. **起点**：PUT /api/config 请求
2. **中间步骤**：
   - 验证新配置
   - 备份旧配置
   - 写入新配置
   - 触发热更新
3. **终点**：配置更新成功

### 角色/参与者
| 角色 | 职责 | 输入 | 输出 |
|------|------|------|------|
| ConfigValidator | 配置验证 | newConfig | valid |
| BackupCreator | 备份创建 | oldConfig | backup |
| ConfigWriter | 配置写入 | newConfig | writeResult |

### 数据流转
| 节点 | 输入数据 | 输出数据 | 传递方式 |
|------|----------|----------|----------|
| 配置解析 | request body | newConfig | JSON.parse |
| 配置验证 | newConfig | isValid | schema 校验 |
| 备份创建 | currentConfig | backupFile | fs.copy |
| 配置写入 | newConfig | configFile | fs.writeFile |

### 异常/边界情况
| 异常类型 | 触发条件 | 处理方式 |
|----------|----------|----------|
| 验证失败 | schema 错误 | 返回错误 |
| 写入失败 | fs 错误 | 返回错误 |
| 热更新失败 | reload 错误 | 返回警告 |

---

## 故事线 109：配置验证 API

### 故事目标
- **核心问题**：如何提供配置验证 API
- **目标用户**：Dashboard
- **预期产出**：验证结果（通过/错误详情）

### 关键节点
1. **起点**：POST /api/config/validate 请求
2. **中间步骤**：
   - 解析配置
   - 执行验证
   - 收集错误
   - 返回结果
3. **终点**：验证结果返回

### 角色/参与者
| 角色 | 职责 | 输入 | 输出 |
|------|------|------|------|
| ConfigParser | 配置解析 | body | config |
| SchemaValidator | Schema 验证 | config | errors |

### 数据流转
| 节点 | 输入数据 | 输出数据 | 传递方式 |
|------|----------|----------|----------|
| 配置解析 | request body | config | JSON.parse |
| 验证执行 | config | validationResult | schema 校验 |
| 结果构建 | validationResult | response | 对象构建 |

### 异常/边界情况
| 异常类型 | 触发条件 | 处理方式 |
|----------|----------|----------|
| 解析失败 | JSON 错误 | 返回解析错误 |
| 无错误 | validation 通过 | 返回 valid: true |

---

## 故事线 110：默认配置合并

### 故事目标
- **核心问题**：如何合并用户配置和默认配置
- **目标用户**：系统自身
- **预期产出**：完整配置（缺失字段填充默认值）

### 关键节点
1. **起点**：用户配置加载
2. **中间步骤**：
   - 遍历默认配置
   - 检查用户配置缺失字段
   - 填充默认值
   - 深度合并嵌套对象
3. **终点**：完整配置

### 角色/参与者
| 角色 | 职责 | 输入 | 输出 |
|------|------|------|------|
| DefaultProvider | 默认提供 | DEFAULT_* | defaults |
| DeepMerger | 深度合并 | userConfig, defaults | mergedConfig |

### 数据流转
| 节点 | 输入数据 | 输出数据 | 传递方式 |
|------|----------|----------|----------|
| 默认读取 | DEFAULT_* | defaultValues | 直接读取 |
| 字段检查 | userConfig | missingFields | Object.keys 比较 |
| 值填充 | missingFields, defaults | filledConfig | 属性赋值 |
| 深度合并 | nested objects | finalConfig | 递归合并 |

### 异常/边界情况
| 异常类型 | 触发条件 | 处理方式 |
|----------|----------|----------|
| 用户覆盖默认 | userConfig 有值 | 保持用户值 |
| 嵌套对象缺失 | nested 未定义 | 使用整个默认嵌套 |

---

*Generated by 故事线技能 | Date: 2026-04-19*