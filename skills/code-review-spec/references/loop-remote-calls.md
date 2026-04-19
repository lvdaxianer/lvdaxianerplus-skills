# 循环内禁止调用远程服务或数据库示例

> **通用原则**：禁止在 for、map、forEach、filter 等循环结构中直接调用远程服务或连接数据库。

## 正确示例

### Java

```java
// 正确：先批量查询，再循环处理
List<User> users = userRepository.findAllById(ids);  // 批量查询
List<UserDTO> results = new ArrayList<>();
for (User user : users) {
    UserDTO dto = transform(user);  // 仅内存操作
    results.add(dto);
}
```

### TypeScript

```typescript
// 正确：先批量获取，再循环处理
const users = await userService.findByIds(userIds);  // 批量查询
const results = users.map(user => transform(user));   // 仅内存操作
```

### Python

```python
# 正确：先批量查询，再循环处理
users = user_repository.find_all_by_ids(user_ids)  # 批量查询
results = [transform(user) for user in users]       # 仅内存操作
```

### Go

```go
// 正确：先批量查询，再循环处理
users := userRepository.FindAllByIDs(ids)  // 批量查询
for _, user := range users {
    results = append(results, transform(user))  // 仅内存操作
}
```

## 错误示例

### Java

```java
// 错误：在 for 循环内调用数据库
for (Long id : ids) {
    User user = userRepository.findById(id);  // 每条记录一次数据库查询
}

// 错误：在 forEach 内调用远程服务
userIds.forEach(id -> {
    remoteService.getUserDetail(id);  // 每条记录一次远程调用
});
```

### TypeScript

```typescript
// 错误：在 map 内调用远程服务
const results = userIds.map(async id => {
    return await remoteService.getUserDetail(id);  // 每条记录一次远程调用
});

// 错误：在 filter 内调用数据库
const activeUsers = userIds.filter(id => {
    return database.isUserActive(id);  // 每条记录一次数据库查询
});
```

### Python

```python
# 错误：在 for 循环内调用远程服务
for user_id in user_ids:
    user = api.get_user(user_id)  # 每条记录一次远程调用

# 错误：在列表推导式内调用数据库
active_users = [u for u in db.get_all_users() if db.is_active(u.id)]  # 每条记录一次数据库查询
```

### Go

```go
// 错误：在 for 循环内调用远程服务
for _, id := range ids {
    user, _ := remoteService.GetUserDetail(id)  // 每条记录一次远程调用
}
```

## 滑动窗口批处理示例

### Java

```java
// 正确：分批处理，每批 100 条
private static final int BATCH_SIZE = 100;

public void processUsers(List<Long> userIds) {
    // 分批处理大列表，避免一次性加载或处理
    for (int i = 0; i < userIds.size(); i += BATCH_SIZE) {
        List<Long> batch = userIds.subList(i, Math.min(i + BATCH_SIZE, userIds.size()));
        processBatch(batch);  // 每批内部仍是批量操作
    }
}
```