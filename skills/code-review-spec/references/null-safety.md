# 空值处理规范示例（Null Safety）

> **通用原则**：禁止直接返回 `null`，必须使用语言提供的空值安全机制。

## Java

### 使用 Optional 包装返回值

```java
// 错误：直接返回 null
public User findUserById(Long id) {
    User user = userRepository.findById(id);
    return user;  // 可能返回 null
}

// 正确：使用 Optional 包装
public Optional<User> findUserById(Long id) {
    return userRepository.findById(id);
}

// 正确：调用方使用 Optional 处理
public String getUserName(Long id) {
    return findUserById(id)
        .map(User::getName)
        .orElse("匿名用户");  // 提供默认值
}

// 正确：使用 Optional 的链式调用
public Optional<String> getUserEmail(Long id) {
    return findUserById(id)
        .filter(User::isActive)
        .map(User::getEmail);
}
```

### Optional 使用规范

```java
// 错误：直接调用 get()，可能抛出 NoSuchElementException
Optional<User> user = findUserById(id);
User result = user.get();  // 危险！

// 正确：使用 orElse() 提供默认值
User result = user.orElse(new User());

// 正确：使用 orElseThrow() 提供明确异常
User result = user.orElseThrow(() -> new UserNotFoundException(id));

// 正确：使用 ifPresent() 进行条件操作
user.ifPresent(u -> log.info("找到用户: {}", u.getName()));

// 错误：Optional 作为参数传入
public void processUser(Optional<User> user) { ... }  // 不推荐

// 正确：参数直接传对象，方法内处理空值
public void processUser(User user) {
    if (user == null) {
        // 处理空值情况
        return;
    }
    // 正常处理
}
```

## TypeScript

### 严格空值检查

```typescript
// 错误：未声明可能的空值
function findUserById(id: number): User {
    return users.find(u => u.id === id);  // 返回 User | undefined
}

// 正确：显式声明返回类型
function findUserById(id: number): User | undefined {
    return users.find(u => u.id === id);
}

// 正确：调用方处理 undefined
function getUserName(id: number): string {
    const user = findUserById(id);
    if (user === undefined) {
        return "匿名用户";  // 提供默认值
    }
    return user.name;
}

// 正确：使用可选链和空值合并
const userName = findUserById(id)?.name ?? "匿名用户";
const userEmail = user?.profile?.email ?? "";  // 多层可选链
```

### 类型声明规范

```typescript
// 错误：隐式 any 或不确定类型
let result;  // 类型为 any

// 正确：显式声明可能为空
let result: User | null = null;
let items: User[] | undefined;

// 正确：使用可选属性
interface User {
    id: number;
    name: string;
    email?: string;  // 可选属性，可能为 undefined
}

// 正确：函数参数可选声明
function updateUser(id: number, name?: string): void {
    const finalName = name ?? "默认名称";
}
```

## Python

### 使用 Optional 类型注解

```python
from typing import Optional

# 错误：返回类型不明确
def find_user_by_id(user_id: int):
    return user_repository.find(user_id)  # 可能返回 None

# 正确：显式声明 Optional
def find_user_by_id(user_id: int) -> Optional[User]:
    return user_repository.find(user_id)

# 正确：调用方处理 None
def get_user_name(user_id: int) -> str:
    user = find_user_by_id(user_id)
    if user is None:
        return "匿名用户"  # 提供默认值
    return user.name

# 正确：使用 3.10+ 语法
def find_user_by_id(user_id: int) -> User | None:
    return user_repository.find(user_id)
```

### None 检查规范

```python
# 错误：隐式布尔检查（可能误判空列表/空字符串）
if not user:
    pass  # None、[]、""、" 都会进入

# 正确：显式 None 检查
if user is None:
    pass

# 错误：与 None 使用 == 比较
if user == None:
    pass

# 正确：使用 is 比较
if user is None:
    pass

# 正确：使用 Walrus Operator (Python 3.8+)
if (user := find_user_by_id(id)) is not None:
    print(f"找到用户: {user.name}")
```

## Go

### 返回错误而非 nil 指针

```go
// 错误：返回 nil 指针
func FindUserByID(id int64) *User {
    user, _ := userRepository.Find(id)
    return user  // 可能返回 nil
}

// 正确：返回值 + 错误
func FindUserByID(id int64) (User, error) {
    user, err := userRepository.Find(id)
    if err != nil {
        return User{}, err  // 返回零值 + 错误
    }
    return user, nil
}

// 正确：调用方处理错误
func GetUserName(id int64) string {
    user, err := FindUserByID(id)
    if err != nil {
        return "匿名用户"  // 提供默认值
    }
    return user.Name
}

// 正确：定义明确错误类型
var ErrUserNotFound = errors.New("用户不存在")

func FindUserByID(id int64) (User, error) {
    user, err := userRepository.Find(id)
    if err != nil {
        return User{}, ErrUserNotFound
    }
    return user, nil
}
```

### 指针使用规范

```go
// 正确：结构体零值有效时，返回值而非指针
type Config struct {
    Timeout int
    Retry   int
}

func DefaultConfig() Config {
    return Config{Timeout: 30, Retry: 3}  // 返回值
}

// 正确：必须区分"未设置"和"零值"时，使用指针
type Options struct {
    Timeout *int  // nil 表示未设置
    Retry   *int
}

func ParseOptions(input string) Options {
    // 当用户未指定时，保持 nil
    return Options{}
}

// 正确：检查指针是否为 nil
func ApplyTimeout(opts Options) int {
    if opts.Timeout == nil {
        return 30  // 使用默认值
    }
    return *opts.Timeout
}
```

## 空值处理原则

### 返回值规范

| 场景 | Java | TypeScript | Python | Go |
|------|------|------------|--------|-----|
| 可能不存在 | `Optional<T>` | `T | undefined` | `Optional[T]` | `(T, error)` |
| 明确不存在 | `orElseThrow()` | 抛出异常 | 抛出异常 | 返回错误 |
| 提供默认值 | `orElse(default)` | `?? default` | `if None: default` | 处理错误返回默认 |

### 参数规范

| 场景 | 规范 |
|------|------|
| 必须存在 | 类型声明不含空值，方法内校验 |
| 可选参数 | 使用 Optional/可选语法，或提供默认值 |
| 禁止 Optional 作为参数 | Java: 参数不用 Optional，直接传对象 |

### 检查规范

| 语言 | 正确方式 | 错误方式 |
|------|----------|----------|
| Java | `Optional.isPresent()` | `optional.get()` 直接调用 |
| TypeScript | `=== undefined` / `=== null` | `== null`（宽松相等） |
| Python | `is None` | `== None` / `if not x` |
| Go | `== nil`（指针） | 隐式忽略错误返回值 |