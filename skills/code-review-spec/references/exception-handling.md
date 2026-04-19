# 异常处理规范示例

## Java

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

## Go

```go
result, err := doSomething()
if err != nil {
    // 处理特定错误
    return fmt.Errorf("操作失败: %w", err)
}
```

## TypeScript / Vue

```typescript
try {
    // 业务逻辑
} catch (error) {
    // 处理特定错误
    if (error instanceof SpecificException) {
        throw new BusinessException("错误描述", error);
    }
    throw error;
}
```

```typescript
// Vue 组合式函数中的错误处理
const fetchUser = async (userId: number): Promise<User> => {
    try {
        const response = await api.getUser(userId);
        return response.data;
    } catch (error) {
        if (error instanceof NotFoundError) {
            throw new UserNotFoundException(`用户 ${userId} 不存在`, error);
        }
        throw error;
    }
};
```

## Python

```python
try:
    # 业务逻辑
    pass
except SpecificException as e:
    # 处理特定异常
    raise BusinessException("错误描述") from e

# 异常链
raise BusinessException("原始错误") from cause_exception
```