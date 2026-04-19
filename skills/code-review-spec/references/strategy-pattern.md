# 策略模式替代多重 if 判断示例

> **强制要求**：当代码中存在多个 `if` 分支使用**相等判断**时，必须使用**策略模式**替代。

## 正确示例

### Java

```java
// 正确：使用策略模式替代多重 if 判断
public interface PaymentStrategy {
    void pay(BigDecimal amount);
}

public class AlipayStrategy implements PaymentStrategy {
    @Override
    public void pay(BigDecimal amount) {
        // 支付宝支付逻辑
    }
}

public class WechatPayStrategy implements PaymentStrategy {
    @Override
    public void pay(BigDecimal amount) {
        // 微信支付逻辑
    }
}

public class PaymentService {
    private final Map<String, PaymentStrategy> strategies;

    // 通过 Map 注册策略，避免 if-else
    public PaymentService() {
        strategies = new HashMap<>();
        strategies.put("alipay", new AlipayStrategy());
        strategies.put("wechat", new WechatPayStrategy());
    }

    public void pay(String type, BigDecimal amount) {
        PaymentStrategy strategy = strategies.get(type);
        if (strategy == null) {
            throw new IllegalArgumentException("不支持的支付方式: " + type);
        }
        strategy.pay(amount);
    }
}
```

### TypeScript

```typescript
// 正确：TypeScript 策略模式
interface PaymentStrategy {
    pay(amount: number): void;
}

class AlipayStrategy implements PaymentStrategy {
    pay(amount: number): void {
        // 支付宝支付逻辑
    }
}

class WechatPayStrategy implements PaymentStrategy {
    pay(amount: number): void {
        // 微信支付逻辑
    }
}

// 策略工厂
class PaymentStrategyFactory {
    private static strategies: Record<string, PaymentStrategy> = {
        alipay: new AlipayStrategy(),
        wechat: new WechatPayStrategy(),
    };

    static getStrategy(type: string): PaymentStrategy {
        const strategy = this.strategies[type];
        if (!strategy) {
            throw new Error(`不支持的支付方式: ${type}`);
        }
        return strategy;
    }
}
```

### Python

```python
# 正确：Python 策略模式（使用字典映射）
from abc import ABC, abstractmethod

class PaymentStrategy(ABC):
    @abstractmethod
    def pay(self, amount: float) -> None:
        pass

class AlipayStrategy(PaymentStrategy):
    def pay(self, amount: float) -> None:
        # 支付宝支付逻辑
        pass

class WechatPayStrategy(PaymentStrategy):
    def pay(self, amount: float) -> None:
        # 微信支付逻辑
        pass

# 策略注册
strategies: dict[str, PaymentStrategy] = {
    "alipay": AlipayStrategy(),
    "wechat": WechatPayStrategy(),
}

def pay(payment_type: str, amount: float) -> None:
    strategy = strategies.get(payment_type)
    if strategy is None:
        raise ValueError(f"不支持的支付方式: {payment_type}")
    strategy.pay(amount)
```

## 错误示例

### Java

```java
// 错误：多重 if 相等判断，应使用策略模式
public void pay(String type, BigDecimal amount) {
    if ("alipay".equals(type)) {
        // 支付宝支付逻辑
    } else if ("wechat".equals(type)) {
        // 微信支付逻辑
    } else if ("bank".equals(type)) {
        // 银行卡支付逻辑
    } else {
        throw new IllegalArgumentException("不支持的支付方式");
    }
}

// 错误：多重 if 判断状态值
public void handleOrder(OrderStatus status) {
    if (status == OrderStatus.CREATED) {
        // 创建状态处理
    } else if (status == OrderStatus.PAID) {
        // 已支付状态处理
    } else if (status == OrderStatus.SHIPPED) {
        // 已发货状态处理
    } else if (status == OrderStatus.COMPLETED) {
        // 已完成状态处理
    } else {
        // 其他状态处理
    }
}
```

### TypeScript

```typescript
// 错误：多重 if 相等判断
function processPayment(type: string, amount: number): void {
    if (type === 'alipay') {
        // 支付宝支付逻辑
    } else if (type === 'wechat') {
        // 微信支付逻辑
    } else if (type === 'bank') {
        // 银行卡支付逻辑
    } else {
        throw new Error('不支持的支付方式');
    }
}
```

### Python

```python
# 错误：多重 if 相等判断
def process_payment(payment_type: str, amount: float) -> None:
    if payment_type == "alipay":
        # 支付宝支付逻辑
        pass
    elif payment_type == "wechat":
        # 微信支付逻辑
        pass
    elif payment_type == "bank":
        # 银行卡支付逻辑
        pass
    else:
        raise ValueError("不支持的支付方式")
```

## 适用场景判断

| 场景 | 是否使用策略模式 |
|------|------------------|
| 2-3 个简单分支 | 可保持 if-else |
| 4+ 个相等判断分支 | 必须使用策略模式 |
| 分支逻辑复杂（>10行） | 必须使用策略模式 |
| 未来可能新增分支 | 必须使用策略模式 |
| 分支仅做简单值映射 | 可使用 Map/字典 |

## 策略模式实现方式

| 语言 | 推荐实现 |
|------|----------|
| Java | 接口 + 实现类 + Map 注册 |
| TypeScript | 接口 + 类 + Record/Object 映射 |
| Python | 抽象类 + 实现类 + 字典映射 |
| Go | 函数类型 + Map 注册 |