# 常量与魔法数字规范

> **强制要求**：禁止在代码中直接使用魔法数字、魔法字符串，必须定义为常量或枚举。

## 魔法数字定义

**魔法数字**：代码中直接出现的、含义不明确的数字或字符串值。

```java
// 魔法数字示例
if (status == 1) { ... }           // 1 是什么状态？
if (age > 18) { ... }              // 18 代表什么？
if (type.equals("A")) { ... }      // "A" 代表什么类型？
setTimeout(3000);                   // 3000 毫秒？为什么？
```

## 正确示例

### Java - 使用常量和枚举

```java
// 错误：魔法数字和字符串
public class OrderService {
    public void processOrder(Order order) {
        if (order.getStatus() == 1) {  // 1 是什么？
            // 处理逻辑
        }
        if (order.getType().equals("A")) {  // "A" 是什么？
            // 处理逻辑
        }
        if (order.getAmount() > 10000) {  // 10000 是什么阈值？
            // 处理逻辑
        }
    }
}

// 正确：定义常量和枚举
public class OrderConstants {
    // 状态常量
    public static final int STATUS_CREATED = 1;
    public static final int STATUS_PAID = 2;
    public static final int STATUS_SHIPPED = 3;
    public static final int STATUS_COMPLETED = 4;
    
    // 业务阈值
    public static final BigDecimal HIGH_VALUE_THRESHOLD = new BigDecimal("10000");
    public static final int TIMEOUT_SECONDS = 30;
}

// 正确：使用枚举（推荐）
public enum OrderStatus {
    CREATED(1, "已创建"),
    PAID(2, "已支付"),
    SHIPPED(3, "已发货"),
    COMPLETED(4, "已完成");
    
    private final int code;
    private final String description;
    
    OrderStatus(int code, String description) {
        this.code = code;
        this.description = description;
    }
    
    public int getCode() { return code; }
    public String getDescription() { return description; }
}

public enum OrderType {
    NORMAL("A", "普通订单"),
    VIP("B", "VIP订单"),
    GROUP("C", "团购订单");
    
    private final String code;
    private final String description;
    
    // 构造方法和 getter...
}

// 使用枚举
public class OrderService {
    public void processOrder(Order order) {
        if (order.getStatus() == OrderStatus.CREATED.getCode()) {
            // 处理已创建订单
        }
        if (order.getType() == OrderType.NORMAL.getCode()) {
            // 处理普通订单
        }
        if (order.getAmount().compareTo(OrderConstants.HIGH_VALUE_THRESHOLD) > 0) {
            // 处理高价值订单
        }
    }
}
```

### TypeScript - 使用常量和枚举

```typescript
// 错误：魔法数字和字符串
function processOrder(order: Order): void {
    if (order.status === 1) { ... }
    if (order.type === 'A') { ... }
    if (order.amount > 10000) { ... }
}

// 正确：定义常量
const ORDER_STATUS = {
    CREATED: 1,
    PAID: 2,
    SHIPPED: 3,
    COMPLETED: 4,
} as const;

const ORDER_TYPE = {
    NORMAL: 'A',
    VIP: 'B',
    GROUP: 'C',
} as const;

const BUSINESS_THRESHOLD = {
    HIGH_VALUE: 10000,
    TIMEOUT_MS: 30000,
} as const;

// 正确：使用枚举（推荐）
enum OrderStatus {
    CREATED = 1,
    PAID = 2,
    SHIPPED = 3,
    COMPLETED = 4,
}

enum OrderType {
    NORMAL = 'A',
    VIP = 'B',
    GROUP = 'C',
}

// 使用常量
function processOrder(order: Order): void {
    if (order.status === ORDER_STATUS.CREATED) { ... }
    if (order.type === ORDER_TYPE.NORMAL) { ... }
    if (order.amount > BUSINESS_THRESHOLD.HIGH_VALUE) { ... }
}
```

### Python - 使用常量和枚举

```python
from enum import Enum

# 错误：魔法数字和字符串
def process_order(order: dict) -> None:
    if order["status"] == 1: ...
    if order["type"] == "A": ...
    if order["amount"] > 10000: ...

# 正确：定义常量
ORDER_STATUS_CREATED = 1
ORDER_STATUS_PAID = 2
ORDER_STATUS_SHIPPED = 3
ORDER_STATUS_COMPLETED = 4

ORDER_TYPE_NORMAL = "A"
ORDER_TYPE_VIP = "B"

HIGH_VALUE_THRESHOLD = 10000

# 正确：使用枚举（推荐）
class OrderStatus(Enum):
    CREATED = 1
    PAID = 2
    SHIPPED = 3
    COMPLETED = 4

class OrderType(Enum):
    NORMAL = "A"
    VIP = "B"
    GROUP = "C"

# 使用枚举
def process_order(order: dict) -> None:
    if order["status"] == OrderStatus.CREATED.value: ...
    if order["type"] == OrderType.NORMAL.value: ...
```

### Go - 使用常量

```go
// 错误：魔法数字和字符串
func ProcessOrder(order Order) error {
    if order.Status == 1 { ... }
    if order.Type == "A" { ... }
    if order.Amount > 10000 { ... }
}

// 正确：定义常量
const (
    OrderStatusCreated   = 1
    OrderStatusPaid      = 2
    OrderStatusShipped   = 3
    OrderStatusCompleted = 4
)

const (
    OrderTypeNormal = "A"
    OrderTypeVIP    = "B"
    OrderTypeGroup  = "C"
)

const (
    HighValueThreshold = 10000
    TimeoutSeconds     = 30
)

// 正确：使用 iota 定义递增常量
const (
    StatusCreated Status = iota + 1  // 1
    StatusPaid                          // 2
    StatusShipped                       // 3
    StatusCompleted                     // 4
)

// 使用常量
func ProcessOrder(order Order) error {
    if order.Status == OrderStatusCreated { ... }
    if order.Type == OrderTypeNormal { ... }
    if order.Amount > HighValueThreshold { ... }
}
```

## 常量定义规范

### 命名规范

| 语言 | 常量命名 | 示例 |
|------|----------|------|
| Java | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |
| TypeScript | UPPER_SNAKE_CASE 或 camelCase | `MAX_RETRY_COUNT` / `maxRetryCount` |
| Python | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |
| Go | CamelCase 或 UPPER_SNAKE_CASE | `MaxRetryCount` / `MAX_RETRY_COUNT` |

### 常量组织

```java
// 正确：按业务领域分组
public class OrderConstants {
    // 状态相关
    public static final int STATUS_CREATED = 1;
    public static final int STATUS_PAID = 2;
    
    // 类型相关
    public static final String TYPE_NORMAL = "A";
    public static final String TYPE_VIP = "B";
    
    // 阈值相关
    public static final BigDecimal HIGH_VALUE_THRESHOLD = new BigDecimal("10000");
}

// 正确：全局常量单独文件
public class GlobalConstants {
    public static final int MAX_RETRY_COUNT = 3;
    public static final int DEFAULT_TIMEOUT_MS = 30000;
    public static final String DEFAULT_CHARSET = "UTF-8";
}
```

## 枚举 vs 常量选择

| 场景 | 推荐 |
|------|------|
| 固定几个选项，需要类型安全 | **枚举** |
| 需要关联描述信息 | **枚举** |
| 单个数值阈值 | **常量** |
| 配置类参数 | **常量** |
| 需要遍历所有值 | **枚举** |

## 特殊场景处理

### 时间/日期相关

```java
// 错误：魔法数字
setTimeout(3000);  // 3秒？30秒？
scheduleAt(86400000);  // 一天？

// 正确：定义时间常量
public class TimeConstants {
    public static final long SECOND_MS = 1000L;
    public static final long MINUTE_MS = 60 * SECOND_MS;
    public static final long HOUR_MS = 60 * MINUTE_MS;
    public static final long DAY_MS = 24 * HOUR_MS;
    
    public static final int DEFAULT_TIMEOUT_SECONDS = 30;
}

setTimeout(TimeConstants.DEFAULT_TIMEOUT_SECONDS * TimeConstants.SECOND_MS);
```

### HTTP 状态码

```typescript
// 错误
if (response.status === 200) { ... }
if (response.status === 404) { ... }

// 正确：使用标准枚举或常量
const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    NOT_FOUND: 404,
    INTERNAL_ERROR: 500,
} as const;

if (response.status === HTTP_STATUS.OK) { ... }
```

### 业务规则阈值

```java
// 错误：业务规则硬编码
if (order.getAmount() > 10000) {
    applyVIPDiscount();
}

// 正确：业务规则常量
public class BusinessRuleConstants {
    // VIP 订单金额阈值
    public static final BigDecimal VIP_ORDER_THRESHOLD = new BigDecimal("10000");
    
    // VIP 折扣率
    public static final BigDecimal VIP_DISCOUNT_RATE = new BigDecimal("0.9");
    
    // 普通用户最大订单数
    public static final int MAX_ORDERS_PER_USER = 100;
}

if (order.getAmount().compareTo(BusinessRuleConstants.VIP_ORDER_THRESHOLD) > 0) {
    applyVIPDiscount();
}
```