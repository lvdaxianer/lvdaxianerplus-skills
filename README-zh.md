# lvdaxianerplus-skills

一个为 OpenCode (Claude Code) 打造的技能集合，用于提升代码质量和开发工作流。

## 关于

本仓库包含为 **Claude Code (OpenCode)** 设计的自定义技能——一个帮助开发者完成软件工程任务的 AI CLI 工具。

### 什么是 OpenCode？

**OpenCode**（前身为 Claude Code）是一款集成到开发工作流中的 AI 助手，它可以：
- 编写和编辑代码
- 执行命令
- 搜索和浏览代码库
- 执行复杂的多步骤任务

访问 [opencode.ai](https://opencode.ai) 了解更多。

## 包含的技能

### 1. AI 代码生成后格式化

在 AI 生成代码后自动格式化和清理代码。

**功能：**
- 移除未使用的 import
- 按字母顺序排序 import
- 移除未使用的私有方法
- 添加缺失的 Javadoc 注释

**支持的语言：**
- Java
- JavaScript / TypeScript
- Python
- Go

**安装方法：**

```bash
# 克隆本仓库
git clone https://github.com/your-username/lvdaxianerplus-skills.git

# 将技能复制到 OpenCode 的 skills 目录
cp -r formatting-code ~/.config/opencode/skills/

# 重启 OpenCode/Claude Code 以加载新技能
```

**使用方法：**

在 Claude 生成代码后，使用此技能可以：
1. 清理未使用的 import
2. 整理 import 语句
3. 移除死代码
4. 添加文档注释

该技能会在需要时自动触发，也可以手动调用：
```
使用 code-formatting-after-ai-generation 技能
```

## 目录结构

```
lvdaxianerplus-skills/
├── formatting-code/
│   └── SKILL.md          # 代码格式化技能
├── README.md             # 英文文档
├── README-zh.md          # 中文文档
└── LICENSE               # MIT 许可证
```

## 如何安装技能

### 方法 1：复制到 Skills 目录

```bash
# 找到你的 OpenCode skills 目录
ls ~/.config/opencode/skills/

# 复制技能文件夹
cp -r /path/to/your-skill ~/.config/opencode/skills/
```

### 方法 2：创建符号链接

```bash
ln -s /path/to/your-skill ~/.config/opencode/skills/your-skill
```

### 方法 3：克隆到 Skills 目录

```bash
cd ~/.config/opencode/skills/
git clone https://github.com/your-username/lvdaxianerplus-skills.git
```

## 环境要求

- **OpenCode / Claude Code** - 从 [opencode.ai](https://opencode.ai) 安装
- **支持的语言：** Java、JavaScript、TypeScript、Python、Go
- **可选工具：**
  - ESLint（用于 JavaScript/TypeScript）
  - google-java-format（用于 Java）
  - isort（用于 Python）
  - goimports（用于 Go）

## 贡献

欢迎贡献！请随时：
- 提交问题
- 创建拉取请求
- 分享你自己的技能

## 许可证

MIT 许可证 - 详见 [LICENSE](LICENSE) 文件。

---

**使用 Claude Code (OpenCode) 构建** 🤖
