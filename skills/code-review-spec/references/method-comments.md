# 方法注释规范示例

## Java

```java
/**
 * 方法功能的简要描述
 *
 * @param paramName 参数描述（有效值、无效值）
 * @param paramName2 参数描述
 * @return 返回值描述（可能的值、边界情况）
 * @author lvdaxianerplus
 * @date 创建日期（格式：yyyy-MM-dd）
 */
public void methodName(String paramName) {

}
```

## Go

```go
// MethodName 方法功能的简要描述
//
// Parameters:
//   - paramName: 参数描述（有效值、无效值）
//   - paramName2: 参数描述
//
// Returns: 返回值描述（可能的值、边界情况）
//
// Author: lvdaxianerplus
// Date: 2024-01-15
func MethodName(paramName string) {

}
```

## TypeScript / Vue

```typescript
/**
 * 方法功能的简要描述
 *
 * @param paramName - 参数描述（有效值、无效值）
 * @param paramName2 - 参数描述
 * @returns 返回值描述（可能的值、边界情况）
 * @author lvdaxianerplus
 * @date 2024-01-15
 */
function methodName(paramName: string): void {

}

/**
 * Vue 组合式函数示例
 *
 * @param userId - 用户 ID（有效值 > 0）
 * @returns 用户信息对象
 * @author lvdaxianerplus
 * @date 2024-01-15
 */
async function fetchUser(userId: number): Promise<User> {

}
```

```typescript
// Vue 组件方式（script setup）
// <script setup lang="ts">
/**
 * 获取用户信息
 *
 * @param userId - 用户 ID（有效值 > 0）
 * @returns 用户信息对象
 * @author lvdaxianerplus
 * @date 2024-01-15
 */
const getUser = async (userId: number): Promise<User> => {

};
```

## Python

```python
def method_name(param_name: str) -> None:
    """
    方法功能的简要描述

    Args:
        param_name: 参数描述（有效值、无效值）
        param_name2: 参数描述

    Returns:
        返回值描述（可能的值、边界情况）

    Author: lvdaxianerplus
    Date: 2024-01-15
    """
    pass
```

```python
async def fetch_user(user_id: int) -> dict:
    """
    获取用户信息

    Args:
        user_id: 用户 ID（有效值 > 0）

    Returns:
        用户信息字典

    Raises:
        UserNotFoundError: 用户不存在时抛出

    Author: lvdaxianerplus
    Date: 2024-01-15
    """
    pass
```