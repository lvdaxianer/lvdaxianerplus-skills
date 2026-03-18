---
description: AI-assisted code merging tool that analyzes commit history and intelligently recommends commits to merge
---

# Claude Command: Git Merge

AI-assisted code merging tool. Analyzes commit history and code changes through AI, intelligently recommends commits to merge, making selective merging more efficient.

## Usage

### Quick Mode (Recommended)

```bash
/git-merge -t main                    # Merge 1 commit from current branch to main (default -c=1)
/git-merge -t main -c 2               # Merge 2 commits from current branch to main
/git-merge -t main -c 3 -m rebase    # Use rebase mode, merge 3 commits
/git-merge -s feature-A -t main       # Merge 1 commit from feature-A to main
/git-merge -s feature-A -t main -c 2  # Merge 2 commits from feature-A to main
```

### Interactive Mode

```bash
/git-merge                    # Full interactive selection
```

## Arguments

| Argument | Short | Description | Values | Required | Default |
|----------|-------|-------------|--------|----------|---------|
| `--target` | `-t` | Target branch (branch to merge into) | branch name | Yes in quick mode* | none |
| `--source` | `-s` | Source branch (containing commits to merge) | branch name | No | current branch |
| `--count` | `-c` | Number of recent commits to merge | number | No | 1 |
| `--mode` | `-m` | Merge method | `pick` / `rebase` | No | `pick` |

*Required in quick mode (when -t is provided)

### --mode Values

| Value | Description |
|-------|-------------|
| `pick` | Cherry-pick, does not change target branch history (default) |
| `rebase` | Rebase onto target branch, linear history |

## Argument Processing Logic

### Mode Detection

```
If -t/--target is provided:
    → Quick mode
Else:
    → Interactive mode (pure /git-merge)
```

### Quick Mode Logic

```
1. -t/--target required → error if not provided
2. -s/--source optional, defaults to current branch
3. -c/--count optional, defaults to 1
4. -m/--mode optional, defaults to pick
5. Validate branch exists
6. Get commit list (AI analyzes commit content)
7. AI recommends commits to merge
8. Execute merge
```

### Interactive Mode Logic

```
1. -s/--source → dropdown selection
2. -t/--target → dropdown selection
3. AI analyzes source branch commit history and change content
4. AI intelligently recommends commits to merge (multi-select via checkboxes)
5. -m/--mode → dropdown selection
6. Confirm execution
7. Execute merge
```

## Step 1: Pre-check - Validate Git Repository

```bash
git rev-parse --is-inside-work-tree
```

**If not a git repository:** Error and exit.

## Step 2: Get Branch List

```bash
git branch -a --format='%(refname:short)'
```

## Step 3: Get Current Branch

```bash
git branch --show-current
```

---

## Quick Mode Execution Flow

### Step A1: Validate Arguments

```bash
# Validate target branch exists
git show-ref --verify --quiet refs/heads/<target>

# Validate source branch exists (if specified)
git show-ref --verify --quiet refs/heads/<source>

# Validate count is positive integer (if provided)
[[ "<count>" =~ ^[1-9][0-9]*$ ]]
```

### Step A2: AI Analyze Commits

```bash
# Get recent N commits from source branch
git log <source> --oneline -<count> --format='%h|%s|%ad|%an' --date=short
```

**AI Analysis Content:**
- Read diff content of each commit
- Analyze commit relationships
- Identify functional modules and change scope
- Recommend most likely commits to merge

### Step A3: AI Recommend Commits

```
AI Analysis Results:

Recent 5 commits on source branch:

1. a1b2c3d feat(auth): add JWT validation middleware
   Changed files: src/middleware/auth.js, src/utils/jwt.js
   Recommendation: ✅ Recommended

2. e4f5g6h fix: fix login page style issue
   Changed files: src/views/login.vue
   Recommendation: ⚠️ Consider merging

3. i7j8k9l docs: update API documentation
   Changed files: docs/api.md
   Recommendation: ❌ Usually not needed

Accept AI recommendations?
- Yes: Merge recommended commits
- No: Show all commits for manual selection
```

### Step A4: Simplified Confirmation

Quick mode can execute directly, or with single confirmation:

```
About to execute Cherry-pick merge:

Source branch: <source>
Target branch: <target>
Merge method: <mode>
Commit count: <count>

AI recommends merging the following commits:
- <hash1> <message1>
- <hash2> <message2>
- ...

Confirm execution? Yes/No
```

### Step A5: Execute Merge

#### Cherry-pick Mode (Default)

```bash
# Switch to target branch
git checkout <target>

# Apply all changes at once (without committing)
git cherry-pick --no-commit <hash1> <hash2> ...

# Check for conflicts
git status --porcelain | grep -E '^U'
```

**If no conflicts:**
```bash
git commit -m "merge: cherry-pick <n> commits from <source>"
```

**If conflicts exist:**
- Jump to conflict handling flow

#### Rebase Mode

```bash
# Switch to source branch
git checkout <source>

# Execute rebase
git rebase <target>
```

### Step A6: Conflict Handling (Cherry-pick)

```bash
# Show conflict files
git diff --name-only --diff-filter=U
```

**Conflict Handling Flow:**

```
⚠️ Conflicts detected!

Conflict files:
- file1.js
- file2.css

Resolution steps:

1. Edit conflict files, remove conflict markers
2. git add .
3. git commit -m "merge: cherry-pick <n> commits from <source>"

Or abort:
- git cherry-pick --abort
```

### Step A7: Verify Result

```bash
# Show merged commit history
git log --oneline -5

# If current branch was modified, check status
git status
```

---

## Interactive Mode Execution Flow

### Step B1: Select Source Branch

Dropdown to select source branch:

```
Select source branch (branch containing commits to merge):
```

**Options:** All local branches

### Step B2: Select Target Branch

Dropdown to select target branch:

```
Select target branch (branch to merge into):
```

**Options:** All local branches (excluding source branch)

### Step B3: AI Analyze Source Branch Commits

```bash
git log <source> --oneline --format='%H|%s|%ai|%an' --date=short -n 50
```

**AI Analysis Content:**

```
AI Analysis of Source Branch Commits:

Found 12 commits, AI intelligently classifies:

🟢 High Relevance (recommended for priority merge)
  - abc1234 feat(auth): add JWT validation middleware
  - def5678 refactor(auth): simplify token validation logic

🟡 Medium Relevance (merge as needed)
  - ghi9012 fix: fix login page style issue
  - jkl3456 style: unify code formatting

🔴 Low Relevance (usually not merged)
  - mno7890 docs: update API documentation
  - pqr1234 chore: update dependency versions
```

### Step B4: AI Intelligently Recommend Commits

**Key: AI intelligently recommends based on commit content and relevance**

Checkbox selection for commits:

```
Based on AI analysis, recommend merging the following commits:

🟢 abc1234 feat(auth): add JWT validation middleware (2024-01-15)
   Changes: src/middleware/auth.js, src/utils/jwt.js
   Reason: Core functionality, no conflict with target branch

🟢 def5678 refactor(auth): simplify token validation logic (2024-01-15)
   Changes: src/utils/auth.js
   Reason: Refactors above functionality, depends on previous commit

🟡 ghi9012 fix: fix login page style issue (2024-01-14)
   Changes: src/views/login.vue
   Reason: Independent fix, can be merged separately

☑ Adopt all AI recommendations
☐ Custom selection
```

**Option Format:** `[hash] message (date)`
```
☑ abc1234 feat: add user login (2024-01-15)
☐ abc5678 fix: resolve memory leak (2024-01-14)
☑ abc9012 docs: update API docs (2024-01-13)
```

**Default:** Adopt AI recommendations

### Step B5: Select Merge Method

Dropdown selection:

```
Select merge method:
```

| Option | Description |
|--------|-------------|
| Cherry-pick | Does not change target branch history (recommended) |
| Rebase | Rebase onto target branch, linear history |

**Default:** Cherry-pick

### Step B6: Confirm Execution

```
About to execute merge:

Merge method: <mode>
Source branch: <source>
Target branch: <target>
AI recommends merging:
- <hash1> <message1>
- <hash2> <message2>
- ...

Confirm execution?
```

### Step B7: Execute Merge

#### Cherry-pick Mode

```bash
git checkout <target>
git cherry-pick --no-commit <hash1> <hash2> ...
```

#### Rebase Mode

```bash
git checkout <source>
git rebase <target>
```

### Step B8: Conflict Handling

Same as quick mode conflict handling flow.

### Step B9: Verify Result

```bash
git log --oneline -5
```

---

## Examples

### Example 1: Quick Mode - Basic Usage

```bash
/git-merge -t main
```

Result:
- Source branch: current branch
- Target branch: main
- Commit count: 1 (default)
- Merge method: Cherry-pick (default)
- AI automatically analyzes and recommends commits

### Example 2: Quick Mode - Specify Commit Count

```bash
/git-merge -t main -c 2
```

Result:
- Source branch: current branch
- Target branch: main
- Commit count: 2 (recent 2 commits from current branch)
- Merge method: Cherry-pick (default)
- AI analyzes recent 2 commits, recommends merge strategy

### Example 3: Quick Mode - Rebase

```bash
/git-merge -t develop -c 3 -m rebase
```

Result:
- Source branch: current branch
- Target branch: develop
- Commit count: 3
- Merge method: Rebase

### Example 4: Quick Mode - Specify Source Branch

```bash
/git-merge -s feature-auth -t main
```

Result:
- Source branch: feature-auth
- Target branch: main
- Commit count: 1 (default)
- Merge method: Cherry-pick (default)

### Example 5: Interactive Mode

```bash
/git-merge
```

Interactive flow:
1. Select source branch → feature-A
2. Select target branch → main
3. AI analyzes commits, intelligent recommendations
4. Adopt AI recommendations or custom selection
5. Select merge method → Cherry-pick
6. Confirm execution

---

## Error Handling

| Error | Cause | Solution |
|-------|-------|----------|
| Target branch does not exist | Branch specified by -t does not exist | Check branch name |
| Source branch does not exist | Branch specified by -s does not exist | Check branch name |
| Count is not positive integer | Value specified by -c is invalid | Use positive integer |
| Missing target | No -t parameter in quick mode | Add -t branch |
| fatal: bad object | Invalid commit hash | Re-fetch commit list |
| error: could not apply | Conflicts exist | Follow conflict handling flow |
| The previous cherry-pick | Merge already in progress | git cherry-pick --abort |

---

## Quick Mode vs Interactive Mode Comparison

| Feature | Quick Mode | Interactive Mode |
|---------|------------|-----------------|
| Command Example | `/git-merge -t main` | `/git-merge` |
| Source Branch | Current branch (or -s specified) | Dropdown selection |
| Target Branch | -t specified | Dropdown selection |
| Commit Selection | First N + AI recommendation | **AI intelligent recommendation** |
| Merge Method | -m specified (or default pick) | Dropdown selection |
| Question Count | 0-1 | 4-5 |
| Use Case | Know which commits to merge | Unsure which commits to merge |

---

## Notes

- AI recommendations are based on commit change content analysis, for reference only, final decision is up to the user
- Before merging, confirm target branch status to avoid overwriting others' work
- In interactive mode, AI analyzes each commit's functional relevance, recommends prioritizing high-relevance commits
- For complex merge scenarios, recommended to use interactive mode for more detailed AI analysis
