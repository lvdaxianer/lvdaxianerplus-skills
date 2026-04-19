# 日志规范示例

## 业务标识日志示例

### Java

```java
// 正确：带有业务标识
log.info("[用户登录] 用户登录成功, userId={}", userId);
log.warn("[订单处理] 库存不足, orderId={}", orderId);
log.error("[支付服务] 支付失败, orderId={}, error={}", orderId, e.getMessage());

// 错误：缺少业务标识
log.info("用户登录成功, userId={}", userId);
log.info("订单处理完成");
```

### Go

```go
// 正确：带有业务标识
log.WithFields(log.Fields{"business": "user-login"}).Info("[用户登录] 用户登录成功")
log.WithFields(log.Fields{"business": "order"}).Error("[订单处理] 订单处理失败")

// 错误：缺少业务标识
log.Info("用户登录成功")
```

### TypeScript

```typescript
// 正确：带有业务标识
logger.info('[用户登录] 用户登录成功', { userId });
logger.error('[支付服务] 支付异常', { orderId, error: e.message });

// 错误：缺少业务标识
logger.info('用户登录成功');
```

### Python

```python
# 正确：带有业务标识
logger.info(f"[用户登录] 用户登录成功, user_id={user_id}")
logger.error(f"[订单处理] 订单处理失败, order_id={order_id}")

# 错误：缺少业务标识
logger.info("用户登录成功")
```

## 常见业务标识

| 业务场景 | 日志标识 | 示例 |
|----------|----------|------|
| 用户登录 | `[用户登录]` | `log.info("[用户登录] 用户登录成功")` |
| 用户注册 | `[用户注册]` | `log.info("[用户注册] 新用户注册成功")` |
| 订单创建 | `[订单创建]` | `log.info("[订单创建] 订单创建成功")` |
| 订单支付 | `[订单支付]` | `log.info("[订单支付] 支付成功")` |
| 文件上传 | `[文件上传]` | `log.info("[文件上传] 文件上传成功")` |
| 数据同步 | `[数据同步]` | `log.info("[数据同步] 同步完成")` |
| 接口调用 | `[API调用]` | `log.info("[API调用] 调用外部接口成功")` |

## 占位符使用示例

### Java (SLF4J)

```java
// 正确
log.info("User {} logged in successfully", username);

// 错误
log.info("User " + username + " logged in successfully");
```

### Go

```go
// 正确
log.Printf("User %s logged in successfully", username)

// 错误
log.Printf("User " + username + " logged in successfully")

// 使用结构化日志（推荐）
log.WithFields(log.Fields{
    "user": username,
}).Info("User logged in successfully")
```

### TypeScript / Vue

```typescript
// 正确：使用占位符
logger.info(`User ${username} logged in successfully`);

// 错误：不使用日志库
console.log("User " + username + " logged in successfully");

// Vue 项目中推荐使用结构化日志
const logger = {
    info: (message: string, meta?: Record<string, unknown>) => {
        console.log(JSON.stringify({ level: 'info', message, ...meta }));
    }
};
```

### Python

```python
import logging

logger = logging.getLogger(__name__)

# 正确：使用占位符
logger.info("User %s logged in successfully", username)

# 错误：字符串拼接
logger.info("User " + username + " logged in successfully")

# 使用结构化日志（推荐）
logger.info("User %s logged in successfully", username, extra={"user": username})
```