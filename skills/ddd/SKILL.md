---
name: ddd
description: Use when working on DDD (Domain-Driven Design) architecture — bounded contexts, entities, value objects, aggregates, domain events, repositories, domain services, factories, CQRS, event sourcing. Trigger when user mentions DDD, domain modeling, strategic design, tactical design, CQRS, event sourcing, or asks about architectural patterns for complex business domains.
---

# Domain-Driven Design (DDD) Best Practices

## Overview

Domain-Driven Design is an approach to software development that focuses on modeling software based on the business domain. It bridges the gap between technical and business language through a shared model.

**When to Apply DDD:**
- Complex business domains with rich logic
- Teams that need a shared language (ubiquitous language)
- Long-lived systems where maintainability matters
- Systems where domain experts and developers collaborate

**When NOT to Apply DDD:**
- Simple CRUD applications with minimal business logic
- Highly standardized domains (e.g., basic e-commerce without complex rules)
- Short-lived projects with disposable code

## Strategic Design

Strategic design is about the big picture — how the system is divided into bounded contexts and how they relate to each other.

### Bounded Context

A bounded context is a linguistic and conceptual boundary where a particular domain model is valid and consistent.

```
┌─────────────────────┐     ┌─────────────────────┐
│   Order Context     │     │   Warehouse Context  │
│   - Order           │     │   - Inventory        │
│   - OrderLine       │     │   - StockLevel       │
│   - CustomerRef     │     │   - Shipment        │
└─────────────────────┘     └─────────────────────┘
```

**Key principle:** Each bounded context has its own ubiquitous language. The word "Order" may mean different things in different contexts.

### Ubiquitous Language

A shared language between developers and domain experts, used consistently within a bounded context.

- **Rule**: Use the same terminology in code, documents, and conversation
- **Example**: If domain experts say "backorder", the code should use `Backorder`, not `DelayedOrder` or `OutOfStockItem`

### Context Mapping

How bounded contexts relate to each other:

| Pattern | Description | When to Use |
|---------|-------------|-------------|
| **Partnership** | Two contexts cooperate, joint roadmap | Mutually dependent domains |
| **Shared Kernel** | Shared subset of the domain model | Closely related, stable shared model |
| **Customer-Supplier** | Upstream produces, downstream consumes | Clear dependency, async communication |
| **Conformist** | Downstream conforms to upstream model | No influence over upstream |
| **Anti-Corruption Layer** | Translates between contexts | Integrating legacy/external systems |
| **Open Host Service** | Context defines a published protocol | Multiple consumers |
| **Published Language** | Shared exchange format (e.g., JSON schema) | Public APIs |
| **Separate Ways** | No integration needed | Completely independent |
| **Big Ball of Mud** | Unstructured, avoid if possible | Legacy systems |

---

## Tactical Design

Tactical design is the implementation-level building blocks within a bounded context.

### Building Blocks Overview

```
Domain Model
├── Value Objects        # Immutable, identity-less concepts
├── Entities              # Objects with identity continuity
├── Aggregates           # Cluster of related objects with one root
├── Domain Events         # Something notable happened
├── Domain Services       # Operations that don't belong to entities
├── Repositories          # Persistence abstraction
└── Factories            # Object creation logic
```

### Value Objects

Value objects are immutable descriptions of qualities. They have no identity — two value objects with the same attributes are interchangeable.

**Characteristics:**
- Immutable after creation
- No identity (equality based on attributes)
- Self-validating
- Side-effect-free methods

**Example — Money:**

```java
/**
 * Value object representing a monetary amount with currency.
 * Immutable by design — all operations return new instances.
 *
 * @author lvdaxianerplus
 * @date 2026-03-26
 */
public final class Money {

    private final BigDecimal amount;
    private final Currency currency;

    /**
     * Constructor with validation.
     *
     * @param amount   the monetary amount (must not be null, must be >= 0)
     * @param currency the currency code (must not be null, 3 chars ISO code)
     * @author lvdaxianerplus
     * @date 2026-03-26
     */
    public Money(BigDecimal amount, Currency currency) {
        // Guard: validate non-null
        this.amount = Objects.requireNonNull(amount, "amount must not be null");
        this.currency = Objects.requireNonNull(currency, "currency must not be null");
        // Guard: validate non-negative
        if (amount.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("amount must not be negative");
        }
        this.amount = amount.stripTrailingZeros();
    }

    /**
     * Adds another money amount.
     *
     * @param other the money to add (must have same currency)
     * @return new Money instance with sum
     * @throws IllegalArgumentException if currencies don't match
     * @author lvdaxianerplus
     * @date 2026-03-26
     */
    public Money add(Money other) {
        // Guard: same currency enforcement
        if (!this.currency.equals(other.currency)) {
            throw new IllegalArgumentException(
                "cannot add different currencies: " + this.currency + " and " + other.currency
            );
        }
        return new Money(this.amount.add(other.amount), this.currency);
    }

    /**
     * Multiplies the amount by a factor.
     *
     * @param factor the multiplication factor
     * @return new Money instance with scaled amount
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
        // Value objects: equality by all attributes
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Money money = (Money) o;
        return amount.compareTo(money.amount) == 0
            && currency.equals(money.currency);
    }

    @Override
    public int hashCode() {
        // Immutable fields, safe to cache hash
        return Objects.hash(amount, currency);
    }

    public BigDecimal getAmount() { return amount; }
    public Currency getCurrency() { return currency; }
}
```

### Entities

Entities are objects with a distinct identity that persists across state changes. Identity is primary, not attributes.

**Characteristics:**
- Mutable state
- Identity persists across lifecycle
- Equality by identity (ID), not attributes
- May have invariants that span multiple attributes

**Example — Order:**

```java
/**
 * Entity representing a customer order.
 * Identity is established at creation and never changes.
 *
 * @author lvdaxianerplus
 * @date 2026-03-26
 */
public class Order {

    private final OrderId id;           // Identity — never changes
    private CustomerId customerId;
    private OrderStatus status;
    private List<OrderLine> lines;
    private Money totalAmount;

    /**
     * Creates a new order draft.
     *
     * @param customerId the customer placing the order
     * @author lvdaxianerplus
     * @date 2026-03-26
     */
    public Order(CustomerId customerId) {
        // Identity assigned at creation
        this.id = OrderId.generate();
        this.customerId = Objects.requireNonNull(customerId);
        this.status = OrderStatus.DRAFT;
        this.lines = new ArrayList<>();
        this.totalAmount = new Money(BigDecimal.ZERO, Currency.getInstance("USD"));
    }

    /**
     * Adds a line item to the order.
     *
     * @param productId the product being ordered
     * @param quantity  the quantity (must be > 0)
     * @param unitPrice the price per unit (must not be null)
     * @author lvdaxianerplus
     * @date 2026-03-26
     */
    public void addLine(ProductId productId, int quantity, Money unitPrice) {
        // Invariant: can only add lines to draft orders
        if (this.status != OrderStatus.DRAFT) {
            throw new OrderDomainException("cannot modify order in status: " + this.status);
        }
        // Guard: quantity validation
        if (quantity <= 0) {
            throw new IllegalArgumentException("quantity must be positive");
        }
        OrderLine line = new OrderLine(productId, quantity, unitPrice);
        this.lines.add(line);
        recalculateTotal();
    }

    /**
     * Submits the order for processing.
     *
     * @throws OrderDomainException if order is in invalid state
     * @author lvdaxianerplus
     * @date 2026-03-26
     */
    public void submit() {
        // Invariant: order must have at least one line
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

### Aggregates

An aggregate is a cluster of related entities and value objects with one as the root. It defines a transactional boundary — all changes to objects within the aggregate happen through the root.

**Rules:**
- The aggregate root is the only object accessible from outside
- External references point only to the aggregate root
- Changes within an aggregate are atomic (single transaction)
- Invariants are enforced at the aggregate boundary

```java
/**
 * Aggregate root for order management.
 * All external access goes through Order (the root).
 *
 * @author lvdaxianerplus
 * @date 2026-03-26
 */
public class OrderAggregate {

    private final Order order;              // Root entity
    private final List<OrderLine> lines;    // Internal to aggregate

    // Guard: constructor enforces aggregate consistency
    public OrderAggregate(Order order) {
        this.order = Objects.requireNonNull(order);
        this.lines = new ArrayList<>(order.getLines());
    }

    // All modifications through aggregate root
    public void addLine(ProductId productId, int qty, Money price) {
        order.addLine(productId, qty, price);
    }

    public void submit() {
        order.submit();
    }
}
```

### Domain Events

Domain events represent something significant that happened in the domain. They are immutable records of past occurrences.

**Characteristics:**
- Named in past tense (OrderPlaced, PaymentReceived)
- Immutable and immutable payload
- Published after the state change is committed
- Can trigger side effects in the same or other bounded contexts

```java
/**
 * Base class for all domain events.
 * Domain events are immutable records of things that happened.
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
 * Event raised when an order is submitted.
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

### Domain Services

Domain services handle operations that don't naturally belong to any entity or value object — typically multi-entity operations.

**Use domain services when:**
- The operation conceptually belongs to the domain but not a specific entity
- The operation involves multiple aggregates
- The operation is a pure transformation (no side effects)

```java
/**
 * Domain service for pricing calculations.
 * Pricing logic spans multiple products and discount rules.
 *
 * @author lvdaxianerplus
 * @date 2026-03-26
 */
public class PricingService {

    /**
     * Calculates the final price after applying discount rules.
     *
     * @param lines       the order lines to price
     * @param customerTier the customer's tier for discount eligibility
     * @return the final priced amount
     * @author lvdaxianerplus
     * @date 2026-03-26
     */
    public Money calculatePrice(List<OrderLine> lines, CustomerTier customerTier) {
        // Step 1: sum base prices
        Money baseTotal = lines.stream()
            .map(OrderLine::getSubtotal)
            .reduce(
                new Money(BigDecimal.ZERO, Currency.getInstance("USD")),
                Money::add
            );

        // Step 2: apply tier discount
        DiscountPolicy policy = DiscountPolicy.forTier(customerTier);
        return policy.applyTo(baseTotal);
    }
}
```

### Repositories

Repositories abstract the persistence of aggregates. They provide a collection-like interface for accessing aggregate roots.

**Rules:**
- Repositories operate on aggregate roots only
- Never expose internal entities or value objects directly
- Hide the persistence infrastructure details

```java
/**
 * Repository for Order aggregate persistence.
 * Abstracts database access behind a collection-like interface.
 *
 * @author lvdaxianerplus
 * @date 2026-03-26
 */
public interface OrderRepository {

    /**
     * Finds an order by its ID.
     *
     * @param id the order ID
     * @return Optional containing the order if found
     * @author lvdaxianerplus
     * @date 2026-03-26
     */
    Optional<Order> findById(OrderId id);

    /**
     * Finds all orders for a customer.
     *
     * @param customerId the customer ID
     * @return list of orders (never null)
     * @author lvdaxianerplus
     * @date 2026-03-26
     */
    List<Order> findByCustomerId(CustomerId customerId);

    /**
     * Saves an order aggregate.
     *
     * @param order the order to save
     * @author lvdaxianerplus
     * @date 2026-03-26
     */
    void save(Order order);

    /**
     * Removes an order from persistence.
     *
     * @param order the order to remove
     * @author lvdaxianerplus
     * @date 2026-03-26
     */
    void delete(Order order);
}
```

### Factories

Factories encapsulate the complex logic of creating objects, especially aggregates. They hide construction complexity and ensure invariants are established.

```java
/**
 * Factory for creating Order aggregates.
 * Encapsulates the construction logic and ensures valid initial state.
 *
 * @author lvdaxianerplus
 * @date 2026-03-26
 */
public class OrderFactory {

    /**
     * Creates a new order for a customer.
     *
     * @param customerId the customer placing the order
     * @param items     the initial items (must not be empty if provided)
     * @return new OrderAggregate ready for use
     * @author lvdaxianerplus
     * @date 2026-03-26
     */
    public OrderAggregate createOrder(CustomerId customerId, List<OrderItemData> items) {
        // Step 1: create the aggregate root
        Order order = new Order(customerId);

        // Step 2: populate initial state
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

## Layered Architecture Overview

DDD follows a strict four-layer architecture. Each layer has clear responsibilities and dependencies point inward only:

```
┌─────────────────────────────────────────┐
│   Interfaces Layer（接口层）             │  ← Driving adapters: REST, gRPC, UI
├─────────────────────────────────────────┤
│   Application Layer（应用层）            │  ← Use cases, orchestration
├─────────────────────────────────────────┤
│   Domain Layer（领域层）                  │  ← Business rules, domain model
├─────────────────────────────────────────┤
│   Infrastructure Layer（基础设施层）       │  ← Persistence, messaging, external services
└─────────────────────────────────────────┘
         Dependencies point inward only
```

| Layer | Responsibility | Dependency Rule |
|-------|---------------|----------------|
| **Interfaces** | Driving adapters — accepts external input (REST, gRPC, CLI) | Depends only on Application |
| **Application** | Orchestrates use cases, coordinates domain objects | Depends on Domain |
| **Domain** | Contains all business rules, entities, value objects, aggregates | No external dependencies |
| **Infrastructure** | Driven adapters — implements ports from Domain/Application | Supports all layers |

### Dependency Direction

**Critical rule**: Dependencies ALWAYS point inward. The Domain layer never depends on Application, Infrastructure, or Presentation. This is enforced through interfaces (e.g., `OrderRepository` is defined in Domain, implemented in Infrastructure).

```java
// Domain layer defines the interface
public interface OrderRepository {
    Optional<Order> findById(OrderId id);
}

// Infrastructure layer implements it
@Repository
public class JpaOrderRepository implements OrderRepository {
    // implements findById() using JPA
}
```

## Interfaces Layer

The interfaces layer contains driving adapters that bridge external systems to the application. It handles HTTP, gRPC, CLI, or any external input — accepting requests, validating input, and returning responses. It knows nothing about business rules.

### REST Controller

```java
/**
 * REST controller for order operations.
 * Responsible for HTTP request/response handling only.
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
     * Creates a new order.
     *
     * @param request the order creation request
     * @return 201 Created with order ID
     * @author lvdaxianerplus
     * @date 2026-03-26
     */
    @PostMapping
    public ResponseEntity<OrderResponse> createOrder(
            @Valid @RequestBody CreateOrderRequest request) {
        // Guard: basic input validation happens here
        // No business logic — just HTTP handling
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
     * Retrieves an order by ID.
     *
     * @param id the order ID
     * @return 200 OK with order details
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

### Request/Response DTOs

```java
/**
 * Request DTO for creating an order.
 * Immutable — designed for transfer only, not domain logic.
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
 * Response DTO for order data.
 * Immutable record representing API output format.
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

## Application Layer

The application layer coordinates the domain objects to accomplish user goals. It is thin — it doesn't contain business logic, only orchestration.

### Application Service

```java
/**
 * Application service for order use cases.
 * Orchestrates domain objects but contains no business logic.
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
     * Handles place order command.
     *
     * @param command the place order command
     * @return the created order ID
     * @author lvdaxianerplus
     * @date 2026-03-26
     */
    public OrderId placeOrder(PlaceOrderCommand command) {
        // Step 1: create via factory
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

        // Step 2: submit
        order.submit();

        // Step 3: persist
        orderRepository.save(order.getRoot());

        // Step 4: publish domain event
        eventPublisher.publish(new OrderSubmittedEvent(
            order.getRoot().getId(),
            new CustomerId(command.getCustomerId()),
            order.getRoot().getTotalAmount()
        ));

        return order.getRoot().getId();
    }
}
```

### CQRS (Command Query Responsibility Segregation)

Separate models for reading and writing. Commands modify state; queries read state.

```
┌──────────────────────────────────────────────────────────┐
│                     Write Side                            │
│  Command → Application Service → Domain → Repository     │
│  (Order submitted, price updated)                        │
└──────────────────────────────────────────────────────────┘
                            │
                            │ Domain Events
                            ▼
┌──────────────────────────────────────────────────────────┐
│                     Read Side                             │
│  Event Handlers → Projection → Read Model (DTOs)        │
│  (order_summary_view, customer_dashboard)                │
└──────────────────────────────────────────────────────────┘
```

### Event Sourcing

Instead of storing current state, store the sequence of events that led to it. The state is reconstructed by replaying events.

**When to use:**
- Full audit trail is required
- Temporal queries ("show me all state at point X")
- Complex aggregate history needed
- Event-driven integration between contexts

**Trade-offs:**
- Added complexity in event schema evolution
- Projections needed for read models
- Event replay can be slow for large aggregates

---

## Anti-Patterns

### 1. Anemic Domain Model

Entities and value objects with little to no behavior — just getters and setters. Business logic spills into application services.

**Problem:**
```java
// BAD: Anemic entity
public class Order {
    private Long id;
    private BigDecimal total;   // Just data, no logic

    public BigDecimal getTotal() { return total; }
    public void setTotal(BigDecimal total) { this.total = total; }
}
```

**Solution:** Move behavior into the domain model.

### 2. God Objects

Putting too much logic in a single class/aggregate. Violates single responsibility.

**Problem:** A single `Order` class that handles pricing, validation, fulfillment, notifications, reporting.

**Solution:** Separate aggregates with clear boundaries. Use domain events for cross-aggregate communication.

### 3. Violating Aggregate Boundaries

Accessing internal entities from outside the aggregate. Breaks encapsulation.

**Problem:**
```java
// BAD: Accessing internal entity
Order order = orderRepo.findById(id);
order.getLines().get(0).setQuantity(5);  // Bypasses aggregate root
```

**Solution:** All modifications through aggregate root methods.

### 4. Anemic Services

Application services that contain all business logic instead of domain model.

**Problem:** Service methods that look like: `calculatePrice()`, `validateOrder()`, `sendNotification()` — all in one service.

**Solution:** Distribute logic to the appropriate domain objects (entities, value objects, domain services).

### 5. Anemic Value Objects

Value objects that are mutable and have no validation.

**Solution:** Make value objects immutable and self-validating.

---

## Quick Reference

### Entity vs Value Object

| Question | Answer = Entity | Answer = Value Object |
|----------|-----------------|----------------------|
| Does it need identity? | Yes | No |
| Should it be mutable? | Often yes | No (immutable) |
| Does it have lifecycle continuity? | Yes | No |
| Can two with same attributes be interchangeable? | No | Yes |

### Aggregate Size

| Too Small | Just Right | Too Large |
|-----------|-----------|-----------|
| One entity per aggregate | Cluster of related objects | Entire system as one aggregate |
| High inter-aggregate coordination | Clear transactional boundary | Transaction conflicts, performance issues |

### When to Publish Domain Events

- State changes that other parts of the system care about
- Cross-aggregate business rules are satisfied
- After the aggregate root commits successfully
- Never within a constructor (use factory or factory method instead)

### Bounded Context Discovery

Look for:
- Different business processes with different rules
- Teams that work independently
- Different terminology for the same concept
- Different rates of change
- Distinct persistence needs

---

## Package Structure (Java)

```
com.example.interfaces/                        # Layer 1: Interfaces (driving adapters)
├── rest/
│   └── OrderController.java                 // REST adapter
├── dto/
│   ├── request/
│   │   ├── CreateOrderRequest.java         // Input DTO
│   │   └── OrderItemRequest.java
│   └── response/
│       ├── OrderResponse.java
│       └── MoneyDto.java

com.example.application/                       # Layer 2: Application
├── order/
│   ├── OrderApplicationService.java        // Application service
│   ├── PlaceOrderCommand.java              // Command DTO
│   └── OrderDto.java                       // Query DTO
└── event/
    └── OrderEventHandler.java              // Event handler

com.example.domain/                           # Layer 3: Domain (core, no deps)
├── model/
│   ├── order/
│   │   ├── Order.java                      // Aggregate root (entity)
│   │   ├── OrderId.java                    // Value object
│   │   ├── OrderLine.java                  // Entity (internal to aggregate)
│   │   ├── OrderStatus.java                // Value object (enum-like)
│   │   ├── Money.java                      // Value object
│   │   ├── OrderSubmittedEvent.java        // Domain event
│   │   └── OrderDomainException.java       // Domain exception
│   ├── customer/
│   │   └── CustomerId.java
│   └── pricing/
│       ├── PricingService.java             // Domain service
│       └── DiscountPolicy.java             // Value object / strategy
├── repository/
│   └── OrderRepository.java                // Repository interface (defined here)
└── factory/
    └── OrderFactory.java                   // Factory

com.example.infrastructure/                   # Layer 4: Infrastructure
├── persistence/
│   ├── JpaOrderRepository.java             // Repository implementation
│   └── entity/
│       └── OrderEntity.java               // JPA entity
├── messaging/
│   └── DomainEventPublisher.java          // Event publishing (e.g., Kafka)
└── external/
    └── PaymentGatewayAdapter.java          // Anti-corruption layer
```

### Dependency Rules Summary

```
presentation → application → domain ← infrastructure
                         ↑
                    (interface only)
```

- `domain/` — **Core**. Zero dependencies on any other layer. Defines repository interfaces.
- `application/` — Depends on `domain/`. Orchestrates domain objects.
- `interfaces/` — Depends on `application/`. Driving adapters (REST, gRPC, CLI) handle HTTP only.
- `infrastructure/` — Implements interfaces from `domain/`. Driven adapters (DB, messaging, external services).
