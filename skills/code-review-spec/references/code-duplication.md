# 代码重复检测规范

> **强制要求**：相同或相似代码出现多次时，必须提取为公共方法/函数。

## 重复代码检测标准

| 重复程度 | 处理要求 |
|----------|----------|
| 相同代码块 ≥ 3 处 | **必须**提取为公共方法 |
| 相似代码块 ≥ 2 处 | **应该**提取，使用参数区分差异 |
| 结构相似但逻辑不同 | 考虑抽象模板方法模式 |

## 正确示例

### Java - 提取公共方法

```java
// 错误：重复代码分散在多处
public class OrderService {
    public void processOrder(Order order) {
        log.info("[订单处理] 开始处理订单: {}", order.getId());
        try {
            validateOrder(order);
            calculatePrice(order);
            saveOrder(order);
            log.info("[订单处理] 订单处理成功: {}", order.getId());
        } catch (Exception e) {
            log.error("[订单处理] 订单处理失败: {}", order.getId(), e);
        }
    }

    public void processRefund(Refund refund) {
        log.info("[退款处理] 开始处理退款: {}", refund.getId());
        try {
            validateRefund(refund);
            calculateRefundAmount(refund);
            saveRefund(refund);
            log.info("[退款处理] 退款处理成功: {}", refund.getId());
        } catch (Exception e) {
            log.error("[退款处理] 退款处理失败: {}", refund.getId(), e);
        }
    }
}

// 正确：提取公共处理模板
public abstract class ProcessTemplate<T> {
    
    protected abstract void validate(T entity);
    protected abstract void process(T entity);
    protected abstract void save(T entity);
    protected abstract String getProcessName();
    protected abstract String getEntityId(T entity);
    
    public void execute(T entity) {
        String processName = getProcessName();
        String entityId = getEntityId(entity);
        
        log.info("[{}] 开始处理: {}", processName, entityId);
        try {
            validate(entity);
            process(entity);
            save(entity);
            log.info("[{}] 处理成功: {}", processName, entityId);
        } catch (Exception e) {
            log.error("[{}] 处理失败: {}", processName, entityId, e);
            throw e;
        }
    }
}

public class OrderProcessor extends ProcessTemplate<Order> {
    @Override
    protected String getProcessName() { return "订单处理"; }
    @Override
    protected String getEntityId(Order order) { return order.getId(); }
    // 其他实现...
}
```

### TypeScript - 提取公共函数

```typescript
// 错误：多处重复的 API 调用代码
async function fetchUser(id: number): Promise<User> {
    try {
        const response = await fetch(`/api/users/${id}`);
        if (!response.ok) {
            throw new Error(`请求失败: ${response.status}`);
        }
        return response.json();
    } catch (error) {
        console.error(`获取用户失败:`, error);
        throw error;
    }
}

async function fetchOrder(id: number): Promise<Order> {
    try {
        const response = await fetch(`/api/orders/${id}`);
        if (!response.ok) {
            throw new Error(`请求失败: ${response.status}`);
        }
        return response.json();
    } catch (error) {
        console.error(`获取订单失败:`, error);
        throw error;
    }
}

// 正确：提取公共请求函数
async function fetchApi<T>(endpoint: string, resourceName: string): Promise<T> {
    try {
        const response = await fetch(endpoint);
        if (!response.ok) {
            throw new Error(`请求失败: ${response.status}`);
        }
        return response.json();
    } catch (error) {
        console.error(`获取${resourceName}失败:`, error);
        throw error;
    }
}

async function fetchUser(id: number): Promise<User> {
    return fetchApi<User>(`/api/users/${id}`, "用户");
}

async function fetchOrder(id: number): Promise<Order> {
    return fetchApi<Order>(`/api/orders/${id}`, "订单");
}
```

### Python - 提取公共逻辑

```python
# 错误：重复的数据转换代码
def process_users(users: list[dict]) -> list[User]:
    results = []
    for user_dict in users:
        user = User(
            id=user_dict["id"],
            name=user_dict["name"],
            email=user_dict["email"],
            created_at=datetime.strptime(user_dict["created_at"], "%Y-%m-%d")
        )
        results.append(user)
    return results

def process_orders(orders: list[dict]) -> list[Order]:
    results = []
    for order_dict in orders:
        order = Order(
            id=order_dict["id"],
            user_id=order_dict["user_id"],
            amount=float(order_dict["amount"]),
            created_at=datetime.strptime(order_dict["created_at"], "%Y-%m-%d")
        )
        results.append(order)
    return results

# 正确：提取通用转换逻辑
def parse_datetime(date_str: str) -> datetime:
    """通用日期解析函数"""
    return datetime.strptime(date_str, "%Y-%m-%d")

def transform_list(data_list: list[dict], transformer: Callable[[dict], T]) -> list[T]:
    """通用列表转换函数"""
    return [transformer(item) for item in data_list]

def transform_user(user_dict: dict) -> User:
    return User(
        id=user_dict["id"],
        name=user_dict["name"],
        email=user_dict["email"],
        created_at=parse_datetime(user_dict["created_at"])
    )

def process_users(users: list[dict]) -> list[User]:
    return transform_list(users, transform_user)
```

### Go - 提取公共处理

```go
// 错误：重复的错误处理和日志
func ProcessOrder(order Order) error {
    log.Printf("[订单处理] 开始处理: %d", order.ID)
    err := validateOrder(order)
    if err != nil {
        log.Printf("[订单处理] 验证失败: %d, %v", order.ID, err)
        return err
    }
    err = saveOrder(order)
    if err != nil {
        log.Printf("[订单处理] 保存失败: %d, %v", order.ID, err)
        return err
    }
    log.Printf("[订单处理] 处理成功: %d", order.ID)
    return nil
}

func ProcessRefund(refund Refund) error {
    log.Printf("[退款处理] 开始处理: %d", refund.ID)
    err := validateRefund(refund)
    if err != nil {
        log.Printf("[退款处理] 验证失败: %d, %v", refund.ID, err)
        return err
    }
    // ... 重复结构
    return nil
}

// 正确：提取公共处理模板
type Processor interface {
    Validate() error
    Process() error
    Save() error
    GetProcessName() string
    GetEntityID() string
}

func ExecuteProcess(p Processor) error {
    name := p.GetProcessName()
    id := p.GetEntityID()
    
    log.Printf("[%s] 开始处理: %s", name, id)
    
    if err := p.Validate(); err != nil {
        log.Printf("[%s] 验证失败: %s, %v", name, id, err)
        return err
    }
    
    if err := p.Process(); err != nil {
        log.Printf("[%s] 处理失败: %s, %v", name, id, err)
        return err
    }
    
    if err := p.Save(); err != nil {
        log.Printf("[%s] 保存失败: %s, %v", name, id, err)
        return err
    }
    
    log.Printf("[%s] 处理成功: %s", name, id)
    return nil
}
```

## 模板方法模式示例

### Java

```java
// 正确：使用模板方法模式处理相似流程
public abstract class DataImporter {
    
    // 模板方法：定义固定流程
    public final void importData(String filePath) {
        List<String> lines = readFile(filePath);
        List<Object> data = parseLines(lines);
        validateData(data);
        saveData(data);
        logImportResult(data.size());
    }
    
    // 子类实现的具体步骤
    protected abstract List<Object> parseLines(List<String> lines);
    protected abstract void validateData(List<Object> data);
    protected abstract void saveData(List<Object> data);
    
    // 公共方法
    private List<String> readFile(String filePath) {
        // 通用的文件读取逻辑
    }
    
    private void logImportResult(int count) {
        log.info("导入完成，共 {} 条数据", count);
    }
}

public class UserImporter extends DataImporter {
    @Override
    protected List<Object> parseLines(List<String> lines) {
        // 用户特定的解析逻辑
    }
    
    @Override
    protected void validateData(List<Object> data) {
        // 用户特定的验证逻辑
    }
    
    @Override
    protected void saveData(List<Object> data) {
        // 用户特定的保存逻辑
    }
}
```

## 重复代码检测方法

### 手动检测

1. **代码审查时关注**：相似的代码块结构
2. **重构前检查**：搜索相同或相似的代码片段
3. **IDE 支持**：使用 IDE 的重复代码检测功能

### 工具检测

| 语言 | 推荐工具 |
|------|----------|
| Java | PMD、SonarQube、IntelliJ IDEA |
| TypeScript | ESLint (no-duplicate-code)、SonarQube |
| Python | pylint (duplicate-code)、SonarQube |
| Go | go vet、golangci-lint |

## 重构原则

| 原则 | 说明 |
|------|------|
| 单一职责 | 提取的方法只做一件事 |
| 命名清晰 | 方法名准确描述功能 |
| 参数合理 | 使用参数对象处理复杂输入 |
| 保持简洁 | 提取后方法行数 ≤ 20 行 |
| 测试覆盖 | 提取的方法必须有单元测试 |