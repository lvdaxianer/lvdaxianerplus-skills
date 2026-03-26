---
name: ddd
description: 使用 DDD（领域驱动设计）架构时 — 限界上下文、实体、值对象、聚合、领域事件、仓储、领域服务、工厂、CQRS、事件溯源。当用户提到 DDD、领域建模、战略设计、战术设计、CQRS、事件溯源，或询问复杂业务领域的架构模式时触发。
---

# 领域驱动设计（DDD）最佳实践

## 概述

领域驱动设计是一种以业务领域为中心的软件开发方法，通过共享模型弥合技术与业务语言之间的鸿沟。

**何时使用 DDD：**
- 业务逻辑复杂的领域
- 团队需要统一语言（通用语言）
- 长期维护的系统
- 领域专家与开发者需要协作的系统

**何时不使用 DDD：**
- 简单 CRUD 应用，业务逻辑极少
- 高度标准化的领域
- 短期项目，代码无需长期维护

## 战略设计

战略设计关注全局 — 如何将系统划分为限界上下文，以及它们之间如何关联。

### 限界上下文（Bounded Context）

限界上下文是一个语言和概念上的边界，在该边界内特定领域模型是有效且一致的。

```
┌─────────────────────┐     ┌─────────────────────┐
│   订单上下文        │     │   仓库上下文         │
│   - Order           │     │   - Inventory        │
│   - OrderLine       │     │   - StockLevel       │
│   - CustomerRef     │     │   - Shipment         │
└─────────────────────┘     └─────────────────────┘
```

**核心原则：** 每个限界上下文有自己独立的通用语言。同一个词（如"订单"）在不同上下文中含义可能不同。

### 通用语言（Ubiquitous Language）

领域专家和开发者之间的共享语言，在限界上下文内保持一致使用。

- **原则**：代码、文档、对话中使用相同术语
- **示例**：如果领域专家说"缺货订单"，代码中应使用 `Backorder`，而不是 `DelayedOrder` 或 `OutOfStockItem`

### 上下文映射（Context Mapping）

限界上下文之间的关系模式：

| 模式 | 描述 | 适用场景 |
|------|------|---------|
| **合作伙伴（Partnership）** | 两个上下文协作，共同规划 | 相互依赖的领域 |
| **共享内核（Shared Kernel）** | 共享部分领域模型 | 紧密相关且共享模型稳定的领域 |
| **客户-供应商（Customer-Supplier）** | 上游生产，下游消费 | 清晰依赖关系，异步通信 |
| **遵奉者（Conformist）** | 下游遵从上游模型 | 无法影响上游 |
| **防腐层（ACL）** | 上下文间做翻译转换 | 集成遗留系统或外部系统 |
| **开放主机服务（OHS）** | 上下文定义公开协议 | 多消费者场景 |
| **已发布语言（PL）** | 共享交换格式（如 JSON Schema） | 公开 API |
| **各行其道（Separate Ways）** | 无需集成 | 完全独立 |
| **大泥球（Big Ball of Mud）** | 无结构混乱系统 | 遗留系统（尽量避免） |

---

## 战术设计

战术设计是限界上下文内的实现级构建块。

### 构建块总览

```
领域模型
├── 值对象（Value Objects）    # 不可变、无标识的特征描述
├── 实体（Entities）          # 具有标识连续性的对象
├── 聚合（Aggregates）        # 相关对象的簇，以一个为根
├── 领域事件（Domain Events）  # 发生的重要事情
├── 领域服务（Domain Services）# 不属于实体的操作
├── 仓储（Repositories）      # 持久化抽象
└── 工厂（Factories）         # 对象创建逻辑
```

### 值对象（Value Object）

值对象是不可变的特征描述。没有标识 — 属性相同的两个值对象可互换。

**特征：**
- 创建后不可变
- 无标识（通过属性判断相等）
- 自我验证
- 无副作用的方法

**示例 — Money：**

```java
/**
 * 表示货币金额的值对象。
 * 设计为不可变 — 所有操作返回新实例。
 *
 * @author lvdaxianerplus
 * @date 2026-03-26
 */
public final class Money {

    private final BigDecimal amount;
    private final Currency currency;

    /**
     * 带验证的构造方法。
     *
     * @param amount   金额（必须非空，必须 >= 0）
     * @param currency 货币代码（必须非空，3位ISO代码）
     * @author lvdaxianerplus
     * @date 2026-03-26
     */
    public Money(BigDecimal amount, Currency currency) {
        // 守卫：验证非空
        this.amount = Objects.requireNonNull(amount, "amount must not be null");
        this.currency = Objects.requireNonNull(currency, "currency must not be null");
        // 守卫：验证非负
        if (amount.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("amount must not be negative");
        }
        this.amount = amount.stripTrailingZeros();
    }

    /**
     * 加上另一个金额。
     *
     * @param other 要相加的金额（必须同货币）
     * @return 新的 Money 实例（和）
     * @throws IllegalArgumentException 货币不匹配时抛出
     * @author lvdaxianerplus
     * @date 2026-03-26
     */
    public Money add(Money other) {
        // 守卫：强制同货币
        if (!this.currency.equals(other.currency)) {
            throw new IllegalArgumentException(
                "cannot add different currencies: " + this.currency + " and " + other.currency
            );
        }
        return new Money(this.amount.add(other.amount), this.currency);
    }

    /**
     * 乘以一个因子。
     *
     * @param factor 乘法因子
     * @return 新的 Money 实例（乘积）
     * @author lvdaxianerplus
     * @date 2026-03-26
     */
    public Money multiply(double factor) {
        return new Money(
            this.amount.multiply(BigDecimal.valueOf(factor)),
            this.currency
        );
    }

    @Override
    public boolean equals(Object o) {
        // 值对象：按所有属性判断相等
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Money money = (Money) o;
        return amount.compareTo(money.amount) == 0
            && currency.equals(money.currency);
    }

    @Override
    public int hashCode() {
        return Objects.hash(amount, currency);
    }

    public BigDecimal getAmount() { return amount; }
    public Currency getCurrency() { return currency; }
}
```

### 实体（Entity）

实体是具有持久化标识的对象。标识是首要的，而非属性。

**特征：**
- 状态可变
- 标识跨生命周期持久化
- 相等性通过标识（ID）而非属性
- 可能有关联多个属性的不变量

**示例 — Order：**

```java
/**
 * 客户订单实体。
 * 标识在创建时确定，永不改变。
 *
 * @author lvdaxianerplus
 * @date 2026-03-26
 */
public class Order {

    private final OrderId id;              // 标识 — 永不改变
    private CustomerId customerId;
    private OrderStatus status;
    private List<OrderLine> lines;
    private Money totalAmount;

    /**
     * 创建新的草稿订单。
     *
     * @param customerId 下单客户
     * @author lvdaxianerplus
     * @date 2026-03-26
     */
    public Order(CustomerId customerId) {
        this.id = OrderId.generate();
        this.customerId = Objects.requireNonNull(customerId);
        this.status = OrderStatus.DRAFT;
        this.lines = new ArrayList<>();
        this.totalAmount = new Money(BigDecimal.ZERO, Currency.getInstance("USD"));
    }

    /**
     * 添加订单明细。
     *
     * @param productId 要订购的产品
     * @param quantity  数量（必须 > 0）
     * @param unitPrice 单价（必须非空）
     * @author lvdaxianerplus
     * @date 2026-03-26
     */
    public void addLine(ProductId productId, int quantity, Money unitPrice) {
        // 不变量：只能修改草稿状态订单
        if (this.status != OrderStatus.DRAFT) {
            throw new OrderDomainException("cannot modify order in status: " + this.status);
        }
        // 守卫：数量验证
        if (quantity <= 0) {
            throw new IllegalArgumentException("quantity must be positive");
        }
        OrderLine line = new OrderLine(productId, quantity, unitPrice);
        this.lines.add(line);
        recalculateTotal();
    }

    /**
     * 提交订单。
     *
     * @throws OrderDomainException 订单状态无效时抛出
     * @author lvdaxianerplus
     * @date 2026-03-26
     */
    public void submit() {
        // 不变量：订单至少有一条明细
        if (this.lines.isEmpty()) {
            throw new OrderDomainException("cannot submit empty order");
        }
        this.status = OrderStatus.SUBMITTED;
    }

    private void recalculateTotal() {
        this.totalAmount = this.lines.stream()
            .map(OrderLine::getSubtotal)
            .reduce(
                new Money(BigDecimal.ZERO, Currency.getInstance("USD")),
                Money::add
            );
    }

    public OrderId getId() { return id; }
    public OrderStatus getStatus() { return status; }
    public List<OrderLine> getLines() { return Collections.unmodifiableList(lines); }
    public Money getTotalAmount() { return totalAmount; }
}
```

### 聚合（Aggregate）

聚合是相关实体和值对象的簇，以其中一个为根。它定义了事务边界 — 聚合内所有变更都通过根进行。

**规则：**
- 聚合根是外部唯一可访问的对象
- 外部引用只指向聚合根
- 聚合内变更原子化（单事务）
- 不变量在聚合边界内强制执行

```java
/**
 * 订单聚合的聚合根。
 * 所有外部访问通过 Order（根）进行。
 *
 * @author lvdaxianerplus
 * @date 2026-03-26
 */
public class OrderAggregate {

    private final Order order;              // 根实体
    private final List<OrderLine> lines;    // 聚合内部

    // 守卫：构造函数强制聚合一致性
    public OrderAggregate(Order order) {
        this.order = Objects.requireNonNull(order);
        this.lines = new ArrayList<>(order.getLines());
    }

    // 所有修改通过聚合根
    public void addLine(ProductId productId, int qty, Money price) {
        order.addLine(productId, qty, price);
    }

    public void submit() {
        order.submit();
    }
}
```

### 领域事件（Domain Event）

领域事件表示领域中发生的重大事件。是过去发生事件的不可变记录。

**特征：**
- 命名为过去式（OrderPlaced、PaymentReceived）
- 不可变的事件载荷
- 状态变更提交后发布
- 可在同一或跨限界上下文中触发副作用

```java
/**
 * 所有领域事件的基类。
 * 领域事件是不可变记录。
 *
 * @author lvdaxianerplus
 * @date 2026-03-26
 */
public abstract class DomainEvent {

    private final UUID eventId;
    private final Instant occurredOn;

    protected DomainEvent() {
        this.eventId = UUID.randomUUID();
        this.occurredOn = Instant.now();
    }

    public UUID getEventId() { return eventId; }
    public Instant getOccurredOn() { return occurredOn; }
}

/**
 * 订单提交时触发的事件。
 *
 * @author lvdaxianerplus
 * @date 2026-03-26
 */
public class OrderSubmittedEvent extends DomainEvent {

    private final OrderId orderId;
    private final CustomerId customerId;
    private final Money totalAmount;

    public OrderSubmittedEvent(OrderId orderId, CustomerId customerId, Money totalAmount) {
        super();
        this.orderId = orderId;
        this.customerId = customerId;
        this.totalAmount = totalAmount;
    }

    public OrderId getOrderId() { return orderId; }
    public CustomerId getCustomerId() { return customerId; }
    public Money getTotalAmount() { return totalAmount; }
}
```

### 领域服务（Domain Service）

领域服务处理不属于任何实体或值对象的操作 — 通常是跨多个实体的操作。

**使用领域服务的时机：**
- 操作概念上属于领域但不属于特定实体
- 操作涉及多个聚合
- 操作是纯转换（无副作用）

```java
/**
 * 定价领域服务。
 * 定价逻辑跨越多个产品和折扣规则。
 *
 * @author lvdaxianerplus
 * @date 2026-03-26
 */
public class PricingService {

    /**
     * 计算应用折扣规则后的最终价格。
     *
     * @param lines       订单明细列表
     * @param customerTier 客户等级（决定折扣资格）
     * @return 最终金额
     * @author lvdaxianerplus
     * @date 2026-03-26
     */
    public Money calculatePrice(List<OrderLine> lines, CustomerTier customerTier) {
        // 第1步：汇总基础价格
        Money baseTotal = lines.stream()
            .map(OrderLine::getSubtotal)
            .reduce(
                new Money(BigDecimal.ZERO, Currency.getInstance("USD")),
                Money::add
            );

        // 第2步：应用等级折扣
        DiscountPolicy policy = DiscountPolicy.forTier(customerTier);
        return policy.applyTo(baseTotal);
    }
}
```

### 仓储（Repository）

仓储抽象聚合的持久化。在访问聚合根的集合式接口背后隐藏持久化细节。

**规则：**
- 仓储只操作聚合根
- 不直接暴露内部实体或值对象
- 隐藏持久化基础设施细节

```java
/**
 * 订单聚合的仓储接口。
 * 在集合式接口背后抽象数据库访问。
 *
 * @author lvdaxianerplus
 * @date 2026-03-26
 */
public interface OrderRepository {

    /**
     * 通过 ID 查找订单。
     *
     * @param id 订单 ID
     * @return 包含订单的 Optional（如果找到）
     * @author lvdaxianerplus
     * @date 2026-03-26
     */
    Optional<Order> findById(OrderId id);

    /**
     * 查找客户的所有订单。
     *
     * @param customerId 客户 ID
     * @return 订单列表（永不为 null）
     * @author lvdaxianerplus
     * @date 2026-03-26
     */
    List<Order> findByCustomerId(CustomerId customerId);

    /**
     * 保存订单聚合。
     *
     * @param order 要保存的订单
     * @author lvdaxianerplus
     * @date 2026-03-26
     */
    void save(Order order);

    /**
     * 从持久化中删除订单。
     *
     * @param order 要删除的订单
     * @author lvdaxianerplus
     * @date 2026-03-26
     */
    void delete(Order order);
}
```

### 工厂（Factory）

工厂封装创建对象（尤其是聚合）的复杂逻辑。隐藏构造复杂性并确保建立不变量。

```java
/**
 * 创建订单聚合的工厂。
 * 封装构造逻辑，确保初始状态有效。
 *
 * @author lvdaxianerplus
 * @date 2026-03-26
 */
public class OrderFactory {

    /**
     * 为客户创建新订单。
     *
     * @param customerId 下单客户
     * @param items      初始商品（如果提供必须非空）
     * @return 可用的新 OrderAggregate
     * @author lvdaxianerplus
     * @date 2026-03-26
     */
    public OrderAggregate createOrder(CustomerId customerId, List<OrderItemData> items) {
        // 第1步：创建聚合根
        Order order = new Order(customerId);

        // 第2步：填充初始状态
        if (items != null && !items.isEmpty()) {
            for (OrderItemData item : items) {
                order.addLine(item.getProductId(), item.getQuantity(), item.getUnitPrice());
            }
        }

        return new OrderAggregate(order);
    }
}
```

---

## 分层架构概览

DDD 遵循严格的四层架构。每层职责清晰，依赖只能指向内层：

```
┌─────────────────────────────────────────┐
│   Interfaces Layer（接口层）              │  ← 驱动适配器：REST、gRPC、CLI、UI
├─────────────────────────────────────────┤
│   Application Layer（应用层）             │  ← 用例、编排
├─────────────────────────────────────────┤
│   Domain Layer（领域层）                 │  ← 业务规则、领域模型
├─────────────────────────────────────────┤
│   Infrastructure Layer（基础设施层）       │  ← 持久化、消息、外部服务
└─────────────────────────────────────────┘
              依赖只能指向内层
```

| 层级 | 职责 | 依赖规则 |
|------|------|---------|
| **Interfaces** | 驱动适配器 — 接收外部输入（REST、gRPC、CLI） | 只依赖 Application |
| **Application** | 编排用例，协调领域对象 | 依赖 Domain |
| **Domain** | 包含所有业务规则、实体、值对象、聚合 | 不依赖任何外部层 |
| **Infrastructure** | 驱动适配器 — 实现 Domain/Application 中的端口 | 支撑所有层 |

### 依赖方向

**核心规则**：依赖永远指向内层。Domain 层永远不依赖 Application、Infrastructure 或 Presentation。通过接口来解耦（如 `OrderRepository` 定义在 Domain，实现在 Infrastructure）。

```java
// Domain 层定义接口
public interface OrderRepository {
    Optional<Order> findById(OrderId id);
}

// Infrastructure 层实现接口
@Repository
public class JpaOrderRepository implements OrderRepository {
    // implements findById() using JPA
}
```

## 接口层（Interfaces Layer）

接口层包含将外部系统桥接到应用的驱动适配器。负责处理 HTTP、gRPC、CLI 或任何外部输入 — 接收请求、验证输入、返回响应。不包含任何业务逻辑。

### REST 控制器

```java
/**
 * 订单操作的 REST 控制器。
 * 只负责 HTTP 请求/响应处理，不含业务逻辑。
 *
 * @author lvdaxianerplus
 * @date 2026-03-26
 */
@RestController
@RequestMapping("/api/v1/orders")
public class OrderController {

    private final OrderApplicationService orderService;

    public OrderController(OrderApplicationService orderService) {
        this.orderService = orderService;
    }

    /**
     * 创建新订单。
     *
     * @param request 创建订单请求
     * @return 201 Created，包含订单 ID
     * @author lvdaxianerplus
     * @date 2026-03-26
     */
    @PostMapping
    public ResponseEntity<OrderResponse> createOrder(
            @Valid @RequestBody CreateOrderRequest request) {
        // 守卫：基本输入验证在这里
        // 无业务逻辑 — 只有 HTTP 处理
        OrderId orderId = orderService.placeOrder(
            new PlaceOrderCommand(
                request.getCustomerId(),
                request.getItems()
            )
        );
        return ResponseEntity
            .status(HttpStatus.CREATED)
            .body(OrderResponse.of(orderId));
    }

    /**
     * 通过 ID 获取订单。
     *
     * @param id 订单 ID
     * @return 200 OK，包含订单详情
     * @author lvdaxianerplus
     * @date 2026-03-26
     */
    @GetMapping("/{id}")
    public ResponseEntity<OrderResponse> getOrder(@PathVariable String id) {
        OrderDto order = orderService.getOrder(new OrderId(id));
        return ResponseEntity.ok(OrderResponse.fromDto(order));
    }
}
```

### 请求/响应 DTO

```java
/**
 * 创建订单的请求 DTO。
 * 不可变 — 仅用于传输，不含领域逻辑。
 *
 * @author lvdaxianerplus
 * @date 2026-03-26
 */
public record CreateOrderRequest(
    @NotNull(message = "customerId is required")
    String customerId,
    @NotEmpty(message = "items cannot be empty")
    List<OrderItemRequest> items
) {}

/**
 * 订单数据的响应 DTO。
 * 不可变记录，表示 API 输出格式。
 *
 * @author lvdaxianerplus
 * @date 2026-03-26
 */
public record OrderResponse(
    String orderId,
    String customerId,
    OrderStatusDto status,
    List<OrderItemResponse> items,
    MoneyDto totalAmount,
    Instant createdAt
) {
    public static OrderResponse of(OrderId id) {
        return new OrderResponse(id.getValue(), null, null, null, null, null);
    }

    public static OrderResponse fromDto(OrderDto dto) {
        return new OrderResponse(
            dto.orderId(),
            dto.customerId(),
            OrderStatusDto.fromStatus(dto.status()),
            dto.items().stream().map(OrderItemResponse::fromDto).toList(),
            MoneyDto.of(dto.totalAmount()),
            dto.createdAt()
        );
    }
}
```

## 应用层

应用层协调领域对象以完成用户目标。它是薄层 — 不包含业务逻辑，只有编排。

### 应用服务

```java
/**
 * 订单用例的应用服务。
 * 编排领域对象，不含业务逻辑。
 *
 * @author lvdaxianerplus
 * @date 2026-03-26
 */
@Service
@Transactional
public class OrderApplicationService {

    private final OrderRepository orderRepository;
    private final DomainEventPublisher eventPublisher;

    /**
     * 处理下单命令。
     *
     * @param command 下单命令
     * @return 创建的订单 ID
     * @author lvdaxianerplus
     * @date 2026-03-26
     */
    public OrderId placeOrder(PlaceOrderCommand command) {
        // 第1步：通过工厂创建
        OrderAggregate order = orderFactory.createOrder(
            new CustomerId(command.getCustomerId()),
            command.getItems().stream()
                .map(i -> new OrderItemData(
                    new ProductId(i.getProductId()),
                    i.getQuantity(),
                    new Money(i.getUnitPrice(), Currency.getInstance("USD"))
                ))
                .toList()
        );

        // 第2步：提交
        order.submit();

        // 第3步：持久化
        orderRepository.save(order.getRoot());

        // 第4步：发布领域事件
        eventPublisher.publish(new OrderSubmittedEvent(
            order.getRoot().getId(),
            new CustomerId(command.getCustomerId()),
            order.getRoot().getTotalAmount()
        ));

        return order.getRoot().getId();
    }
}
```

### CQRS（命令查询职责分离）

读写模型分离。命令修改状态；查询读取状态。

```
┌──────────────────────────────────────────────────────────┐
│                     写侧                                 │
│  Command → Application Service → Domain → Repository    │
│  （订单提交，价格更新）                                   │
└──────────────────────────────────────────────────────────┘
                            │
                            │ 领域事件
                            ▼
┌──────────────────────────────────────────────────────────┐
│                     读侧                                 │
│  Event Handlers → 投影 → 读模型（DTO）                   │
│  （order_summary_view, customer_dashboard）              │
└──────────────────────────────────────────────────────────┘
```

### 事件溯源（Event Sourcing）

不存储当前状态，而是存储导致当前状态的事件序列。通过重放事件重建状态。

**何时使用：**
- 需要完整的审计轨迹
- 需要时序查询（"显示 X 时间点的所有状态"）
- 需要复杂的聚合历史
- 需要跨上下文的事件驱动集成

**权衡：**
- 事件 schema 演进带来额外复杂度
- 需要投影来构建读模型
- 大量事件的聚合重放可能很慢

---

## 反模式

### 1. 贫血领域模型（Anemic Domain Model）

实体和值对象几乎没有行为，只有 getter 和 setter。业务逻辑泄漏到应用服务中。

**问题：**
```java
// 错误：贫血实体
public class Order {
    private Long id;
    private BigDecimal total;   // 只有数据，没有逻辑

    public BigDecimal getTotal() { return total; }
    public void setTotal(BigDecimal total) { this.total = total; }
}
```

**解决：** 将行为移入领域模型。

### 2. 上帝对象（God Objects）

单个类/聚合承担过多逻辑。违反单一职责。

**问题：** 一个 `Order` 类同时处理定价、验证、履约、通知、报表。

**解决：** 拆分为多个边界清晰的聚合。通过领域事件进行跨聚合通信。

### 3. 违反聚合边界

从聚合外部访问内部实体。破坏封装。

**问题：**
```java
// 错误：访问内部实体
Order order = orderRepo.findById(id);
order.getLines().get(0).setQuantity(5);  // 绕过聚合根
```

**解决：** 所有修改通过聚合根方法进行。

### 4. 贫血服务（Anemic Services）

应用服务包含所有业务逻辑，而非领域模型。

**问题：** 服务方法像这样：所有 `calculatePrice()`、`validateOrder()`、`sendNotification()` 都在一个服务里。

**解决：** 将逻辑分布到合适的领域对象（实体、值对象、领域服务）。

### 5. 贫血值对象

可变且无验证的值对象。

**解决：** 使值对象不可变且自我验证。

---

## 速查参考

### 实体 vs 值对象

| 问题 | 回答 = 实体 | 回答 = 值对象 |
|------|------------|-------------|
| 需要标识吗？ | 是 | 否 |
| 应该可变吗？ | 通常是 | 否（不可变） |
| 有生命周期连续性吗？ | 有 | 无 |
| 属性相同的可以互换吗？ | 否 | 是 |

### 聚合大小

| 太小 | 适中 | 太大 |
|------|------|------|
| 每个聚合只有一个实体 | 相关对象簇，事务边界清晰 | 整个系统一个聚合 |
| 聚合间协调过多 | 清晰的聚合边界 | 事务冲突、性能问题 |

### 何时发布领域事件

- 其他部分关心的状态变更
- 跨聚合业务规则满足后
- 聚合根成功提交后
- 绝不在构造函数内发布（改用工厂或工厂方法）

### 限界上下文发现

寻找以下信号：
- 具有不同规则的不同业务流程
- 独立工作的团队
- 同一概念使用不同术语
- 不同的变更频率
- 不同的持久化需求

---

## 包结构（Java）

```
com.example.interfaces/                        # 第1层：接口层（驱动适配器）
├── rest/
│   └── OrderController.java                 // REST 适配器
├── dto/
│   ├── request/
│   │   ├── CreateOrderRequest.java         // 输入 DTO
│   │   └── OrderItemRequest.java
│   └── response/
│       ├── OrderResponse.java
│       └── MoneyDto.java

com.example.application/                       # 第2层：应用层
├── order/
│   ├── OrderApplicationService.java        // 应用服务
│   ├── PlaceOrderCommand.java              // 命令 DTO
│   └── OrderDto.java                       // 查询 DTO
└── event/
    └── OrderEventHandler.java               // 事件处理器

com.example.domain/                           # 第3层：领域层（核心，无依赖）
├── model/
│   ├── order/
│   │   ├── Order.java                      // 聚合根（实体）
│   │   ├── OrderId.java                    // 值对象
│   │   ├── OrderLine.java                  // 实体（聚合内部）
│   │   ├── OrderStatus.java                // 值对象（类似枚举）
│   │   ├── Money.java                      // 值对象
│   │   ├── OrderSubmittedEvent.java        // 领域事件
│   │   └── OrderDomainException.java       // 领域异常
│   ├── customer/
│   │   └── CustomerId.java
│   └── pricing/
│       ├── PricingService.java             // 领域服务
│       └── DiscountPolicy.java             // 值对象 / 策略模式
├── repository/
│   └── OrderRepository.java                // 仓储接口（定义在此）
└── factory/
    └── OrderFactory.java                    // 工厂

com.example.infrastructure/                   # 第4层：基础设施层
├── persistence/
│   ├── JpaOrderRepository.java             // 仓储实现
│   └── entity/
│       └── OrderEntity.java               // JPA 实体
├── messaging/
│   └── DomainEventPublisher.java           // 事件发布（如 Kafka）
└── external/
    └── PaymentGatewayAdapter.java           // 防腐层
```

### 依赖规则总结

```
presentation → application → domain ← infrastructure
                         ↑
                    （仅通过接口）
```

- `domain/` — **核心层**。不依赖任何其他层。定义仓储接口。
- `application/` — 依赖 `domain/`。编排领域对象。
- `interfaces/` — 依赖 `application/`。驱动适配器（REST、gRPC、CLI）只处理 HTTP。
- `infrastructure/` — 实现 `domain/` 中定义的接口。驱动适配器（数据库、消息、外部服务）。
