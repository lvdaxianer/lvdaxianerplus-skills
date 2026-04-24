# v1.0.6 发布检查清单

> **版本策略**：偶数版本为稳定版，奇数版本为快速迭代版。v1.0.6 为稳定版本。

---

## 1. 版本号更新

### package.json

```json
{
  "version": "1.0.6"
}
```

**检查项**：
- [ ] `package.json` version 已更新为 `1.0.6`
- [ ] 版本号符合偶数稳定版策略

---

## 2. CHANGELOG 更新

### 本次变更内容（v1.0.6）

**新功能**：
- ✨ feat: 新增 `--transport=dual` 双模式启动（同时支持 STDIO + SSE）

**修复**：
- 🐛 fix: 熔断器配置持久化到 SQLite（配置优先级：CLI > SQLite > Config File）
- 🐛 fix: Dashboard 正确显示熔断器状态和失败次数
- 🐛 fix: SSE Server CORS 支持（MCP Inspector Proxy 可连接）
- 🐛 fix: SSE Server 监听 `0.0.0.0`（支持外部访问）
- 🐛 fix: Mock 调用日志记录到 SQLite（Dashboard 显示 Mock metrics）
- 🐛 fix: Dual 模式 HTTP Server 端口返回值修复

**文档**：
- 📝 docs: 简化 README.md 和 README_CN.md，聚焦 Dual 模式和安全使用
- 📝 docs: README 添加配置文档链接（CONFIG.md / CONFIG_EN.md）

**检查项**：
- [ ] `CHANGELOG.md` 已添加 v1.0.6 版本记录
- [ ] `CHANGELOG_EN.md` 已添加 v1.0.6 版本记录（英文版）
- [ ] 变更内容描述清晰完整

---

## 3. 构建验证

### 构建命令

```bash
cd mcp/mcp-http-gateway
npm run build
```

**检查项**：
- [ ] 构建成功，无报错
- [ ] `dist/cli.cjs` 文件生成
- [ ] `dist/templates/` 目录复制成功
- [ ] 文件开头有 `#!/usr/bin/env node` shebang

### 本地测试

```bash
# 测试 Dual 模式
node dist/cli.cjs --transport=dual --sse-port=11114 --http-port=11115 --config=./tools.json

# 验证 SSE 连接
curl http://localhost:11114/sse

# 验证 Dashboard
curl http://localhost:11115/dashboard

# 验证熔断器状态
curl http://localhost:11115/api/circuit-breaker
```

**检查项**：
- [ ] Dual 模式启动正常（同时启动 STDIO + SSE）
- [ ] SSE 端点可访问（返回 endpoint URL）
- [ ] Dashboard 可访问（返回 HTML）
- [ ] 熔断器 API 返回正确状态

---

## 4. 文档检查

**检查项**：
- [ ] `README.md` 为英文版本
- [ ] `README_CN.md` 为中文版本
- [ ] README 包含 Dual 模式说明
- [ ] README 包含安全使用说明
- [ ] README 包含配置文档链接
- [ ] `CONFIG.md` 配置文档完整
- [ ] `CONFIG_EN.md` 配置文档完整（英文版）

---

## 5. npm pack 预检

```bash
npm pack --dry-run
```

**检查项**：
- [ ] 只包含 `files` 列表中的文件
- [ ] 不包含 `.git/`、`node_modules/`、测试文件
- [ ] 总大小合理（约 1MB）

---

## 6. Git 提交

```bash
# 查看变更
git status
git diff

# 提交变更
git add .
git commit -m "chore(release): 发布 v1.0.6 版本"
```

**检查项**：
- [ ] 所有变更已提交
- [ ] 提交信息符合规范

---

## 7. npm 发布

```bash
# 确认登录状态
npm whoami

# 发布（需要 OTP）
npm publish --otp=<你的OTP>
```

**检查项**：
- [ ] npm 登录状态正常
- [ ] OTP 已获取
- [ ] 发布成功，无报错

---

## 8. 发布后验证

```bash
# 等待 1-2 分钟后验证
npx @lvdaxianer/mcp-http-gateway@1.0.6 --help

# 验证 Dual 模式
npx @lvdaxianer/mcp-http-gateway@1.0.6 --transport=dual --config=./tools.json
```

**检查项**：
- [ ] npx 执行成功
- [ ] CLI 正常启动
- [ ] 版本号正确显示

---

## 9. GitHub Release

```bash
# 创建 GitHub Release
gh release create v1.0.6 --title "v1.0.6 (稳定版)" --notes-file CHANGELOG.md
```

**检查项**：
- [ ] GitHub Release 创建成功
- [ ] Release 标题标注稳定版
- [ ] Release Notes 包含完整变更记录

---

## 发布流程图

```
┌─────────────────────────────────────┐
│  1. 版本号更新 (package.json)         │
│     ↓                               │
│  2. CHANGELOG 更新                   │
│     ↓                               │
│  3. 构建验证                         │
│     ↓ 构建成功 + 本地测试通过          │
│  4. 文档检查                         │
│     ↓                               │
│  5. npm pack 预检                    │
│     ↓ 打包内容正确                    │
│  6. Git 提交                         │
│     ↓                               │
│  7. npm 发布                         │
│     ↓ 发布成功                       │
│  8. 发布后验证                       │
│     ↓ npx 执行成功                   │
│  9. GitHub Release                   │
│     ↓                               │
│  ✅ v1.0.6 发布完成                   │
└─────────────────────────────────────┘
```

---

*检查清单创建日期: 2026-04-24*