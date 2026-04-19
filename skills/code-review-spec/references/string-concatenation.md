# 字符串拼接规范

> **强制要求**：禁止在循环内使用 `+` 或 `concat` 拼接字符串，必须使用 StringBuilder/StringBuffer 或语言的字符串连接方法。

## 性能影响说明

字符串是不可变对象，每次拼接都会创建新对象：
- **内存开销**：每次拼接创建新字符串对象
- **GC 压力**：大量临时对象增加垃圾回收负担
- **性能下降**：循环内拼接性能呈 O(n²) 下降

## Java 示例

```java
// 错误：循环内使用 + 拼接
String result = "";
for (String item : items) {
    result += item;  // 每次创建新对象，性能极差
}

// 错误：循环内使用 concat
String result = "";
for (String item : items) {
    result = result.concat(item);  // 同样创建新对象
}

// 正确：使用 StringBuilder
StringBuilder builder = new StringBuilder(items.size() * 20);  // 预估容量
for (String item : items) {
    builder.append(item);
}
String result = builder.toString();

// 正确：使用 String.join（简单场景）
String result = String.join(",", items);

// 正确：使用 Collectors.joining（Stream 场景）
String result = items.stream()
    .collect(Collectors.joining(","));

// 正确：使用 StringBuffer（多线程场景）
StringBuffer buffer = new StringBuffer();
for (String item : items) {
    buffer.append(item);
}
String result = buffer.toString();
```

### StringBuilder vs StringBuffer

| 类型 | 线程安全 | 性能 | 使用场景 |
|------|----------|------|----------|
| StringBuilder | 不安全 | 更快 | 单线程、方法内部 |
| StringBuffer | 安全 | 较慢 | 多线程共享 |

### 字符串拼接场景选择

```java
// 场景：少量拼接（≤ 3 次）
// 正确：直接使用 +，编译器会优化
String message = "用户 " + userName + " 登录成功";

// 场景：循环内拼接
// 正确：使用 StringBuilder
StringBuilder builder = new StringBuilder();
for (Item item : items) {
    builder.append(item.getName()).append(",");
}

// 场景：集合转逗号分隔字符串
// 正确：使用 String.join
String names = String.join(",", userNames);

// 场景：复杂格式化
// 正确：使用 String.format 或 MessageFormat
String message = String.format("用户 %s 于 %s 登录，IP: %s", 
    userName, loginTime, ipAddress);
```

## TypeScript 示例

```typescript
// 错误：循环内使用 + 拼接
let result = "";
for (const item of items) {
    result += item;  // 每次创建新字符串
}

// 正确：使用数组 + join
const result = items.join("");

// 正确：使用数组 + join（带分隔符）
const result = items.join(",");

// 正确：使用模板字符串（少量拼接）
const message = `用户 ${userName} 登录成功`;

// 正确：使用 Array.from + join（复杂场景）
const result = Array.from({ length: 100 }, (_, i) => `item${i}`).join(",");
```

### 模板字符串 vs 字符串拼接

```typescript
// 错误：大量变量使用 + 拼接
const message = "用户 " + userName + " 于 " + time + " 登录，IP: " + ip;

// 正确：使用模板字符串（推荐）
const message = `用户 ${userName} 于 ${time} 登录，IP: ${ip}`;

// 正确：多行字符串使用模板字符串
const html = `
<div class="user-card">
    <span>${userName}</span>
    <span>${email}</span>
</div>
`;
```

## Python 示例

```python
# 错误：循环内使用 + 拼接
result = ""
for item in items:
    result += item  # 每次创建新字符串

# 正确：使用 join
result = "".join(items)

# 正确：使用 join（带分隔符）
result = ",".join(items)

# 正确：使用列表推导式 + join
result = ",".join([item.name for item in items])

# 正确：使用 f-string（少量拼接，推荐）
message = f"用户 {user_name} 登录成功"

# 正确：使用 format（复杂格式化）
message = "用户 {} 于 {} 登录，IP: {}".format(user_name, time, ip)
```

### f-string vs format vs %

```python
# 推荐顺序：f-string > format > %

# 正确：f-string（Python 3.6+，性能最好）
message = f"用户 {user_name} 登录成功"

# 正确：format（Python 3.0+）
message = "用户 {} 登录成功".format(user_name)

# 错误：% 格式化（旧语法，不推荐）
message = "用户 %s 登录成功" % user_name
```

## Go 示例

```go
// 错误：循环内使用 + 拼接
result := ""
for _, item := range items {
    result += item  // 每次创建新字符串
}

// 正确：使用 strings.Join
result := strings.Join(items, "")

// 正确：使用 strings.Join（带分隔符）
result := strings.Join(items, ",")

// 正确：使用 strings.Builder（Go 1.10+）
var builder strings.Builder
builder.Grow(1000)  // 预估容量，减少扩容
for _, item := range items {
    builder.WriteString(item)
}
result := builder.String()

// 正确：使用 fmt.Sprintf（格式化场景）
message := fmt.Sprintf("用户 %s 于 %s 登录", userName, loginTime)
```

### strings.Builder 使用

```go
// 正确：strings.Builder 最佳实践
func buildMessage(items []string) string {
    var builder strings.Builder
    
    // 预分配容量（可选，提高性能）
    totalLen := 0
    for _, item := range items {
        totalLen += len(item)
    }
    builder.Grow(totalLen)
    
    // 拼接字符串
    for _, item := range items {
        builder.WriteString(item)
    }
    
    return builder.String()
}
```

## 拼接方法选择指南

### Java

| 场景 | 推荐方法 |
|------|----------|
| 少量拼接（≤ 3 次） | 直接 `+` |
| 循环内拼接 | `StringBuilder` |
| 集合转字符串 | `String.join()` 或 `Collectors.joining()` |
| 格式化字符串 | `String.format()` |
| 多线程拼接 | `StringBuffer` |

### TypeScript

| 场景 | 推荐方法 |
|------|----------|
| 少量拼接 | 模板字符串 `${}` |
| 循环内拼接 | 数组 `+` `join()` |
| 多行字符串 | 模板字符串 |
| 格式化字符串 | 模板字符串 |

### Python

| 场景 | 推荐方法 |
|------|----------|
| 少量拼接 | `f-string` |
| 循环内拼接 | `join()` |
| 格式化字符串 | `f-string` 或 `format()` |
| 日志格式化 | `%`（logging 模块要求） |

### Go

| 场景 | 推荐方法 |
|------|----------|
| 少量拼接 | 直接 `+` 或 `fmt.Sprintf` |
| 循环内拼接 | `strings.Builder` |
| 集合转字符串 | `strings.Join` |
| 格式化字符串 | `fmt.Sprintf` |

## 性能对比示例

### Java 性能测试

```java
// 测试：拼接 10000 个字符串

// 方法 1：使用 + 拼接（错误）
String result = "";
for (int i = 0; i < 10000; i++) {
    result += "item" + i;
}
// 耗时：约 500ms（O(n²)）

// 方法 2：使用 StringBuilder（正确）
StringBuilder builder = new StringBuilder(50000);
for (int i = 0; i < 10000; i++) {
    builder.append("item").append(i);
}
String result = builder.toString();
// 耗时：约 1ms（O(n)）
```

### Python 性能测试

```python
import time

# 方法 1：使用 + 拼接（错误）
start = time.time()
result = ""
for i in range(10000):
    result += f"item{i}"
print(f"拼接耗时: {time.time() - start:.3f}s")  # 约 0.5s

# 方法 2：使用 join（正确）
start = time.time()
result = "".join([f"item{i}" for i in range(10000)])
print(f"join耗时: {time.time() - start:.3f}s")  # 约 0.001s
```