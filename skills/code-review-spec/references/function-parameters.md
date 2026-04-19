# 函数参数数量限制规范

> **强制要求**：函数参数数量必须严格控制，超过限制必须重构。

## 参数数量规范

| 参数数量 | 处理方式 |
|----------|----------|
| 1-3 个 | 直接传参，清晰简洁 |
| 4-5 个 | 使用配置对象/结构体/字典 |
| 6+ 个 | **必须重构**：拆分函数或封装参数类 |

## 正确示例

### Java

```java
// 正确：1-3 个参数，直接传参
public User findUserById(Long id) { ... }
public User createUser(String name, String email) { ... }
public Order createOrder(Long userId, String productId, int quantity) { ... }

// 正确：4-5 个参数，使用配置对象
public class UserCreateRequest {
    private String name;
    private String email;
    private String phone;
    private String address;
    private Integer age;
}

public User createUser(UserCreateRequest request) { ... }

// 正确：6+ 个参数，拆分函数或封装
public class OrderRequest {
    private Long userId;
    private List<OrderItem> items;
    private ShippingInfo shipping;
    private PaymentInfo payment;
}

public Order createOrder(OrderRequest request) { ... }
```

### TypeScript

```typescript
// 正确：1-3 个参数
function findUserById(id: number): User { ... }
function createUser(name: string, email: string): User { ... }
function createOrder(userId: number, productId: string, quantity: number): Order { ... }

// 正确：4-5 个参数，使用配置对象
interface UserCreateRequest {
    name: string;
    email: string;
    phone?: string;
    address?: string;
    age?: number;
}

function createUser(request: UserCreateRequest): User { ... }

// 正确：使用解构提高可读性
function createUser({ name, email, phone, address, age }: UserCreateRequest): User { ... }
```

### Python

```python
# 正确：1-3 个参数
def find_user_by_id(user_id: int) -> User: ...
def create_user(name: str, email: str) -> User: ...
def create_order(user_id: int, product_id: str, quantity: int) -> Order: ...

# 正确：4-5 个参数，使用字典或 dataclass
from dataclasses import dataclass

@dataclass
class UserCreateRequest:
    name: str
    email: str
    phone: str = ""
    address: str = ""
    age: int = 0

def create_user(request: UserCreateRequest) -> User: ...

# 正确：使用关键字参数
def create_user(name: str, email: str, *, phone: str = "", address: str = "", age: int = 0) -> User: ...
```

### Go

```go
// 正确：1-3 个参数
func FindUserByID(id int64) (User, error) { ... }
func CreateUser(name, email string) (User, error) { ... }
func CreateOrder(userID int64, productID string, quantity int) (Order, error) { ... }

// 正确：4-5 个参数，使用结构体
type UserCreateRequest struct {
    Name    string
    Email   string
    Phone   string
    Address string
    Age     int
}

func CreateUser(req UserCreateRequest) (User, error) { ... }

// 正确：6+ 个参数，拆分或封装
type OrderRequest struct {
    UserID   int64
    Items    []OrderItem
    Shipping ShippingInfo
    Payment  PaymentInfo
}

func CreateOrder(req OrderRequest) (Order, error) { ... }
```

## 错误示例

### Java

```java
// 错误：6+ 个参数，难以维护
public User createUser(String name, String email, String phone, 
                       String address, Integer age, String avatar,
                       String nickname, String bio) {
    // 参数顺序容易混淆，调用时必须记住所有位置
}

// 错误：参数含义不清晰
public void update(Long id, String v1, String v2, int v3, boolean v4) {
    // v1, v2, v3, v4 是什么？完全无法理解
}
```

### TypeScript

```typescript
// 错误：6+ 个参数
function createUser(
    name: string,
    email: string,
    phone: string,
    address: string,
    age: number,
    avatar: string,
    nickname: string,
    bio: string
): User { ... }

// 错误：调用时参数顺序混乱
createUser("张三", "test@example.com", "13800138000", 
           "北京市", 25, "avatar.png", "昵称", "简介");
// 哪个是 phone？哪个是 address？容易出错
```

### Python

```python
# 错误：6+ 个参数
def create_user(name: str, email: str, phone: str, 
                address: str, age: int, avatar: str, 
                nickname: str, bio: str) -> User: ...

# 错误：调用时必须记住所有位置
create_user("张三", "test@example.com", "13800138000",
            "北京市", 25, "avatar.png", "昵称", "简介")
```

### Go

```go
// 错误：6+ 个参数
func CreateUser(name, email, phone, address string, 
                age int, avatar, nickname, bio string) (User, error) {
    // 参数太多，类型相邻时更容易混淆
}
```

## 参数对象设计原则

### 原则一：语义分组

```typescript
// 错误：参数无分组逻辑
function createOrder(userId: number, productId: string, quantity: number,
                     street: string, city: string, zipCode: string,
                     cardNumber: string, cardHolder: string) { ... }

// 正确：按语义分组封装
interface ShippingAddress {
    street: string;
    city: string;
    zipCode: string;
}

interface PaymentMethod {
    cardNumber: string;
    cardHolder: string;
}

interface OrderRequest {
    userId: number;
    items: OrderItem[];
    shipping: ShippingAddress;
    payment: PaymentMethod;
}

function createOrder(request: OrderRequest) { ... }
```

### 原则二：可选参数标记

```java
// 正确：使用 Builder 模式处理可选参数
public class UserCreateRequest {
    private final String name;      // 必填
    private final String email;     // 必填
    private String phone = "";      // 可选，有默认值
    private String address = "";    // 可选
    private Integer age = 0;        // 可选

    public static Builder builder(String name, String email) {
        return new Builder(name, email);
    }

    public static class Builder {
        // Builder 实现...
    }
}

// 调用方式
UserCreateRequest request = UserCreateRequest.builder("张三", "test@example.com")
    .phone("13800138000")
    .age(25)
    .build();
```

### 原则三：参数验证集中处理

```python
# 正确：参数对象内统一验证
@dataclass
class UserCreateRequest:
    name: str
    email: str
    phone: str = ""
    
    def __post_init__(self):
        if not self.name:
            raise ValueError("姓名不能为空")
        if "@" not in self.email:
            raise ValueError("邮箱格式不正确")
        if self.phone and not self.phone.startswith("1"):
            raise ValueError("手机号格式不正确")

def create_user(request: UserCreateRequest) -> User:
    # 验证已在 __post_init__ 中完成，直接使用
    ...
```

## 参数重构策略

| 场景 | 重构方式 |
|------|----------|
| 参数 6+ 个 | 封装为参数对象/结构体 |
| 参数含义不清 | 使用命名参数或配置对象 |
| 有可选参数 | 使用 Builder 模式或默认值 |
| 参数来自同一对象 | 直接传递对象而非拆解属性 |
| 参数经常变化 | 使用配置对象，便于扩展 |