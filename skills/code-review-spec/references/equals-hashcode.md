# equals/hashCode 规范

> **强制要求**：重写 `equals` 方法时**必须**同时重写 `hashCode` 方法，否则会导致 Map/Set 行为异常。

## 为什么必须同时重写？

### 契约关系

`equals` 和 `hashCode` 有严格的契约关系：

1. **相等对象必须有相同的哈希值**
   - 如果 `a.equals(b)` 为 true，则 `a.hashCode() == b.hashCode()` 必须为 true

2. **哈希值相同不一定相等**
   - `a.hashCode() == b.hashCode()` 不保证 `a.equals(b)` 为 true（哈希冲突）

3. **一致性**
   - 多次调用 `hashCode` 必须返回相同值（对象未被修改）

### 不重写 hashCode 的后果

```java
// 错误：只重写 equals，不重写 hashCode
public class User {
    private Long id;
    private String name;
    
    @Override
    public boolean equals(Object obj) {
        if (this == obj) return true;
        if (obj == null || getClass() != obj.getClass()) return false;
        User user = (User) obj;
        return Objects.equals(id, user.id);
    }
    // 没有重写 hashCode！
}

// 问题：Map/Set 行为异常
User user1 = new User(1L, "张三");
User user2 = new User(1L, "李四");

// user1.equals(user2) 为 true（id 相同）
// 但 user1.hashCode() != user2.hashCode()（默认使用对象地址）

Set<User> userSet = new HashSet<>();
userSet.add(user1);
userSet.add(user2);
// Set 中会有两个"相等"的对象！违反 Set 定义

Map<User, String> userMap = new HashMap<>();
userMap.put(user1, "数据1");
userMap.put(user2, "数据2");
// Map 中会有两个键！无法正确查找
```

## Java 示例

### 正确实现方式

```java
// 正确：使用 Objects.equals 和 Objects.hash
public class User {
    private Long id;
    private String name;
    private String email;
    
    @Override
    public boolean equals(Object obj) {
        if (this == obj) return true;
        if (obj == null || getClass() != obj.getClass()) return false;
        User user = (User) obj;
        return Objects.equals(id, user.id) 
            && Objects.equals(name, user.name)
            && Objects.equals(email, user.email);
    }
    
    @Override
    public int hashCode() {
        return Objects.hash(id, name, email);
    }
}

// 正确：使用 IDE 生成（完整版本）
public class User {
    private Long id;
    private String name;
    
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        User user = (User) o;
        return Objects.equals(id, user.id) 
            && Objects.equals(name, user.name);
    }
    
    @Override
    public int hashCode() {
        int result = id != null ? id.hashCode() : 0;
        result = 31 * result + (name != null ? name.hashCode() : 0);
        return result;
    }
}
```

### 使用 Lombok 自动生成

```java
// 正确：使用 @EqualsAndHashCode 注解
import lombok.EqualsAndHashCode;

@EqualsAndHashCode
public class User {
    private Long id;
    private String name;
}

// 正确：指定包含的字段
@EqualsAndHashCode(include = {"id"})
public class User {
    private Long id;
    private String name;  // 不参与 equals/hashCode
}

// 正确：排除某些字段
@EqualsAndHashCode(exclude = {"createTime", "updateTime"})
public class User {
    private Long id;
    private Date createTime;
    private Date updateTime;
}
```

### equals 实现规范

```java
// 正确：标准的 equals 实现模板
@Override
public boolean equals(Object obj) {
    // 1. 自引用检查
    if (this == obj) return true;
    
    // 2. null 检查和类型检查
    if (obj == null || getClass() != obj.getClass()) return false;
    
    // 3. 类型转换
    User user = (User) obj;
    
    // 4. 字段比较（使用 Objects.equals 处理 null）
    return Objects.equals(id, user.id) 
        && Objects.equals(name, user.name);
}

// 错误：不处理 null
@Override
public boolean equals(Object obj) {
    User user = (User) obj;  // 可能 NPE
    return id.equals(user.id);  // id 为 null 时 NPE
}

// 错误：接受特定类型参数（违反 equals 签名）
public boolean equals(User user) {  // 错误签名！
    return this.id.equals(user.id);
}
```

### hashCode 实现规范

```java
// 正确：使用 Objects.hash（推荐）
@Override
public int hashCode() {
    return Objects.hash(id, name, email);
}

// 正确：手动计算（性能更好）
@Override
public int hashCode() {
    int result = 17;  // 任意非零初始值
    result = 31 * result + (id != null ? id.hashCode() : 0);
    result = 31 * result + (name != null ? name.hashCode() : 0);
    return result;
}

// 正确：单字段
@Override
public int hashCode() {
    return id != null ? id.hashCode() : 0;
}

// 错误：返回固定值（性能极差）
@Override
public int hashCode() {
    return 1;  // 所有对象哈希值相同，HashMap 变成链表
}

// 错误：忽略某些字段（与 equals 不一致）
@Override
public boolean equals(Object obj) {
    // 比较 id 和 name
}

@Override
public int hashCode() {
    return id.hashCode();  // 只用 id，与 equals 不一致
}
```

## TypeScript 示例

```typescript
// TypeScript 没有内置的 equals/hashCode，需要自定义

// 正确：实现值对象比较
class User {
    constructor(
        readonly id: number,
        readonly name: string
    ) {}
    
    equals(other: User): boolean {
        if (this === other) return true;
        if (other == null) return false;
        return this.id === other.id && this.name === other.name;
    }
    
    hashCode(): number {
        // 简单实现：组合字段哈希
        let hash = 17;
        hash = 31 * hash + this.id;
        hash = 31 * hash + (this.name ? this.hashCodeString(this.name) : 0);
        return hash;
    }
    
    private hashCodeString(str: string): number {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = 31 * hash + str.charCodeAt(i);
        }
        return hash;
    }
}

// 使用 Map/Set 时需要注意
const userSet = new Set<User>();
userSet.add(new User(1, "张三"));
userSet.add(new User(1, "李四"));
// Set 会认为这是两个不同对象（引用比较）

// 正确：使用 Map + 自定义键
const userMap = new Map<string, User>();
userMap.set(`${id}:${name}`, user);  // 使用组合键

// 正确：使用第三方库（如 lodash）
import { isEqual } from 'lodash';
const isSame = isEqual(user1, user2);
```

## Python 示例

```python
# Python 使用 __eq__ 和 __hash__

# 正确：实现 __eq__ 和 __hash__
class User:
    def __init__(self, id: int, name: str):
        self.id = id
        self.name = name
    
    def __eq__(self, other):
        if self is other:
            return True
        if other is None or type(self) != type(other):
            return False
        return self.id == other.id and self.name == other.name
    
    def __hash__(self):
        return hash((self.id, self.name))  # 使用元组
    
    def __repr__(self):
        return f"User({self.id}, {self.name})"

# 使用 set/dict
user_set = set()
user_set.add(User(1, "张三"))
user_set.add(User(1, "张三"))  # 不会重复添加（equals 相同）
print(len(user_set))  # 1

user_dict = {}
user_dict[User(1, "张三")] = "数据"
user_dict[User(1, "张三")] = "新数据"  # 覆盖，不会新增
print(len(user_dict))  # 1
```

### Python 规范

```python
# 正确：使用 dataclass（自动生成 __eq__）
from dataclasses import dataclass

@dataclass
class User:
    id: int
    name: str
    # 自动生成 __eq__

# 注意：dataclass 默认不生成 __hash__
# 需要设置 frozen=True 或 unsafe_hash=True

@dataclass(frozen=True)  # 不可变，自动生成 __hash__
class User:
    id: int
    name: str

@dataclass(eq=True, unsafe_hash=True)  # 可变，但生成 __hash__
class User:
    id: int
    name: str

# 错误：只实现 __eq__，不实现 __hash__
class User:
    def __init__(self, id: int):
        self.id = id
    
    def __eq__(self, other):
        return self.id == other.id
    # 没有 __hash__，对象变为 unhashable，无法放入 set/dict
```

## Go 示例

```go
// Go 没有内置的 equals/hashCode，使用自定义比较

// 正确：实现值比较
type User struct {
    ID   int64
    Name string
}

func (u *User) Equals(other *User) bool {
    if u == other {
        return true
    }
    if other == nil {
        return false
    }
    return u.ID == other.ID && u.Name == other.Name
}

// Go 的 map 使用结构体作为键时，需要考虑字段
// 结构体作为键：所有字段都参与哈希计算
userMap := make(map[User]string)

user1 := User{ID: 1, Name: "张三"}
user2 := User{ID: 1, Name: "张三"}

userMap[user1] = "数据1"
userMap[user2] = "数据2"  // 会覆盖（字段值相同）

// 注意：指针作为键时，使用指针地址
userPtrMap := make(map[*User]string)
userPtrMap[&user1] = "数据1"
userPtrMap[&user2] = "数据2"  // 两个不同的键（指针地址不同）
```

## equals/hashCode 实现清单

### equals 检查项

| 检查项 | 说明 |
|--------|------|
| 自引用检查 | `if (this == obj) return true;` |
| null 检查 | `if (obj == null) return false;` |
| 类型检查 | `if (getClass() != obj.getClass()) return false;` |
| 字段比较 | 使用 `Objects.equals` 处理 null |
| 签名正确 | 必须是 `equals(Object obj)` |
| 对称性 | `a.equals(b)` 则 `b.equals(a)` |
| 传递性 | `a.equals(b)` 且 `b.equals(c)` 则 `a.equals(c)` |
| 一致性 | 多次调用结果一致 |

### hashCode 检查项

| 检查项 | 说明 |
|--------|------|
| 与 equals 一致 | 所有参与 equals 的字段都要参与 hashCode |
| 不返回固定值 | 避免性能问题 |
| 处理 null 字段 | `field != null ? field.hashCode() : 0` |
| 使用乘数 31 | `31 * result + fieldHash` |

## 字段选择原则

| 原则 | 说明 |
|------|------|
| 业务唯一标识 | 优先使用 id、code 等唯一标识 |
| 唯一组合 | 使用能确定唯一性的字段组合 |
| 避免可变字段 | 不要使用可能变化的字段（如 updateTime） |
| 性能考虑 | 少量字段比多字段哈希计算更快 |

```java
// 正确：使用业务唯一标识
@Override
public boolean equals(Object obj) {
    // 只比较 id（业务唯一）
}

@Override
public int hashCode() {
    return id.hashCode();
}

// 正确：使用唯一组合
@Override
public boolean equals(Object obj) {
    // 比较 userId + orderId（组合唯一）
}

@Override
public int hashCode() {
    return Objects.hash(userId, orderId);
}

// 错误：使用可变字段
@Override
public boolean equals(Object obj) {
    // 比较 status（可能变化）
}
// 对象放入 Set 后 status 变化，Set 行为异常
```