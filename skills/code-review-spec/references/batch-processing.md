# 批量处理规范示例

> **通用原则**：能用批量处理的场景，禁止使用 for 循环逐条处理。

## Java

```java
// 错误：for 循环逐条处理
for (User user : users) {
    userRepository.save(user);
}

// 正确：批量处理
userRepository.saveAll(users);
```

```java
// 错误：for 循环逐条查询
for (Long id : ids) {
    User user = userRepository.findById(id);
    // 处理逻辑
}

// 正确：批量查询
List<User> users = userRepository.findAllById(ids);
```

## Python

```python
# 错误：for 循环逐条处理
for item in items:
    process_item(item)

# 正确：批量处理
process_batch(items)
```

```python
# 错误：for 循环逐条插入
for record in records:
    db.insert(record)

# 正确：批量插入
db.insert_many(records)
```

## TypeScript

```typescript
// 错误：for 循环逐条处理
for (const id of ids) {
    await api.delete(id);
}

// 正确：批量处理
await api.deleteBatch(ids);
```

```typescript
// 错误：for 循环逐条查询
for (const id of ids) {
    const item = await db.findById(id);
}

// 正确：批量查询
const items = await db.findByIds(ids);
```