# if-else 强制配对规范示例

## 正确示例

### Java

```java
// 正确：if 设置值，else 设置合理值
int result;
if (condition) {
    result = calculateValue();  // 正常计算结果
} else {
    result = fallbackValue();  // 降级处理值
}

// 正确：if 有值，else 设置空状态/默认值
String displayName;
if (user != null) {
    displayName = user.getName();
} else {
    displayName = "匿名用户";  // 空状态下的合理显示值
}

// 正确：布尔值设置
boolean isActive;
if (status == Status.ENABLED) {
    isActive = true;
} else {
    isActive = false;  // 其他状态统一为 false
}

// 正确：业务枚举值
OrderStatus status;
if (isPaid) {
    status = OrderStatus.PAID;
} else {
    status = OrderStatus.UNPAID;  // 未支付状态
}
```

### TypeScript

```typescript
// 正确：if 设置值，else 设置备选值
const discount = isMember ? calculateDiscount() : 0;  // 非会员无折扣

// 正确：else 设置合理默认值
let userName: string;
if (currentUser) {
    userName = currentUser.name;
} else {
    userName = "游客";  // 空状态下的合理显示值
}

// 正确：降级处理
const config = isConfigLoaded ? loadedConfig : defaultConfig;
```

### Python

```python
# 正确：if 设置值，else 设置备选值
result = calculate_value() if condition else fallback_value()

# 正确：else 设置空状态/默认值
items = fetch_items() if has_items else []

# 正确：业务逻辑分支
status = OrderStatus.PAID if is_paid else OrderStatus.PENDING
```

## 错误示例

### Java

```java
// 错误：if 无 else，缺失分支处理
int result;
if (condition) {
    result = calculateValue();  // 只处理了 condition=true 的情况
}
// result 可能未初始化

// 错误：缺少 else 分支处理
boolean isValid;
if (value > 0) {
    isValid = true;
}
// isValid 在 false 时未处理

// 错误：用 return 替代 else，逻辑不清晰
if (user != null) {
    return user.getName();
}
return "匿名用户";  // 这种写法不如 else 清晰，且容易出错
```

### TypeScript

```typescript
// 错误：if 无 else
let result: number;
if (condition) {
    result = 100;
}
// result 可能未定义

// 错误：缺少 else 分支
let status: string;
if (isSuccess) {
    status = "成功";
}
// 应该：else { status = "失败"; }
```

### Python

```python
# 错误：if 无 else
result = None
if condition:
    result = calculate_value()
# result 可能在 else 时仍为 None
```

## else 分支的合理值类型

| 场景 | else 可能设置的值 |
|------|------------------|
| 空状态 | 空字符串 `""`、`null`、空集合 `[]` |
| 默认值 | `0`、`false`、`DEFAULT_VALUE` |
| 备选值 | `fallbackValue()`、备选数据源 |
| 降级值 | `defaultConfig`、`ERROR_CODE` |
| 业务枚举 | `OrderStatus.UNPAID`、`UserRole.GUEST` |
| 空安全 | `Optional.empty()`、`Result.Err()` |