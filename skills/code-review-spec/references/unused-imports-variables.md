# 未使用导入与变量清理规范

## 1. 未使用导入清理

> **强制要求**：所有 import 语句必须被实际使用，不得存在任何冗余导入。

**危害**：
- 增加编译时间（Java 需要解析更多文件）
- 增加类加载时间
- 代码可读性差，难以判断依赖关系
- 可能隐藏循环依赖问题

### 1.1 Java 未使用导入

<details>
<summary><b>错误示例</b></summary>

```java
package com.example.service;

import cn.dev33.satoken.stp.StpUtil;           // 未使用
import com.uino.hundun.base.bean.auth.bo.Subject;  // 已使用
import com.uino.hundun.common.properties.SprayAuthProperties;  // 未使用
import com.uino.hundun.common.util.SprayUtil;    // 已使用
import com.uino.hundun.hundunauthoffline.sso.loginauth.login.impl.GanziOauthLogin;  // 已使用
import com.uino.hundun.hundunauthoffline.sso.loginauth.oauth.GanziOauthConstants;  // 已使用
import com.uino.hundun.hundunauthoffline.sso.loginauth.oauth.GanziOauthUrlBuilder;  // 已使用
import io.swagger.annotations.Api;              // 未使用
import io.swagger.annotations.ApiOperation;     // 已使用
import lombok.RequiredArgsConstructor;          // 已使用
import lombok.extern.slf4j.Slf4j;               // 已使用
import org.springframework.web.bind.annotation.GetMapping;    // 已使用
import org.springframework.web.bind.annotation.RequestMapping; // 已使用
import org.springframework.web.bind.annotation.RestController; // 已使用

import javax.servlet.http.HttpServletRequest;   // 已使用
import javax.servlet.http.HttpServletResponse;   // 已使用
import java.io.IOException;                     // 已使用
import java.util.Optional;                      // 已使用
```

</details>

<details>
<summary><b>正确示例</b></summary>

```java
package com.example.service;

import com.uino.hundun.base.bean.auth.bo.Subject;  // 已使用
import com.uino.hundun.common.util.SprayUtil;    // 已使用
import com.uino.hundun.hundunauthoffline.sso.loginauth.login.impl.GanziOauthLogin;  // 已使用
import com.uino.hundun.hundunauthoffline.sso.loginauth.oauth.GanziOauthConstants;  // 已使用
import com.uino.hundun.hundunauthoffline.sso.loginauth.oauth.GanziOauthUrlBuilder;  // 已使用
import io.swagger.annotations.ApiOperation;     // 已使用
import lombok.RequiredArgsConstructor;          // 已使用
import lombok.extern.slf4j.Slf4j;               // 已使用
import org.springframework.web.bind.annotation.GetMapping;    // 已使用
import org.springframework.web.bind.annotation.RequestMapping; // 已使用
import org.springframework.web.bind.annotation.RestController; // 已使用

import javax.servlet.http.HttpServletRequest;   // 已使用
import javax.servlet.http.HttpServletResponse;   // 已使用
import java.io.IOException;                     // 已使用
import java.util.Optional;                      // 已使用
```

</details>

### 1.2 TypeScript 未使用导入

```typescript
// 错误示例：unusedFunction, unusedValue 未使用
import { usedFunction, usedValue, unusedFunction, unusedValue } from './utils';

// 正确示例：只导入实际使用的
import { usedFunction, usedValue } from './utils';
```

```typescript
// 错误示例：InterfaceA, TypeB 未使用
import { InterfaceA, TypeB, ClassC } from './types';

// 正确示例
import { ClassC } from './types';
```

## 2. 未使用变量清理

> **强制要求**：所有声明的变量（局部变量、成员变量）必须被实际使用，不得存在冗余声明。

**危害**：
- 增加内存占用（成员变量）
- 代码可读性差，容易误导读者
- 可能遗漏真正的业务逻辑
- 增加维护成本

### 2.1 Java 未使用变量

<details>
<summary><b>错误示例</b></summary>

```java
/**
 * OAuth2 登录 Controller
 */
@RestController
@RequestMapping("oauth")
public class OauthController {

    /**
     * 认证配置（已使用）
     */
    private final SprayAuthProperties sprayAuthProperties;

    /**
     * 未使用的配置字段
     */
    private final UnusedConfig unusedConfig;  // 错误：未使用的成员变量

    /**
     * 登录方法
     */
    public void login(HttpServletRequest request) {
        // 获取配置
        Sys ganzi = sprayAuthProperties.getSys("ganzi");

        // 错误：声明但未使用的局部变量
        String unusedLocalVar = "this is not used";
        String anotherUnused = ganzi.getClientId();  // 获取了但从不使用

        // 正确使用已声明的变量
        if (ganzi != null) {
            log.info("配置存在: {}", ganzi.getClientId());
        }
    }
}
```

</details>

<details>
<summary><b>正确示例</b></summary>

```java
/**
 * OAuth2 登录 Controller
 */
@RestController
@RequestMapping("oauth")
public class OauthController {

    /**
     * 认证配置
     */
    private final SprayAuthProperties sprayAuthProperties;

    /**
     * 登录实现
     */
    private final OauthLogin oauthLogin;

    /**
     * 登录方法
     */
    public void login(HttpServletRequest request) {
        // 获取配置
        Sys ganzi = sprayAuthProperties.getSys("ganzi");

        // 正确：所有变量都被使用
        if (ganzi != null) {
            log.info("配置存在: {}", ganzi.getClientId());
            oauthLogin.login(ganzi);
        }
    }
}
```

</details>

### 2.2 TypeScript 未使用变量

```typescript
// 错误示例
const unusedVariable = "this is not used";
const result = calculate(); // 结果从不使用

// 正确示例
const result = calculate();
console.log(result);
```

## 3. IDE 自动清理工具

### 3.1 IntelliJ IDEA

| 操作 | 快捷键 |
|------|--------|
| 优化导入 | `Ctrl + Alt + O` (Windows/Linux) / `Cmd + Option + O` (macOS) |
| 优化所有文件 | `Ctrl + Alt + O` 多次或通过 Refactor > Optimize Imports |

**设置自动优化**：
1. `Settings` > `Editor` > `General` > `Auto Import`
2. 勾选 `Optimize imports on the fly`
3. 勾选 `Add unambiguous imports on the fly`

### 3.2 VS Code

安装扩展：`ESLint` + `TypeScript Importer`

手动清理：`Cmd + Shift + P` > `ESLint: Fix all auto-fixable problems`

### 3.3 Eclipse

| 操作 | 快捷键 |
|------|--------|
| 优化导入 | `Ctrl + Shift + O` |

## 4. 参考示例：GanziOauthController

以下为符合规范的参考实现：

```java
package com.uino.hundun.hundunauthoffline.um.controller;

import cn.dev33.satoken.stp.StpUtil;
import com.uino.hundun.base.bean.auth.bo.Subject;
import com.uino.hundun.common.util.SprayUtil;
import com.uino.hundun.hundunauthoffline.sso.loginauth.login.impl.GanziOauthLogin;
import com.uino.hundun.hundunauthoffline.sso.loginauth.oauth.GanziOauthConstants;
import com.uino.hundun.hundunauthoffline.sso.loginauth.oauth.GanziOauthUrlBuilder;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Optional;

/**
 * 甘孜州统一认证 OAuth2 登录 Controller
 * 提供 OAuth2 授权码模式的登录、回调、退出功能
 *
 * @author lvdaxianerplus
 * @date 2026/04/22
 */
@Api("甘孜州 OAuth2 登录")
@RestController
@RequiredArgsConstructor
@Slf4j
@RequestMapping("ganzi/oauth")
public class GanziOauthController {

    // ========== 依赖注入 ==========

    private final SprayAuthProperties sprayAuthProperties;
    private final GanziOauthLogin ganziOauthLogin;
    private final GanziOauthUrlBuilder urlBuilder = new GanziOauthUrlBuilder();

    // ========== 接口方法 ==========

    /**
     * 甘孜州 OAuth2 登录入口
     */
    @GetMapping("redirect")
    @ApiOperation("甘孜州 OAuth2 登录入口")
    public void redirect(HttpServletRequest request, HttpServletResponse response) throws IOException {
        log.info("【甘孜州 OAuth2】开始登录流程");

        // 获取甘孜州配置
        Sys ganzi = sprayAuthProperties.getSys("ganzi");

        // 校验配置
        if (!validateConfig(ganzi)) {
            redirectConfigError(ganzi, request, response);
            return;
        }

        // 生成 state
        String state = urlBuilder.generateAndSaveState(request);

        // 构造回调 URL
        String callbackUrl = urlBuilder.buildCallbackUrl(ganzi, request);
        log.info("【甘孜州 OAuth2】回调地址: {}", callbackUrl);

        // 构造并重定向授权 URL
        String authorizeUrl = urlBuilder.buildAuthorizeUrl(ganzi.getServerUrl(), ganzi.getClientId(), callbackUrl, state);
        log.info("【甘孜州 OAuth2】重定向到授权页面: {}", authorizeUrl);
        response.sendRedirect(authorizeUrl);
    }

    /**
     * 甘孜州 OAuth2 回调处理
     */
    @GetMapping("callback")
    @ApiOperation("甘孜州 OAuth2 回调")
    public void callback(HttpServletRequest request, HttpServletResponse response, String code, String state, String error) throws IOException {
        log.info("【甘孜州 OAuth2】收到回调, code={}, state={}, error={}", code, state, error);

        // 获取配置
        Sys ganzi = sprayAuthProperties.getSys("ganzi");

        // 处理错误
        if (!SprayUtil.isEmpty(error)) {
            log.warn("【甘孜州 OAuth2】收到 OAuth 错误，中断流程");
            redirectOAuthError(ganzi, request, response, error);
            return;
        }

        // 校验 state
        if (!urlBuilder.validateState(request, state)) {
            log.warn("【甘孜州 OAuth2】state 验证失败，中断流程");
            redirectStateError(ganzi, request, response);
            return;
        }

        // 登录用户
        Optional<Subject> userOpt = loginUser(code);
        if (!userOpt.isPresent()) {
            log.warn("【甘孜州 OAuth2】获取用户信息失败，中断流程");
            redirectUserInfoError(ganzi, request, response);
            return;
        }

        handleLoginSuccess(ganzi, request, response, userOpt.get());
    }

    /**
     * 甘孜州 OAuth2 退出登录
     */
    @GetMapping("logout")
    @ApiOperation("甘孜州 OAuth2 退出登录")
    public void logout(HttpServletRequest request, HttpServletResponse response) throws IOException {
        log.info("【甘孜州 OAuth2】开始退出登录");

        Sys ganzi = sprayAuthProperties.getSys("ganzi");

        Optional<String> accessTokenOpt = getAccessToken();
        log.info("【甘孜州 OAuth2】获取 access_token 结果: {}", accessTokenOpt.isPresent() ? "成功" : "失败");

        StpUtil.logout();
        log.info("【甘孜州 OAuth2】Sa-Token 登出成功");

        String frontendUrl = urlBuilder.getFrontendUrl(ganzi, request);
        log.info("【甘孜州 OAuth2】前端回调地址: {}", frontendUrl);

        String logoutUrl = accessTokenOpt.isPresent()
            ? urlBuilder.buildLogoutUrl(ganzi.getServerUrl(), ganzi.getClientId(), accessTokenOpt.get(), frontendUrl)
            : urlBuilder.buildLogoutUrl(ganzi.getServerUrl(), frontendUrl);

        log.info("【甘孜州 OAuth2】重定向到甘孜州登出页面: {}", logoutUrl);
        response.sendRedirect(logoutUrl);
    }

    // ========== 私有方法 ==========

    private boolean validateConfig(Sys ganzi) {
        if (ganzi == null || SprayUtil.isEmpty(ganzi.getClientId()) || SprayUtil.isEmpty(ganzi.getServerUrl())) {
            log.error("【甘孜州 OAuth2】配置缺失");
            return false;
        }
        log.info("【甘孜州 OAuth2】配置校验通过");
        return true;
    }

    private Optional<Subject> loginUser(String code) {
        log.info("【甘孜州 OAuth2】开始用 code 换取用户信息");
        Subject user = ganziOauthLogin.loginByTk(code);
        return Optional.ofNullable(user);
    }

    private void handleLoginSuccess(Sys ganzi, HttpServletRequest request, HttpServletResponse response, Subject user) throws IOException {
        log.info("【甘孜州 OAuth2】获取用户信息成功, username={}", user.getUserName());

        StpUtil.login(user.getOpenid());
        log.info("【甘孜州 OAuth2】Sa-Token 登录成功");

        saveAccessToken();

        String token = StpUtil.getTokenValue();
        log.info("【甘孜州 OAuth2】生成 token: {}", token);

        String frontendUrl = urlBuilder.getFrontendUrl(ganzi, request);
        String redirectUrl = urlBuilder.buildSuccessRedirectUrl(frontendUrl, token);
        log.info("【甘孜州 OAuth2】登录成功，重定向: {}", redirectUrl);
        response.sendRedirect(redirectUrl);
    }

    private Optional<String> getAccessToken() {
        if (!StpUtil.isLogin()) {
            log.warn("【甘孜州 OAuth2】用户未登录，无法获取 access_token");
            return Optional.empty();
        }
        String token = (String) StpUtil.getSession().get(GanziOauthConstants.SESSION_ACCESS_TOKEN_KEY);
        return Optional.ofNullable(token);
    }

    private void saveAccessToken() {
        String token = ganziOauthLogin.getLastAccessToken();
        if (!SprayUtil.isEmpty(token)) {
            StpUtil.getSession().set(GanziOauthConstants.SESSION_ACCESS_TOKEN_KEY, token);
            log.info("【甘孜州 OAuth2】保存 access_token");
        } else {
            log.warn("【甘孜州 OAuth2】access_token 为空，跳过保存");
        }
    }

    private void redirectConfigError(Sys ganzi, HttpServletRequest request, HttpServletResponse response) throws IOException {
        String frontendUrl = urlBuilder.getFrontendUrl(ganzi, request);
        String errorUrl = urlBuilder.buildErrorUrl(frontendUrl, GanziOauthConstants.ERROR_CONFIG_MISSING);
        response.sendRedirect(errorUrl);
    }

    private void redirectOAuthError(Sys ganzi, HttpServletRequest request, HttpServletResponse response, String error) throws IOException {
        log.error("【甘孜州 OAuth2】认证失败: {}", error);
        String frontendUrl = urlBuilder.getFrontendUrl(ganzi, request);
        String errorUrl = urlBuilder.buildErrorUrl(frontendUrl, error);
        response.sendRedirect(errorUrl);
    }

    private void redirectStateError(Sys ganzi, HttpServletRequest request, HttpServletResponse response) throws IOException {
        log.error("【甘孜州 OAuth2】state 验证失败");
        String frontendUrl = urlBuilder.getFrontendUrl(ganzi, request);
        String errorUrl = urlBuilder.buildErrorUrl(frontendUrl, GanziOauthConstants.ERROR_STATE_INVALID);
        response.sendRedirect(errorUrl);
    }

    private void redirectUserInfoError(Sys ganzi, HttpServletRequest request, HttpServletResponse response) throws IOException {
        log.error("【甘孜州 OAuth2】获取用户信息失败");
        String frontendUrl = urlBuilder.getFrontendUrl(ganzi, request);
        String errorUrl = urlBuilder.buildErrorUrl(frontendUrl, GanziOauthConstants.ERROR_USER_INFO_FAILED);
        response.sendRedirect(errorUrl);
    }
}
```

**规范要点**：
- 所有 `import` 均被实际使用，无冗余
- 所有成员变量（`sprayAuthProperties`、`ganziOauthLogin`、`urlBuilder`）均被使用
- 所有局部变量均有实际用途
- 日志完整，包含业务标识 `【甘孜州 OAuth2】`
- OAuth 异常分支使用 `WARN` 级别日志
