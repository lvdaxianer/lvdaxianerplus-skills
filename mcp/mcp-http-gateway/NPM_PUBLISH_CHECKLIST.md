# npm 发布检查清单

> 每次发布 npm 包前，必须逐项检查以下内容，确保发布成功且包能正常运行。

---

## 1. 代码与构建检查

### 1.1. 构建命令执行

```bash
# 在 mcp/mcp-http-gateway 目录下执行
npm run build
```

**检查项**：
- [ ] 构建成功，无报错
- [ ] 生成 `dist/cli.cjs` 文件
- [ ] 文件大小约 1MB（压缩后）
- [ ] 文件开头有 `#!/usr/bin/env node` shebang

### 1.2. 本地执行测试

```bash
# 测试 STDIO 模式
node dist/cli.cjs --config tools.json

# 测试 SSE 模式
node dist/cli.cjs --transport=sse --sse-port=11113 --config tools.json

# 测试 HTTP 模式
node dist/cli.cjs --http --http-port=11112 --config tools.json
```

**检查项**：
- [ ] STDIO 模式启动正常
- [ ] SSE 模式启动正常
- [ ] HTTP 模式启动正常
- [ ] 无 "Dynamic require not supported" 错误
- [ ] 无 "Cannot find module" 错误

---

## 2. package.json 检查

### 2.1. 必要字段检查

**检查项**：
- [ ] `name`: `@lvdaxianer/mcp-http-gateway`
- [ ] `version`: 版本号已更新（遵循偶数稳定/奇数迭代策略）
- [ ] `description`: 描述准确
- [ ] `license`: `MIT`
- [ ] `author`: 作者信息正确
- [ ] `repository`: 仓库地址正确
- [ ] `homepage`: 主页地址正确
- [ ] `bugs`: 问题反馈地址正确

### 2.2. CLI 入口配置

**检查项**：
- [ ] `bin`: `{ "mcp-http-gateway": "dist/cli.cjs" }`
- [ ] ❌ **禁止**：`main` 字段（CLI 工具不需要）
- [ ] ❌ **禁止**：`types` 字段（无类型定义文件）
- [ ] ❌ **禁止**：`type: "module"` 字段（使用 CJS 格式）
- [ ] ❌ **禁止**：`exports` 字段（CLI 工具不需要）

### 2.3. 发布文件列表

**检查项**：
- [ ] `files` 包含以下文件：
  ```json
  [
    "dist/cli.cjs",
    "docs",
    "README.md",
    "README_CN.md",
    "LICENSE",
    "CHANGELOG.md",
    "CHANGELOG_EN.md",
    "CONFIG.md",
    "CONFIG_EN.md"
  ]
  ```
- [ ] ❌ **禁止**：包含 `dist/*.js`（已废弃）
- [ ] ❌ **禁止**：包含 `dist/*.d.ts`（不存在）
- [ ] ❌ **禁止**：包含 `src/` 目录（源码不发布）

### 2.4. 依赖检查

**检查项**：
- [ ] `dependencies` 中有 `better-sqlite3`（native 模块）
- [ ] 构建命令中有 `--external:better-sqlite3`（不打包 native 模块）
- [ ] `engines`: `node >= 18.0.0`

---

## 3. 文档检查

### 3.1. README 文件检查

**检查项**：
- [ ] `README.md` 存在
- [ ] `README_CN.md` 存在（中文版）
- [ ] 所有 `cli.js` 已替换为 `cli.cjs`
- [ ] 本地启动命令正确：
  ```bash
  node dist/cli.cjs --transport=sse --sse-port=11113
  ```
- [ ] MCP 配置示例正确：
  ```json
  "args": ["mcp/mcp-http-gateway/dist/cli.cjs", "--config", "..."]
  ```
- [ ] 安装命令正确：
  ```bash
  npx @lvdaxianer/mcp-http-gateway
  ```

### 3.2. CHANGELOG 检查

**检查项**：
- [ ] `CHANGELOG.md` 已更新最新版本记录
- [ ] `CHANGELOG_EN.md` 已更新最新版本记录（英文版）
- [ ] 版本号与 package.json 一致
- [ ] 变更内容描述清晰

### 3.3. 其他文档检查

**检查项**：
- [ ] `LICENSE` 文件存在
- [ ] `CONFIG.md` 文件存在（配置说明）
- [ ] `CONFIG_EN.md` 文件存在（配置说明英文版）
- [ ] `docs/` 目录存在（Dashboard 文档）

---

## 4. npm pack 预检

### 4.1. 打包测试

```bash
npm pack --dry-run
```

**检查项**：
- [ ] 只包含 `files` 中列出的文件
- [ ] 总大小合理（约 1MB）
- [ ] 不包含 `.git/` 目录
- [ ] 不包含 `node_modules/` 目录
- [ ] 不包含测试文件
- [ ] 不包含 TypeScript 源码

### 4.2. 包内容预览

```bash
tar -tzf *.tgz | head -20
```

**检查项**：
- [ ] 文件路径正确：`package/dist/cli.cjs`
- [ ] shebang 在文件开头：`#!/usr/bin/env node`
- [ ] 无多余文件

---

## 5. 发布流程

### 5.1. 发布前准备

```bash
# 1. 确保在正确的目录
cd mcp/mcp-http-gateway

# 2. 确保代码已提交
git status
git add .
git commit

# 3. 确保构建是最新的
npm run build

# 4. 本地测试
node dist/cli.cjs --config tools.json

# 5. 预检打包内容
npm pack --dry-run
```

### 5.2. 发布命令

```bash
# 需要 OTP（一次性密码）
npm publish --otp=<你的OTP>
```

**检查项**：
- [ ] npm 登录状态正常：`npm whoami`
- [ ] OTP 已获取
- [ ] 发布成功，无报错
- [ ] 包名正确：`@lvdaxianer/mcp-http-gateway`

### 5.3. 发布后验证

```bash
# 等待 1-2 分钟后验证
npx @lvdaxianer/mcp-http-gateway@latest --help
```

**检查项**：
- [ ] npx 执行成功
- [ ] CLI 正常启动
- [ ] 版本号正确

---

## 6. 故障排查

### 6.1. npx 执行失败

**症状**：`Dynamic require not supported`

**原因**：ESM 格式或 shebang 缺失

**解决**：
1. 确认 `dist/cli.cjs` 是 CommonJS 格式
2. 确认文件开头有 `#!/usr/bin/env node`
3. 确认 package.json 无 `type: "module"` 字段

### 6.2. 找不到模块

**症状**：`Cannot find module 'xxx'`

**原因**：构建时缺少 `--external` 或依赖缺失

**解决**：
1. 确认 `better-sqlite3` 在 dependencies 中
2. 确认构建命令有 `--external:better-sqlite3`
3. 确认其他依赖已正确打包

### 6.3. 发布文件缺失

**症状**：发布后 npx 执行找不到文件

**原因**：package.json `files` 配置错误

**解决**：
1. 检查 `files` 列表是否包含 `dist/cli.cjs`
2. 检查 bin 配置路径是否正确
3. 使用 `npm pack --dry-run` 验证

---

## 7. 版本策略

| 版本号 | 含义 | 适用场景 |
|--------|------|----------|
| 1.0, 1.2, 2.0 | 稳定版 | 生产环境使用 |
| 1.1, 1.3, 2.1 | 快速迭代版 | 新功能测试、预发布 |

**规则**：
- 偶数版本：经过充分测试，API 稳定
- 奇数版本：快速迭代，可能有变更

---

## 检查清单使用流程

```
┌─────────────────────────────────────┐
│  1. 代码与构建检查                    │
│     ↓ 构建成功                       │
│  2. package.json 检查                │
│     ↓ 配置正确                       │
│  3. 文档检查                         │
│     ↓ 文档更新                       │
│  4. npm pack 预检                    │
│     ↓ 打包内容正确                   │
│  5. 发布流程                         │
│     ↓ 发布成功                       │
│  6. 发布后验证                       │
│     ↓ npx 执行成功                   │
│  ✅ 发布完成                         │
└─────────────────────────────────────┘
```

---

*Last updated: 2026-04-23*