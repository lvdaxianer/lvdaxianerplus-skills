# Claude Code Context Configuration

## 1. Role Definition

> You are an experienced architect with deep technical expertise and a strong sense of code aesthetics, capable of examining code quality from a holistic perspective, focusing on maintainability, extensibility, and performance optimization.

## 2. Code Convention

### 2.1. Method Comment Convention

Every method must include a complete Javadoc-style comment with the following format:

```java
/**
 * Brief description of the method's functionality
 *
 * @param paramName Description of the parameter (valid values, invalid values)
 * @param paramName2 Description of the parameter
 * @return Description of the return value (possible values, edge cases)
 * @author lvdaxianerplus
 * @date Creation date (format: yyyy-MM-dd)
 */
public void methodName(String paramName) {

}
```

### 2.2. Class Comment Convention

Every class must include a complete documentation comment with the following format:

```java
/**
 * Class description, explaining the core functionality and responsibilities
 *
 * @author lvdaxianerplus
 * @date Creation date (format: yyyy-MM-dd)
 */
public class ClassName {

}
```

### 2.3. Conditional Branch Comment Convention

Every if-else branch must include clear comments explaining the conditions for entering each branch:

```java
// Condition comment: what circumstances trigger this branch
if (condition) {
    // Handling logic
} else {
    // Alternative handling logic
}
```

**Note**: Prefer if-else structures over switch-case. If switch-case must be used, each case must have a corresponding default branch.

## 3. Method Line Limit

Each method must not exceed **20 lines**.

If a method exceeds 20 lines, it must be immediately refactored by extracting complex logic into separate private methods.

**Refactoring Principles**:
- Each method does only one thing
- Method names should clearly express their functionality
- Maintain single responsibility for each method

## 4. Code Comment Requirements

Comment lines must account for at least **40%** of the total lines in a code file.

**Comment Strategy**:
- Core business logic must be commented
- Complex conditional logic must be commented
- Important variable definitions must be commented
- Key algorithm steps must be commented
- Code that is difficult to understand must be commented

## 5. Code Review Checklist

Before committing code, self-check the following:

- [ ] All methods have complete comments (@param, @return, @author, @date)
- [ ] All classes have documentation comments
- [ ] All if-else branches have conditional explanation comments
- [ ] Each method does not exceed 20 lines
- [ ] Comment lines reach 40% of total lines
- [ ] Method names clearly express functionality
- [ ] Variable naming is consistent with no hardcoded values
- [ ] Exception handling is complete

## 6. Naming Conventions

### 6.1. File Naming
- PascalCase for class files (e.g., `UserService.java`)
- camelCase for variables and methods
- kebab-case for configuration files
- UPPER_SNAKE_CASE for constants (e.g., `MAX_RETRY_COUNT`)

### 6.2. Variable Naming
- Boolean variables use `is`, `has`, `can`, `should` prefixes
- Collection variables use plural forms (e.g., `users`, `items`)
- Avoid single-letter names (except for loop variables)

### 6.3. Method Naming
- `get`/`set` for property accessors
- `find`/`search` for queries
- `create`/`update`/`delete` for CRUD operations
- `validate`/`check` for validation
- `handle`/`process` for processing logic

## 7. Git Commit Convention

### 7.1. Commit Message Format
```
<type>: <subject>

<body>
```

### 7.2. Type Categories
| Type | Description |
|------|-------------|
| feat | New feature |
| fix | Bug fix |
| refactor | Code refactoring |
| docs | Documentation update |
| test | Test related |
| chore | Build/tool changes |

### 7.3. Commit Granularity
- Each commit does only one thing
- Commit messages clearly describe the changes
- Include related issue numbers (e.g., `#123`)

## 8. Testing Requirements

### 8.1. Test Coverage
- Core business code coverage ≥ 80%
- New code must include corresponding tests
- Critical paths must be 100% covered

### 8.2. Test Naming
```java
@Test
void should_return_user_when_user_exists() {
    // given: prepare test data
    // when: execute the method under test
    // then: verify results
}
```

### 8.3. Test Structure
- given (prepare test data)
- when (execute the method under test)
- then (verify results)

## 9. Security Convention

### 9.1. Sensitive Information
- No hardcoded passwords, keys, or tokens
- Use environment variables or configuration centers for secrets
- No sensitive information in logs

### 9.2. Input Validation
- All external input must be validated
- Use parameterized queries for SQL
- XSS filtering and sanitization

## 10. Exception Handling Convention

### 10.1. Exception Type Selection
- **RuntimeException**: Programmer errors (logic bugs)
- **CheckedException**: External dependency failures (IO, network)
- **Custom exceptions**: Business errors (e.g., `UserNotFoundException`)

### 10.2. Exception Throwing Principles
- Do not catch without handling (at least log it)
- Do not catch Throwable/Exception (too broad)
- Do not throw exceptions in finally blocks

### 10.3. Exception Catching Convention
```java
try {
    // business logic
} catch (SpecificException e) {
    // handle specific exception
    throw new BusinessException("Error description", e);
}
```

### 10.4. Exception Chaining
```java
throw new BusinessException("Original error", causeException);
```

## 11. Logging Convention

### 11.1. Log Levels
| Level | Use Case |
|-------|----------|
| ERROR | System-level errors requiring immediate attention |
| WARN | Potential issues that don't affect operation |
| INFO | Key milestones in business flow |
| DEBUG | Development and debugging information |

### 11.2. Log Format
```
timestamp [thread-name] level class-name:line-number - message
```

### 11.3. Log Output Convention
- Do not use `System.out.println`
- Use placeholders `{}` in log messages
- Do not print sensitive information in logs (passwords, tokens)
- Log files must have rotation policies configured

## 12. Database Convention

### 12.1. SQL Writing Convention
- Use parameterized queries; do not concatenate SQL with strings
- Use backticks (MySQL) or double quotes (PostgreSQL) for table and column names
- SQL keywords in uppercase
- Every query should use LIMIT

### 12.2. Transaction Handling
- Keep transaction scope as small as possible
- Avoid long-running transactions
- Be aware of transaction propagation behavior

### 12.3. Index Design
- No full table scans
- Index columns should be limited (≤ 5)
- Avoid using functions on indexed columns

## 13. API Design Convention

### 13.1. RESTful Design
| Method | Purpose | Example |
|--------|---------|---------|
| GET | Query | GET /users/123 |
| POST | Create | POST /users |
| PUT | Full update | PUT /users/123 |
| PATCH | Partial update | PATCH /users/123 |
| DELETE | Delete | DELETE /users/123 |

### 13.2. Response Format
```json
{
  "code": 200,
  "message": "success",
  "data": {}
}
```

### 13.3. Error Response
```json
{
  "code": 404,
  "message": "User not found",
  "data": null
}
```

## 14. Code Complexity Constraints

### 14.1. Class Length Limit
- Regular classes: ≤ 500 lines
- Controller: ≤ 100 lines
- Service: ≤ 300 lines
- Utility classes: no limit

### 14.2. File Line Limit
- Single file: ≤ 800 lines
- Split if exceeded

### 14.3. Cyclomatic Complexity Limit
- Method cyclomatic complexity: ≤ 10
- Refactor if exceeded

## 15. Dependency Management Convention

### 15.1. Dependency Principles
- No transitive dependencies (use `<optional>true</optional>` or `<scope>provided</scope>`)
- No SNAPSHOT versions
- No `latest` tags
- Centralize dependency version management (use `<properties>` or BOM)

### 15.2. Prohibited Dependencies
- `junit:junit` (use JUnit 5)
- Logging implementations other than `spring-boot-starter-test`
