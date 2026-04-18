/**
 * Configuration types for MCP HTTP Gateway
 *
 * @author lvdaxianerplus
 * @date 2026-04-18
 */

/**
 * Parameter definition
 *
 * @param description - Parameter description for LLM understanding
 * @param type - Parameter type: string/number/boolean/object/array
 * @param required - Whether this parameter is required
 * @param defaultValue - Default value if not provided
 */
export interface ParameterDef {
  description: string;
  type: string;
  required: boolean;
  defaultValue?: unknown;
}

/**
 * Tool configuration
 *
 * @param description - Tool description for LLM
 * @param method - HTTP method: GET/POST/PUT/DELETE/PATCH
 * @param path - API path, supports {param} for path parameters
 * @param token - Reference to tokens key, uses global auth if not specified
 * @param authType - Authentication type: bearer/basic/apiKey
 * @param headers - Additional HTTP headers
 * @param timeout - Override global timeout (ms)
 * @param retry - Override global retry config
 * @param cache - Override global cache config
 * @param requestTransform - Request parameter name mapping
 * @param responseTransform - Response transformation config
 * @param idempotencyKey - Idempotency key header name
 * @param body - POST/PUT request body parameters
 * @param queryParams - Query string parameters
 */
export interface ToolConfig {
  description: string;
  method: string;
  path: string;
  token?: string;
  authType?: 'bearer' | 'basic' | 'apiKey';
  headers?: Record<string, string>;
  timeout?: number;
  retry?: RetryConfig;
  cache?: CacheConfig;
  requestTransform?: Record<string, string>;
  responseTransform?: ResponseTransformConfig;
  idempotencyKey?: string;
  body?: Record<string, ParameterDef>;
  queryParams?: Record<string, ParameterDef>;
}

/**
 * Response transformation configuration
 *
 * @param pick - Fields to include in response
 * @param rename - Field name mapping
 */
export interface ResponseTransformConfig {
  pick?: string[];
  rename?: Record<string, string>;
}

/**
 * Proxy configuration
 *
 * @param url - Proxy URL
 * @param auth - Proxy authentication
 */
export interface ProxyConfig {
  url: string;
  auth?: {
    username: string;
    password: string;
  };
}

/**
 * Timeout configuration
 *
 * @param connect - Connection timeout (ms)
 * @param read - Read timeout (ms)
 * @param write - Write timeout (ms)
 */
export interface TimeoutConfig {
  connect: number;
  read: number;
  write: number;
}

/**
 * Retry configuration
 *
 * @param enabled - Whether retry is enabled
 * @param maxAttempts - Maximum retry attempts
 * @param delay - Initial delay (ms)
 * @param backoff - Backoff multiplier
 * @param retryOn - HTTP status codes to retry on
 */
export interface RetryConfig {
  enabled: boolean;
  maxAttempts: number;
  delay: number;
  backoff: number;
  retryOn: number[];
}

/**
 * Circuit breaker configuration
 *
 * @param enabled - Whether circuit breaker is enabled
 * @param failureThreshold - Failures to trip the circuit
 * @param successThreshold - Successes to close the circuit
 * @param halfOpenTime - Time before attempting recovery (ms)
 */
export interface CircuitBreakerConfig {
  enabled: boolean;
  failureThreshold: number;
  successThreshold: number;
  halfOpenTime: number;
}

/**
 * Cache configuration
 *
 * @param enabled - Whether cache is enabled
 * @param ttl - Cache TTL (ms)
 * @param maxSize - Maximum cache entries
 */
export interface CacheConfig {
  enabled: boolean;
  ttl: number;
  maxSize: number;
}

/**
 * Logging configuration
 *
 * @param level - Log level: debug/info/warn/error
 * @param logRequest - Whether to log requests
 * @param logResponse - Whether to log responses
 * @param logHeaders - Whether to log headers
 * @param sensitiveHeaders - Headers to mask in logs
 */
export interface LoggingConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  logRequest: boolean;
  logResponse: boolean;
  logHeaders: boolean;
  sensitiveHeaders: string[];
}

/**
 * Metrics configuration
 *
 * @param enabled - Whether metrics are enabled
 * @param port - Metrics server port
 */
export interface MetricsConfig {
  enabled: boolean;
  port: number;
}

/**
 * Health check configuration
 *
 * @param enabled - Whether health check is enabled
 * @param port - Health check server port
 */
export interface HealthCheckConfig {
  enabled: boolean;
  port: number;
}

/**
 * Server configuration
 *
 * @param transport - Transport mode: stdio/sse
 * @param ssePort - SSE server port
 * @param httpPort - HTTP server port for metrics/health
 * @param ssl - SSL configuration
 */
export interface ServerConfig {
  transport: string;
  ssePort: number;
  httpPort: number;
  ssl?: {
    enabled: boolean;
    cert: string;
    key: string;
  };
}

/**
 * Global auth configuration
 *
 * @param type - Auth type: bearer/basic/apiKey
 * @param defaultToken - Default token key reference
 */
export interface AuthConfig {
  type: 'bearer' | 'basic' | 'apiKey';
  default?: string;
}

/**
 * Root configuration
 *
 * @param baseUrl - API base URL
 * @param auth - Global auth config
 * @param proxy - Proxy config
 * @param timeout - Global timeout config
 * @param retry - Global retry config
 * @param circuitBreaker - Global circuit breaker config
 * @param cache - Global cache config
 * @param logging - Logging config
 * @param metrics - Metrics config
 * @param healthCheck - Health check config
 * @param server - Server config
 * @param tokens - Token key-value pairs
 * @param tools - Tool definitions
 */
export interface Config {
  baseUrl: string;
  auth?: AuthConfig;
  proxy?: ProxyConfig;
  timeout?: TimeoutConfig;
  retry?: RetryConfig;
  circuitBreaker?: CircuitBreakerConfig;
  cache?: CacheConfig;
  logging?: LoggingConfig;
  metrics?: MetricsConfig;
  healthCheck?: HealthCheckConfig;
  server?: ServerConfig;
  tokens?: Record<string, string>;
  tools: Record<string, ToolConfig>;
}

/**
 * Default configuration values
 */
export const DEFAULT_TIMEOUT: TimeoutConfig = {
  connect: 5000,
  read: 30000,
  write: 30000,
};

export const DEFAULT_RETRY: RetryConfig = {
  enabled: false,
  maxAttempts: 3,
  delay: 1000,
  backoff: 2.0,
  retryOn: [429, 500, 502, 503, 504],
};

export const DEFAULT_CIRCUIT_BREAKER: CircuitBreakerConfig = {
  enabled: false,
  failureThreshold: 5,
  successThreshold: 2,
  halfOpenTime: 30000,
};

export const DEFAULT_CACHE: CacheConfig = {
  enabled: false,
  ttl: 60000,
  maxSize: 1000,
};

export const DEFAULT_LOGGING: LoggingConfig = {
  level: 'info',
  logRequest: true,
  logResponse: true,
  logHeaders: false,
  sensitiveHeaders: ['authorization', 'x-api-key'],
};

export const DEFAULT_METRICS: MetricsConfig = {
  enabled: false,
  port: 11112,
};

export const DEFAULT_HEALTH_CHECK: HealthCheckConfig = {
  enabled: false,
  port: 11112,
};

export const DEFAULT_SERVER: ServerConfig = {
  transport: 'stdio',
  ssePort: 11113,
  httpPort: 11112,
};
