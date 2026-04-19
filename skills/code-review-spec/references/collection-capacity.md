# 集合初始化容量规范

> **强制要求**：创建集合时必须指定合理的初始容量，避免不必要的扩容开销。

## 扩容机制说明

大多数集合的默认容量较小（如 Java ArrayList 默认 10），当元素超过容量时会触发扩容：
- **扩容开销**：创建新数组 + 复制旧数据
- **性能影响**：多次扩容会导致额外内存分配和 CPU 消耗
- **内存浪费**：扩容后可能预留过多空闲空间

## Java 示例

```java
// 错误：未指定初始容量
List<User> users = new ArrayList<>();  // 默认容量 10
Map<Long, User> userMap = new HashMap<>();  // 默认容量 16

// 正确：根据预期元素数量指定容量
int expectedSize = 100;
List<User> users = new ArrayList<>(expectedSize);
Map<Long, User> userMap = new HashMap<>(expectedSize);

// 正确：实际容量 = expectedSize / loadFactor + 1
// HashMap 默认 loadFactor = 0.75
int expectedElements = 100;
int mapCapacity = (int) (expectedElements / 0.75) + 1;
Map<Long, User> userMap = new HashMap<>(mapCapacity);

// 正确：使用集合工厂方法（Java 9+）
List<User> users = List.of(user1, user2, user3);  // 固定大小，不可变
Set<User> userSet = Set.of(user1, user2, user3);

// 正确：Guava 提供的便捷方法
List<User> users = Lists.newArrayListWithExpectedSize(100);
Map<Long, User> userMap = Maps.newHashMapWithExpectedSize(100);
```

### 各种集合的默认容量

| 集合类型 | 默认容量 | 扩容策略 |
|----------|----------|----------|
| ArrayList | 10 | 1.5 倍 |
| HashMap | 16 | 2 倍 |
| HashSet | 16 | 2 倍 |
| LinkedList | 0 | 无需扩容（链表） |
| TreeMap | 0 | 无需扩容（红黑树） |

### 容量计算公式

```java
// ArrayList：直接指定
List<T> list = new ArrayList<>(expectedSize);

// HashMap/HashSet：考虑 loadFactor
// 实际容量 = expectedSize / loadFactor + 1
int capacity = (int) (expectedSize / 0.75f) + 1;
Map<K, V> map = new HashMap<>(capacity);
Set<T> set = new HashSet<>(capacity);
```

## TypeScript 示例

```typescript
// TypeScript/JavaScript 的 Array 是动态数组，无需指定容量
// 但可以预先分配大小（性能优化）

// 错误：逐个添加元素
const users: User[] = [];
for (let i = 0; i < 100; i++) {
    users.push(fetchUser(i));  // 可能触发多次扩容
}

// 正确：预先分配（使用 fill + map）
const users: User[] = new Array(100).fill(null).map((_, i) => fetchUser(i));

// 正确：使用 Array.from
const users: User[] = Array.from({ length: 100 }, (_, i) => fetchUser(i));

// Map/Set 无需预先指定容量
const userMap = new Map<number, User>();
const userSet = new Set<User>();
```

## Python 示例

```python
# Python 的 list 是动态数组，无需显式指定容量
# 但可以预先分配以提高性能

# 错误：逐个 append
users = []
for i in range(100):
    users.append(fetch_user(i))  # 可能触发多次扩容

# 正确：预先分配大小
users = [None] * 100
for i in range(100):
    users[i] = fetch_user(i)

# 正确：使用列表推导式（推荐）
users = [fetch_user(i) for i in range(100)]

# dict/set 无需预先指定容量
user_dict = {}
user_set = set()
```

## Go 示例

```go
// Go 的 slice 需要使用 make 指定容量

// 错误：未指定容量，可能多次扩容
users := []User{}
for i := 0; i < 100; i++ {
    users = append(users, fetchUser(i))
}

// 正确：使用 make 指定长度和容量
users := make([]User, 0, 100)  // 长度 0，容量 100
for i := 0; i < 100; i++ {
    users = append(users, fetchUser(i))
}

// 正确：直接创建指定长度
users := make([]User, 100)
for i := 0; i < 100; i++ {
    users[i] = fetchUser(i)
}

// Map 指定初始容量（Go 1.11+）
userMap := make(map[int64]User, 100)  // 提示预期大小
```

## 容量选择原则

| 场景 | 容量选择 |
|------|----------|
| 已知确切数量 | 直接使用该数量 |
| 大致范围 | 使用上限值 |
| 完全未知 | 使用经验值或默认值 |
| 数据量很大 | 分批处理，避免一次性大集合 |

## 特殊场景处理

### 数据量不确定时

```java
// 错误：盲目使用大容量，浪费内存
List<User> users = new ArrayList<>(10000);  // 实际可能只有 10 个

// 正确：使用默认容量 + 监控
List<User> users = new ArrayList<>();  // 让集合自动扩容

// 正确：如果预估范围，使用保守值
List<User> users = new ArrayList<>(Math.max(10, estimatedSize / 10));
```

### 批量操作时

```java
// 正确：批量操作时指定容量
public List<User> batchProcess(List<Long> userIds) {
    List<User> results = new ArrayList<>(userIds.size());  // 容量 = 输入数量
    for (Long id : userIds) {
        results.add(fetchUser(id));
    }
    return results;
}
```

### Map 的容量计算

```java
// 正确：精确计算 HashMap 容量
public static int calculateHashMapCapacity(int expectedSize, float loadFactor) {
    return (int) (expectedSize / loadFactor) + 1;
}

// 使用示例
int expectedUsers = 1000;
int capacity = calculateHashMapCapacity(expectedUsers, 0.75f);
Map<Long, User> userMap = new HashMap<>(capacity);
```

## 容量规范检查项

| 检查项 | 说明 |
|--------|------|
| 是否指定初始容量 | 创建集合时是否指定合理容量 |
| 容量是否合理 | 容量是否符合预期数据量 |
| 是否避免过度分配 | 容量不要远大于实际需求 |
| Map 是否考虑 loadFactor | HashMap/HashSet 容量计算要考虑负载因子 |