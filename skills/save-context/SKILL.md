---
name: save-context
description: |
  手动或自动保存会话核心内容到 context 文件。
  触发方式：用户输入 /save-context，或首次工具调用时自动触发。
  保存位置：.ai/context.md（主文件）+ .ai/context-YYYY-MM-DD.md（日期归档）
triggers:
  - /save-context
  - 自动检测：首次工具调用时保存项目结构
---

# 保存上下文到 Context 文件

## Overview

手动或自动触发 skill，将会话核心内容保存到项目根目录 `.ai/` 目录下的 context 文件中。

**支持两种触发模式**：
- **手动触发**：用户输入 `/save-context`
- **自动触发**：首次工具调用时自动保存项目结构

## 触发条件

### 手动触发

- 用户输入 `/save-context`
- 用户输入 `save-context` skill 命令

### 自动触发（首次工具调用时）

通过 PostToolUse Hook 实现：
1. 用户首次执行任何工具（Bash/Read/Edit/Write/Glob/Grep）
2. 检查 `.ai/.context-initialized` 标记文件是否存在
3. 如不存在，执行本 skill 保存项目结构
4. 创建标记文件防止重复保存

## 支持的触发格式

| 输入格式 | 触发方式 | 保存位置 |
|---------|---------|---------|
| `/save-context` | 手动 | `.ai/context.md` + `.ai/context-YYYY-MM-DD.md` |
| 首次工具调用 | 自动 | `.ai/context.md` + `.ai/context-YYYY-MM-DD.md` |

## Core Actions

### 1. 检查初始化标记

```javascript
// 检查 .ai/.context-initialized 是否存在
// 如不存在，说明是首次触发，需要保存项目结构
```

### 2. 分析会话内容

**分析当前对话历史，识别核心内容**：

1. **读取项目背景**
   - 读取 `.ai/context.md`（如存在）了解已有重点
   - 识别已有重点类型和模块

2. **分析对话，识别核心内容**
   - 架构决策（Architecture）
   - 技术选型/规范（API、Auth、Database 等）
   - 性能优化决策
   - 重要约束条件
   - 项目结构概述

3. **提炼核心要点**
   - 提取关键技术决策
   - 总结重要约束或规范
   - 过滤临时性、过于细节的内容
   - 转换为正式的技术描述

### 3. 确定目标文件

1. 获取当前项目的根目录路径
2. 检查 `.ai` 目录是否存在，不存在则创建
3. 目标文件：
   - `.ai/context.md`（主文件）
   - `.ai/context-YYYY-MM-DD.md`（日期归档）

### 4. 读取或创建文件

**如果文件不存在**，创建新文件并写入标题：

```markdown
# 项目重点

## {日期}

### 项目结构
- {目录/文件结构概览}
```

### 5. 追加内容

**主文件格式 (context.md):**
```markdown
## 2026-04-02

### 项目结构
- skills/ - 技能定义目录
- commands/ - 命令定义目录
- .ai/ - AI上下文存储目录

### 架构决策
- [Architecture] 采用多模块结构组织技能和命令
```

**日期归档格式 (context-YYYY-MM-DD.md):**
```markdown
# 项目重点 - 2026-04-02

> 本文件为自动归档，保存当日所有重点内容

- 项目结构：skills/, commands/, .ai/
```

### 6. 创建初始化标记

自动触发时，创建 `.ai/.context-initialized` 标记文件：

```markdown
# Context 初始化标记
# 本文件用于标记项目结构已保存，防止重复保存
initialized: true
initialized_at: 2026-04-02
```

## 文件格式示例

### 主文件 - .ai/context.md

```markdown
# 项目重点

## 2026-04-02

### 项目结构
- skills/ - 技能定义目录（包含各技能的 SKILL.md）
- commands/ - 命令定义目录
- .ai/ - AI上下文存储目录
- 根目录包含 CLAUDE.md 等配置文件

### 架构决策
- [Architecture] 采用多模块结构组织技能和命令
- [Architecture] 技能和命令支持多语言（-en.md, -zh.md）

### 技术规范
- [API] 所有 API 必须返回统一响应格式 { code, message, data }
- [API] RESTful API 使用名词复数形式

## 2026-03-17

- 每个命令/技能需要创建 3 个文件
```

### 日期归档 - .ai/context-2026-04-02.md

```markdown
# 项目重点 - 2026-04-02

> 本文件为自动归档，保存当日所有重点内容

### 项目结构
- skills/ - 技能定义目录
- commands/ - 命令定义目录
- .ai/ - AI上下文存储目录

### 架构决策
- [Architecture] 采用多模块结构组织技能和命令
```

### 初始化标记 - .ai/.context-initialized

```markdown
# Context 初始化标记
# 本文件用于标记项目结构已保存，防止重复保存
initialized: true
initialized_at: 2026-04-02
```

## 实现步骤

### 手动触发 (/save-context)

1. 读取现有 `.ai/context.md` 了解项目背景
2. 分析当前对话历史，提取核心技术内容
3. 生成预览内容
4. 等待用户确认
5. 写入 `.ai/context.md` 和 `.ai/context-YYYY-MM-DD.md`
6. 告知用户保存结果

### 自动触发（首次工具调用）

1. PostToolUse Hook 检测到工具执行
2. 检查 `.ai/.context-initialized` 是否存在
3. 如不存在，执行以下步骤：
   - 扫描项目结构
   - 生成项目结构概述
   - 写入 `.ai/context.md`
   - 创建 `.ai/context-YYYY-MM-DD.md`
   - 创建 `.ai/.context-initialized` 标记文件
4. 不询问用户，直接保存

## 确认机制

### 自动触发时

**不询问用户**，直接保存（无打扰）

### 手动触发时

展示预览，等待确认：

```
📝 即将保存以下内容：

【.ai/context.md】
- [Architecture] 采用多模块结构组织技能和命令

【.ai/context-2026-04-02.md】
- [Architecture] 采用多模块结构组织技能和命令

确认请回复"确认"或"y"，取消请回复"取消"或"n"
```

## 错误处理

- 如果无法创建目录，提示用户检查权限
- 如果无法写入文件，提示用户检查文件权限
- 如果是自动触发且失败，记录错误但不打扰用户

## 内容分类标签

| 标签 | 含义 |
|------|------|
| `[Architecture]` | 架构决策 |
| `[API]` | 接口规范 |
| `[Auth]` | 认证授权 |
| `[Database]` | 数据库相关 |
| `[Performance]` | 性能优化 |
| `[Security]` | 安全相关 |
| `[Project]` | 项目结构 |

## 最佳实践

### 首次保存（自动触发）

当首次工具调用触发时，保存项目结构概述：

```
### 项目结构
- skills/ - 技能定义目录
- commands/ - 命令定义目录
- .ai/ - AI上下文存储目录
- 根目录包含 CLAUDE.md 等配置文件
```

### 后续保存（手动触发）

用户通过 `/save-context` 手动触发时，提炼会话中的核心技术决策：

```
### 架构决策
- [Architecture] 采用 CQRS 模式分离读写操作

### 接口规范
- [API] RESTful API 使用名词复数形式
```
