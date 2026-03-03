# lvdaxianerplus-skills

A collection of OpenCode skills for Claude to enhance code quality and development workflow.

## About

This repository contains custom skills designed for **Claude Code (OpenCode)** - an AI-powered CLI tool that helps developers with software engineering tasks.

### What is OpenCode?

**OpenCode** (formerly Claude Code) is an AI assistant that integrates with your development workflow. It can:
- Write and edit code
- Execute commands
- Search and navigate codebases
- Execute complex multi-step tasks

Visit [opencode.ai](https://opencode.ai) to learn more.

## Skills Included

### 1. Code Formatting After AI Generation

Automatically formats and cleans up code after AI generates it.

**Features:**
- Remove unused imports
- Sort imports alphabetically
- Remove unused private methods
- Add missing Javadoc comments

**Supported Languages:**
- Java
- JavaScript / TypeScript
- Python
- Go

**Installation:**

```bash
# Clone this repository
git clone https://github.com/your-username/lvdaxianerplus-skills.git

# Copy the skill to OpenCode's skills directory
cp -r formatting-code ~/.config/opencode/skills/

# Restart OpenCode/Claude Code to load the new skill
```

**Usage:**

After Claude generates code, use this skill to:
1. Clean up unused imports
2. Organize import statements
3. Remove dead code
4. Add documentation comments

The skill will automatically trigger when needed or can be invoked manually:
```
Use the code-formatting-after-ai-generation skill
```

## Directory Structure

```
lvdaxianerplus-skills/
├── formatting-code/
│   └── SKILL.md          # Code formatting skill
├── README.md             # English documentation
├── README-zh.md          # Chinese documentation
└── LICENSE               # MIT License
```

## How to Install Skills

### Method 1: Copy to Skills Directory

```bash
# Find your OpenCode skills directory
ls ~/.config/opencode/skills/

# Copy skill folder
cp -r /path/to/your-skill ~/.config/opencode/skills/
```

### Method 2: Symlink

```bash
ln -s /path/to/your-skill ~/.config/opencode/skills/your-skill
```

### Method 3: Clone to Skills Directory

```bash
cd ~/.config/opencode/skills/
git clone https://github.com/your-username/lvdaxianerplus-skills.git
```

## Requirements

- **OpenCode / Claude Code** - Install from [opencode.ai](https://opencode.ai)
- **Supported Languages:** Java, JavaScript, TypeScript, Python, Go
- **Optional Tools:**
  - ESLint (for JavaScript/TypeScript)
  - google-java-format (for Java)
  - isort (for Python)
  - goimports (for Go)

## Contributing

Contributions are welcome! Please feel free to:
- Submit issues
- Create pull requests
- Share your own skills

## License

MIT License - see [LICENSE](LICENSE) file for details.

---

**Built with Claude Code (OpenCode)** 🤖
