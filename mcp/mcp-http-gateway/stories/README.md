# MCP HTTP Gateway Dashboard 改造故事线索引

> **总数**: 50 个测试故事线
> **生成日期**: 2026-04-19
> **改造功能**: EJS模板、路由策略表、Handler拆分、Toast、确认弹窗、Escape键、JSON格式化、Mock预设、分页日志、配置备份

---

## 1. EJS 模板相关 (5个)

| 编号 | 故事名称 | 文件路径 | 核心问题 |
|------|----------|----------|----------|
| EJS-001 | Dashboard 主模板渲染 | [EJS-001-dashboard-main-template.md](EJS-001-dashboard-main-template.md) | EJS 主模板正确渲染包含所有 partials |
| EJS-002 | Partials 模板组合测试 | [EJS-002-partials-combination.md](EJS-002-partials-combination.md) | 8 个 partial 文件正确组合到主模板 |
| EJS-003 | Overview Page 模板渲染 | [EJS-003-overview-page-rendering.md](EJS-003-overview-page-rendering.md) | Overview 页面正确展示 aggregated metrics |
| EJS-004 | Tools Page 模板渲染 | [EJS-004-tools-page-rendering.md](EJS-004-tools-page-rendering.md) | Tools 页面展示工具列表和 Mock 开关 |
| EJS-005 | Scripts Partial JavaScript 加载 | [EJS-005-scripts-javascript-loading.md](EJS-005-scripts-javascript-loading.md) | scripts.ejs 正确注入 JavaScript 代码 |

---

## 2. 路由策略表相关 (5个)

| 编号 | 故事名称 | 文件路径 | 核心问题 |
|------|----------|----------|----------|
| ROUTER-001 | 路由策略表注册与排序 | [ROUTER-001-route-registration-sorting.md](ROUTER-001-route-registration-sorting.md) | RouterStrategyTable 正确注册路由并按优先级排序 |
| ROUTER-002 | Exact 精确路径匹配 | [ROUTER-002-exact-path-matching.md](ROUTER-002-exact-path-matching.md) | 精确匹配能正确匹配完全相同的路径 |
| ROUTER-003 | Regex 正则路径匹配 | [ROUTER-003-regex-path-matching.md](ROUTER-003-regex-path-matching.md) | 正则匹配能正确提取路径参数 |
| ROUTER-004 | Prefix 前缀路径匹配 | [ROUTER-004-prefix-path-matching.md](ROUTER-004-prefix-path-matching.md) | 前缀匹配能正确匹配路径开头并返回剩余路径 |
| ROUTER-005 | 方法过滤与路由分发 | [ROUTER-005-method-filtering-dispatch.md](ROUTER-005-method-filtering-dispatch.md) | 路由能正确过滤 HTTP 方法并分发到 handler |

---

## 3. Handler 模块拆分相关 (5个)

| 编号 | 故事名称 | 文件路径 | 核心问题 |
|------|----------|----------|----------|
| HANDLER-001 | Health Handler 模块功能 | [HANDLER-001-health-handler-module.md](HANDLER-001-health-handler-module.md) | health.handler.ts 正确处理健康检查请求 |
| HANDLER-002 | Tools Handler Mock 配置管理 | [HANDLER-002-tools-mock-config-management.md](HANDLER-002-tools-mock-config-management.md) | tools.handler.ts 正确管理 Mock 配置 |
| HANDLER-003 | Logs Handler 分页查询 | [HANDLER-003-logs-pagination-query.md](HANDLER-003-logs-pagination-query.md) | logs.handler.ts 正确处理分页日志查询 |
| HANDLER-004 | Cache Handler 缓存管理 | [HANDLER-004-cache-handler-management.md](HANDLER-004-cache-handler-management.md) | cache.handler.ts 正确管理缓存数据和统计 |
| HANDLER-005 | Config Handler 配置管理 | [HANDLER-005-config-handler-management.md](HANDLER-005-config-handler-management.md) | config.handler.ts 正确管理服务配置 |

---

## 4. Toast 组件相关 (5个)

| 编号 | 故事名称 | 文件路径 | 核心问题 |
|------|----------|----------|----------|
| TOAST-001 | Toast 成功提示显示 | [TOAST-001-success-toast-display.md](TOAST-001-success-toast-display.md) | Toast 组件正确显示成功类型提示 |
| TOAST-002 | Toast 错误提示显示 | [TOAST-002-error-toast-display.md](TOAST-002-error-toast-display.md) | Toast 组件正确显示错误类型提示 |
| TOAST-003 | Toast 信息提示显示 | [TOAST-003-info-toast-display.md](TOAST-003-info-toast-display.md) | Toast 组件正确显示信息类型提示 |
| TOAST-004 | Toast 多个堆叠显示 | [TOAST-004-multiple-toast-stack.md](TOAST-004-multiple-toast-stack.md) | 多个 Toast 正确堆叠显示不互相干扰 |
| TOAST-005 | Toast 自动消失时机 | [TOAST-005-auto-dismiss-timing.md](TOAST-005-auto-dismiss-timing.md) | Toast 在 3 秒后正确自动消失 |

---

## 5. 确认弹窗相关 (5个)

| 编号 | 故事名称 | 文件路径 | 核心问题 |
|------|----------|----------|----------|
| CONFIRM-001 | 确认弹窗显示与内容 | [CONFIRM-001-confirm-dialog-display.md](CONFIRM-001-confirm-dialog-display.md) | 确认弹窗正确显示标题、消息和按钮 |
| CONFIRM-002 | 确认弹窗取消操作 | [CONFIRM-002-confirm-dialog-cancel.md](CONFIRM-002-confirm-dialog-cancel.md) | 点击取消按钮正确关闭弹窗不执行回调 |
| CONFIRM-003 | 确认弹窗确认操作 | [CONFIRM-003-confirm-dialog-confirm.md](CONFIRM-003-confirm-dialog-confirm.md) | 点击确认按钮正确执行回调并关闭弹窗 |
| CONFIRM-004 | 确认弹窗 Escape 键关闭 | [CONFIRM-004-confirm-escape-close.md](CONFIRM-004-confirm-escape-close.md) | Escape 键正确关闭确认弹窗 |
| CONFIRM-005 | 确认弹窗点击背景关闭 | [CONFIRM-005-confirm-backdrop-close.md](CONFIRM-005-confirm-backdrop-close.md) | 点击弹窗背景能正确关闭弹窗 |

---

## 6. Escape 键相关 (5个)

| 编号 | 故事名称 | 文件路径 | 核心问题 |
|------|----------|----------|----------|
| ESCAPE-001 | Escape 键关闭 Mock 配置弹窗 | [ESCAPE-001-mock-modal-close.md](ESCAPE-001-mock-modal-close.md) | Escape 键正确关闭 Mock 配置弹窗 |
| ESCAPE-002 | Escape 键关闭错误详情弹窗 | [ESCAPE-002-error-modal-close.md](ESCAPE-002-error-modal-close.md) | Escape 键正确关闭错误详情弹窗 |
| ESCAPE-003 | Escape 键关闭缓存详情弹窗 | [ESCAPE-003-cache-modal-close.md](ESCAPE-003-cache-modal-close.md) | Escape 键正确关闭缓存详情弹窗 |
| ESCAPE-004 | Escape 键同时关闭多个弹窗 | [ESCAPE-004-multiple-modals-close.md](ESCAPE-004-multiple-modals-close.md) | Escape 键能关闭所有显示的弹窗 |
| ESCAPE-005 | Escape 键在其他页面状态下的行为 | [ESCAPE-005-non-modal-state-behavior.md](ESCAPE-005-non-modal-state-behavior.md) | 无弹窗显示时 Escape 无效果 |

---

## 7. JSON 格式化相关 (5个)

| 编号 | 故事名称 | 文件路径 | 核心问题 |
|------|----------|----------|----------|
| JSON-001 | JSON 格式化按钮功能 | [JSON-001-format-button-function.md](JSON-001-format-button-function.md) | JSON 格式化按钮正确格式化输入内容 |
| JSON-002 | JSON 格式化错误处理 | [JSON-002-format-error-handling.md](JSON-002-format-error-handling.md) | JSON 格式化对无效输入的正确错误处理 |
| JSON-003 | JSON 格式化保留原内容 | [JSON-003-format-preserve-content.md](JSON-003-format-preserve-content.md) | 格式化不改变 JSON 数据内容仅改变格式 |
| JSON-004 | Config 页面 JSON 格式化 | [JSON-004-config-page-format.md](JSON-004-config-page-format.md) | Config 页面的 JSON 格式化功能 |
| JSON-005 | JSON 格式化嵌套对象处理 | [JSON-005-nested-object-format.md](JSON-005-nested-object-format.md) | 嵌套对象 JSON 正确格式化 |

---

## 8. Mock 预设模板相关 (5个)

| 编号 | 故事名称 | 文件路径 | 核心问题 |
|------|----------|----------|----------|
| PRESET-001 | Mock 预设选择器功能 | [PRESET-001-mock-preset-selector.md](PRESET-001-mock-preset-selector.md) | Mock 预设选择器正确应用预设配置 |
| PRESET-002 | 成功响应预设应用 | [PRESET-002-success-response-preset.md](PRESET-002-success-response-preset.md) | "成功响应"预设正确应用 |
| PRESET-003 | 错误响应预设应用 | [PRESET-003-error-response-preset.md](PRESET-003-error-response-preset.md) | "错误响应"预设正确应用 |
| PRESET-004 | 超时模拟预设应用 | [PRESET-004-timeout-preset.md](PRESET-004-timeout-preset.md) | "超时模拟"预设正确应用 5 秒延迟 |
| PRESET-005 | 预设切换与表单更新 | [PRESET-005-preset-switch-update.md](PRESET-005-preset-switch-update.md) | 切换预设正确更新表单值 |

---

## 9. 分页日志查询相关 (5个)

| 编号 | 故事名称 | 文件路径 | 核心问题 |
|------|----------|----------|----------|
| PAGINATION-001 | 日志分页默认参数 | [PAGINATION-001-default-pagination-params.md](PAGINATION-001-default-pagination-params.md) | 日志分页使用正确的默认参数 |
| PAGINATION-002 | 日志翻页操作 | [PAGINATION-002-log-page-navigation.md](PAGINATION-002-log-page-navigation.md) | 日志翻页按钮正确切换页码 |
| PAGINATION-003 | 日志分页边界处理 | [PAGINATION-003-pagination-boundary.md](PAGINATION-003-pagination-boundary.md) | 分页边界按钮状态正确 |
| PAGINATION-004 | 日志筛选条件应用 | [PAGINATION-004-log-filter-conditions.md](PAGINATION-004-log-filter-conditions.md) | 日志筛选条件正确应用于分页查询 |
| PAGINATION-005 | 日志分页空数据处理 | [PAGINATION-005-empty-data-handling.md](PAGINATION-005-empty-data-handling.md) | 无数据时分页正确显示空状态 |

---

## 10. 配置备份与回滚相关 (5个)

| 编号 | 故事名称 | 文件路径 | 核心问题 |
|------|----------|----------|----------|
| BACKUP-001 | 配置备份自动创建 | [BACKUP-001-auto-config-backup.md](BACKUP-001-auto-config-backup.md) | 保存配置时自动创建备份 |
| BACKUP-002 | 备份列表显示 | [BACKUP-002-backup-list-display.md](BACKUP-002-backup-list-display.md) | 备份列表正确显示所有备份版本 |
| BACKUP-003 | 配置回滚操作 | [BACKUP-003-config-rollback-operation.md](BACKUP-003-config-rollback-operation.md) | 配置回滚正确恢复到指定版本 |
| BACKUP-004 | 备份版本不存在处理 | [BACKUP-004-version-not-found.md](BACKUP-004-version-not-found.md) | 回滚不存在版本时的错误处理 |
| BACKUP-005 | 配置校验失败阻止保存 | [BACKUP-005-validation-fail-prevent-save.md](BACKUP-005-validation-fail-prevent-save.md) | 配置校验失败时阻止保存且不创建备份 |

---

## 测试覆盖率统计

| 功能模块 | 故事线数量 | 测试场景覆盖 |
|----------|------------|--------------|
| EJS 模板 | 5 | 模板渲染、partials组合、各页面渲染、JS加载 |
| 路由策略表 | 5 | 注册排序、精确匹配、正则匹配、前缀匹配、方法分发 |
| Handler 模块 | 5 | Health、Tools Mock、Logs、Cache、Config |
| Toast 组件 | 5 | 成功、错误、信息、堆叠、自动消失 |
| 确认弹窗 | 5 | 显示、取消、确认、Escape、背景关闭 |
| Escape 键 | 5 | 各弹窗关闭、多弹窗、非弹窗状态 |
| JSON 格式化 | 5 | 格式化、错误处理、内容保留、Config、嵌套 |
| Mock 预设 | 5 | 选择器、成功、错误、超时、切换 |
| 分页日志 | 5 | 默认参数、翻页、边界、筛选、空数据 |
| 配置备份 | 5 | 自动备份、列表、回滚、不存在、校验失败 |
| **总计** | **50** | **全面覆盖所有改造功能** |

---

## 测试执行建议

1. **前置条件**: 
   - Chrome DevTools MCP 可用
   - 服务已启动在 localhost:11112

2. **测试顺序**:
   - 先测试基础功能（EJS模板、路由策略）
   - 再测试交互功能（Toast、确认弹窗、Escape键）
   - 最后测试数据功能（分页、备份）

3. **自动化测试**:
   - 使用 Playwright 或 Chrome DevTools MCP 执行
   - 每个故事线对应一个测试用例

---

*Generated by 故事线技能 | Date: 2026-04-19*