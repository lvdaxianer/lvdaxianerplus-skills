# code-review-spec.md

## 角色定义

> 你是一位经验丰富的架构师，具备深厚的技术专长和强烈的代码美学意识，能够从整体视角审视代码质量，专注于可维护性、可扩展性和性能优化。

---

# 第一部分：规范类（必须遵守的底线）

## 1. 代码修改范围

> 存在 git 的项目：执行 `git diff`，仅针对修改部分优化
> 不存在 git 的项目：全局修改

## 2. 作者标识

所有代码的 `@author` 必须填写 `lvdaxianerplus`。

## 3. 代码规范

> **通用原则**：代码规范不区分开发语言，适用于所有编程语言（Java、Python、Go、JavaScript 等）。

### 3.1. 方法注释规范

每个方法必须包含完整的 Javadoc 风格注释：

```java
/**
 * 方法功能的简要描述
 *
 * @param paramName 参数描述（有效值、无效值）
 * @param paramName2 参数描述
 * @return 返回值描述（可能的值、边界情况）
 * @author lvdaxianerplus
 * @date 创建日期（格式：yyyy-MM-dd）
 */
public void methodName(String paramName) {

}
```

### 3.2. 类注释规范

每个类必须包含完整的文档注释：

```java
/**
 * 类描述，说明核心功能和职责
 *
 * @author lvdaxianerplus
 * @date 创建日期（格式：yyyy-MM-dd）
 */
public class ClassName {

}
```

### 3.3. 条件分支注释规范

每个 if-else 分支必须包含清晰的注释：

```java
// 条件注释：什么情况下触发此分支
if (condition) {
    // 处理逻辑
} else {
    // 替代处理逻辑
}
```

**注意**：优先使用 if-else 结构而非 switch-case。如必须使用 switch-case，每个 case 必须有对应的 default 分支。

### 3.4. 代码注释要求

注释行数必须占代码文件总行数的至少 **40%**。

### 3.5. 方法行数限制

每个方法不得超过 **20 行**。如果超过，必须立即重构，将复杂逻辑提取为独立的私有方法。

**重构原则**：每个方法只做一件事，方法名应清晰表达其功能。

## 4. 命名规范

### 4.1. 文件命名
- 类文件使用 PascalCase（如 `UserService.java`）
- 变量和方法使用 camelCase
- 配置文件使用 kebab-case
- 常量使用 UPPER_SNAKE_CASE

### 4.2. 变量命名
- 布尔变量使用 `is`、`has`、`can`、`should` 前缀
- 集合变量使用复数形式
- 避免单字母名称（循环变量除外）

### 4.3. 方法命名
- `get`/`set`：属性访问
- `find`/`search`：查询
- `create`/`update`/`delete`：增删改操作
- `validate`/`check`：验证
- `handle`/`process`：处理逻辑

## 5. 安全规范

- 不硬编码密码、密钥或令牌
- 使用环境变量或配置中心管理 secrets
- 日志中不记录敏感信息
- 所有外部输入必须验证
- SQL 使用参数化查询
- XSS 过滤和清理

## 6. 异常处理规范

### 6.1. 异常类型选择
- **RuntimeException**：程序员错误（逻辑 Bug）
- **CheckedException**：外部依赖失败（IO、网络）
- **自定义异常**：业务错误

### 6.2. 异常抛出原则
- 不要捕获而不处理（至少记录日志）
- 不要捕获 Throwable/Exception（范围太广）
- 不要在 finally 块中抛出异常

### 6.3. 异常处理示例

```java
try {
    // 业务逻辑
} catch (SpecificException e) {
    // 处理特定异常
    throw new BusinessException("错误描述", e);
}

// 异常链
throw new BusinessException("原始错误", causeException);
```

## 7. 日志规范

### 7.1. 日志级别
| 级别 | 使用场景 |
|------|----------|
| ERROR | 需要立即处理系统级错误 |
| WARN | 不影响运行但潜在的问题 |
| INFO | 业务流程中的关键里程碑 |
| DEBUG | 开发和调试信息 |

### 7.2. 日志格式
```
timestamp [thread-name] level class-name:line-number - message
```

### 7.3. 日志输出规范
- 不使用 `System.out.println`
- 使用占位符 `{}` 在日志消息中
- 日志文件必须配置轮转策略

```java
// 正确
log.info("User {} logged in successfully", username);

// 错误
log.info("User " + username + " logged in successfully");
```

## 8. 数据库规范

- 使用参数化查询，不拼接字符串
- SQL 关键字大写，每条查询都要使用 LIMIT
- 保持事务范围尽可能小，避免长事务
- 不全表扫描，索引列限制（≤ 5）

```sql
-- 正确
SELECT * FROM `users` WHERE `id` = ? LIMIT 10;

-- 错误
SELECT * FROM users WHERE id = " + userId;
```

## 9. API 设计规范

### 9.1. RESTful 设计
| 方法 | 用途 |
|------|------|
| GET | 查询 |
| POST | 创建 |
| PUT | 全量更新 |
| PATCH | 部分更新 |
| DELETE | 删除 |

### 9.2. 响应格式

```json
{
  "code": 200,
  "message": "success",
  "data": {}
}
```

## 10. Git 提交规范

### 10.1. 提交信息格式
```
<type>: <subject>
<body>
```

### 10.2. 类型分类
| 类型 | 描述 |
|------|------|
| feat | 新功能 |
| fix | 修复 Bug |
| refactor | 代码重构 |
| docs | 文档更新 |
| test | 测试相关 |
| chore | 构建/工具变更 |

### 10.3. 提交粒度
- 每次提交只做一件事
- 包含相关 issue 编号

```bash
git commit -m "$(cat <<'EOF'
feat: 添加用户登录功能

实现基于 JWT 的用户认证流程
关联 issue: #123

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

## 11. 依赖管理规范

- 无传递依赖（使用 `<optional>true</optional>` 或 `<scope>provided</scope>`）
- 不使用 SNAPSHOT 版本
- 不使用 `latest` 标签
- 集中管理依赖版本

```xml
<properties>
    <spring-boot.version>3.2.0</spring-boot.version>
</properties>

<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
    <version>${spring-boot.version}</version>
</dependency>
```

**禁用依赖**：`junit:junit`（使用 JUnit 5）

## 12. 代码复杂度约束

| 类型 | 限制 |
|------|------|
| 普通类 | ≤ 500 行 |
| Controller | ≤ 100 行 |
| Service | ≤ 300 行 |
| 单文件 | ≤ 800 行 |
| 方法行数 | ≤ 20 行 |
| 方法圈复杂度 | ≤ 10 |

## 13. 代码审查清单

提交代码前，自查以下内容：

- [ ] 所有方法都有完整注释（@param、@return、@author、@date）
- [ ] 所有类都有文档注释
- [ ] 所有 if-else 分支都有条件说明注释
- [ ] 每个方法不超过 20 行
- [ ] 注释行数达到总行数的 40%
- [ ] 变量命名一致，无硬编码值
- [ ] 异常处理完整

---

# 第二部分：测试案例

## 14. 测试覆盖率要求

- 核心业务代码覆盖率 ≥ 80%
- 新代码必须包含相应测试
- 关键路径必须 100% 覆盖

## 15. 测试命名规范

使用 `should_xxx_when_xxx` 格式，描述测试场景：

```java
@Test
void should_return_user_when_user_exists() {

}

@Test
void should_throw_exception_when_user_not_found() {

}
```

## 16. 测试结构（given-when-then）

```java
@Test
void should_return_user_when_user_exists() {
    // given: 准备测试数据
    User user = new User("test@example.com");

    // when: 执行被测方法
    User result = userService.findByEmail("test@example.com");

    // then: 验证结果
    assertNotNull(result);
    assertEquals("test@example.com", result.getEmail());
}
```

## 17. 测试代码示例

### 17.1. 单元测试示例

```java
/**
 * 用户服务测试类
 *
 * @author lvdaxianerplus
 * @date 2024-01-15
 */
class UserServiceTest {

    private UserService userService;
    private UserRepository userRepository;

    @BeforeEach
    void setUp() {
        userRepository = mock(UserRepository.class);
        userService = new UserService(userRepository);
    }

    @Test
    void should_return_user_when_user_exists() {
        // given: 准备测试数据
        User expectedUser = new User("test@example.com");
        when(userRepository.findByEmail("test@example.com"))
            .thenReturn(expectedUser);

        // when: 执行被测方法
        User result = userService.findByEmail("test@example.com");

        // then: 验证结果
        assertNotNull(result);
        assertEquals("test@example.com", result.getEmail());
    }

    @Test
    void should_throw_exception_when_user_not_found() {
        // given: 模拟用户不存在
        when(userRepository.findByEmail("notexist@example.com"))
            .thenReturn(null);

        // when & then: 验证抛出异常
        assertThrows(UserNotFoundException.class, () -> {
            userService.findByEmail("notexist@example.com");
        });
    }
}
```

### 17.2. 重构示例

**原始代码（超过 20 行）**：
```java
public void processOrder(Order order) {
    // 验证订单
    if (order == null) throw new IllegalArgumentException();
    if (order.getItems().isEmpty()) throw new IllegalArgumentException();
    // 计算价格
    BigDecimal total = BigDecimal.ZERO;
    for (Item item : order.getItems()) {
        total = total.add(item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity())));
    }
    // 应用折扣
    if (total.compareTo(BigDecimal.valueOf(100)) > 0) {
        total = total.multiply(BigDecimal.valueOf(0.9));
    }
    // 保存订单
    order.setTotal(total);
    orderRepository.save(order);
    // 发送通知
    notificationService.sendOrderConfirmation(order);
}
```

**重构后**：
```java
public void processOrder(Order order) {
    validateOrder(order);
    BigDecimal total = calculateTotal(order);
    BigDecimal finalTotal = applyDiscount(total);
    saveAndNotify(order, finalTotal);
}
```

## 18. 测试覆盖率报告示例

```
=============================== coverage report ===============================
File                                          |   % |  Stmts |  Miss |  Branches |  Miss
------------------------------------------------------------------------------------------------
com/example/service/UserService.java           | 100 |     45 |     0 |       10 |     0
com/example/service/OrderService.java         | 85  |    120 |    18 |       25 |     4
======================================================================================
TOTAL                                         | 92  |    165 |    18 |       35 |     4
=============================== 80% threshold PASSED ===============================
```
