# Java 线程池规范示例

> **仅适用于 Java**：禁止使用已定义的线程池，必须使用自定义线程池。

## 正确示例

```java
// 定义业务线程池
private static final ThreadFactory USER_THREAD_FACTORY = new ThreadFactoryBuilder()
    .setNameFormat("user-handler-%d")
    .setUncaughtExceptionHandler((t, e) -> {
        log.error("[用户处理] 线程 {} 异常", t.getName(), e);
    })
    .build();

private final ExecutorService userExecutor = new ThreadPoolExecutor(
    10, 20, 60L, TimeUnit.SECONDS,
    new LinkedBlockingQueue<>(1000),
    USER_THREAD_FACTORY,
    new ThreadPoolExecutor.CallerRunsPolicy()
);

// 线程池执行时必须打印日志
public void processUserTask(User user) {
    userExecutor.execute(() -> {
        log.info("[用户处理] 开始处理用户: {}", user.getId());
        try {
            // 业务逻辑
            log.info("[用户处理] 用户处理成功: {}", user.getId());
        } catch (Exception e) {
            log.error("[用户处理] 用户处理失败: {}", user.getId(), e);
        }
    });
}
```

## 错误示例

```java
// 错误：使用匿名线程池，无有意义名称
ExecutorService executor = Executors.newFixedThreadPool(10);

// 错误：使用 @Async 默认线程池
@Async
public void process() {
    // 无法追踪线程
}

// 错误：缺少日志
executor.execute(() -> {
    doSomething();
});
```

## 常见业务线程池命名

| 业务场景 | 线程池名称示例 |
|----------|---------------|
| 用户处理 | `user-handler-%d`、`user-processor-%d` |
| 订单处理 | `order-handler-%d`、`order-processor-%d` |
| 消息发送 | `msg-sender-%d`、`notification-sender-%d` |
| 数据同步 | `data-sync-%d`、`sync-worker-%d` |
| 文件处理 | `file-processor-%d`、`file-handler-%d` |