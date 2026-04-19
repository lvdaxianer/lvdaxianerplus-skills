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
 * @param path - API path, supports {param} for path parameters, or full URL (http://...)
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
 * @param mock - Mock configuration for testing
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
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
  mock?: MockToolConfig;
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
 * @param file - File logging configuration
 */
export interface LoggingConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  logRequest: boolean;
  logResponse: boolean;
  logHeaders: boolean;
  sensitiveHeaders: string[];
  file?: FileLoggingConfig;
}

/**
 * File logging configuration
 *
 * @param enabled - Whether file logging is enabled
 * @param dir - Log file directory (default: ./logs)
 * @param maxSize - Max file size in MB before rotation (default: 300)
 * @param rotateByMonth - Whether to rotate by month (default: true)
 * @param logRequestBody - Whether to log request body
 * @param logResponseBody - Whether to log response body
 * @param logRequestHeaders - Whether to log request headers
 * @param logResponseHeaders - Whether to log response headers
 *
 * @author lvdaxianerplus
 * @date 2026-04-18
 */
export interface FileLoggingConfig {
  enabled: boolean;
  dir?: string;
  maxSize?: number;
  rotateByMonth?: boolean;
  logRequestBody?: boolean;
  logResponseBody?: boolean;
  logRequestHeaders?: boolean;
  logResponseHeaders?: boolean;
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
 * @param sqlite - SQLite logging config
 * @param compression - Response compression config
 * @param hotReload - Hot reload config
 * @param backup - Backup config
 * @param alert - Alert config
 * @param audit - Audit config
 * @param mock - Mock config
 * @param fallback - Fallback config for service degradation
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
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
  sqlite?: SQLiteLoggingConfig;
  compression?: CompressionConfig;
  hotReload?: HotReloadConfig;
  backup?: BackupConfig;
  alert?: AlertConfig;
  audit?: AuditConfig;
  mock?: MockConfig;
  fallback?: FallbackConfig;
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
  file: {
    enabled: false,
    dir: './logs',
    maxSize: 300,
    rotateByMonth: true,
    logRequestBody: true,
    logResponseBody: true,
    logRequestHeaders: true,
    logResponseHeaders: true,
  },
};

/**
 * Default file logging configuration
 *
 * @author lvdaxianerplus
 * @date 2026-04-18
 */
export const DEFAULT_FILE_LOGGING: FileLoggingConfig = {
  enabled: false,
  dir: './logs',
  maxSize: 300,
  rotateByMonth: true,
  logRequestBody: true,
  logResponseBody: true,
  logRequestHeaders: true,
  logResponseHeaders: true,
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

/**
 * SQLite logging configuration
 *
 * @param enabled - Whether SQLite logging is enabled
 * @param dbPath - Database file path (default: ./data/logs.db)
 * @param maxDays - Maximum days to keep records (default: 30)
 * @param batchSize - Batch write size (default: 100)
 * @param syncInterval - Stats sync interval in ms (default: 60000)
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
export interface SQLiteLoggingConfig {
  enabled: boolean;
  dbPath?: string;
  maxDays?: number;
  batchSize?: number;
  syncInterval?: number;
}

/**
 * Compression configuration
 *
 * @param enabled - Whether response compression is enabled
 * @param threshold - Minimum size in bytes to compress (default: 1024)
 * @param level - Compression level 1-9 (default: 6)
 * @param mimeTypes - MIME types to compress
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
export interface CompressionConfig {
  enabled: boolean;
  threshold?: number;
  level?: number;
  mimeTypes?: string[];
}

/**
 * Hot reload configuration
 *
 * @param enabled - Whether hot reload is enabled (default: true)
 * @param watchFile - Whether to watch file changes (default: true)
 * @param debounceMs - Debounce delay in ms (default: 1000)
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
export interface HotReloadConfig {
  enabled: boolean;
  watchFile?: boolean;
  debounceMs?: number;
}

/**
 * Backup configuration
 *
 * @param enabled - Whether backup is enabled (default: true)
 * @param dir - Backup directory (default: ./backups)
 * @param maxVersions - Maximum versions to keep (default: 10)
 * @param schedule - Cron schedule (default: every hour)
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
export interface BackupConfig {
  enabled: boolean;
  dir?: string;
  maxVersions?: number;
  schedule?: string;
}

/**
 * Dynamic data field constraints
 *
 * @param minLength - Minimum string length
 * @param maxLength - Maximum string length
 * @param fixedLength - Fixed string length
 * @param pattern - Regular expression pattern
 * @param enum - Enumeration values (randomly select one)
 * @param min - Minimum number value
 * @param max - Maximum number value
 * @param integer - Whether number must be integer
 * @param precision - Decimal precision (e.g., 2 for two decimal places)
 * @param minDate - Minimum date (ISO format)
 * @param maxDate - Maximum date (ISO format)
 * @param format - Date output format (e.g., "YYYY-MM-DD")
 * @param minItems - Minimum array items
 * @param maxItems - Maximum array items
 * @param fixedItems - Fixed array items count
 * @param itemType - Array item type configuration
 * @param fields - Object nested fields
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
export interface DynamicFieldConstraints {
  // string constraints
  minLength?: number;
  maxLength?: number;
  fixedLength?: number;
  pattern?: string;
  enum?: string[];

  // number constraints
  min?: number;
  max?: number;
  integer?: boolean;
  precision?: number;

  // date constraints
  minDate?: string;
  maxDate?: string;
  format?: string;

  // array constraints
  minItems?: number;
  maxItems?: number;
  fixedItems?: number;
  itemType?: DynamicFieldConfig;

  // object constraints
  fields?: DynamicFieldConfig[];
}

/**
 * Dynamic data field configuration
 *
 * @param name - Field name
 * @param type - Field type: string/number/boolean/date/array/object
 * @param description - Field description
 * @param aiHint - AI hint for semantic generation (e.g., "用户名" → Chinese name)
 * @param required - Whether field is required
 * @param constraints - Field constraints based on type
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
export interface DynamicFieldConfig {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object';
  description?: string;
  aiHint?: string;
  required?: boolean;
  constraints?: DynamicFieldConstraints;
}

/**
 * Mock dynamic data configuration
 *
 * @param enabled - Whether dynamic data generation is enabled
 * @param fields - Field configurations for dynamic generation
 * @param seed - Random seed for reproducible generation
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
export interface MockDynamicConfig {
  enabled: boolean;
  fields: DynamicFieldConfig[];
  seed?: number;
}

/**
 * Mock tool configuration
 *
 * @param enabled - Whether mock is enabled for this tool
 * @param response - Static response data
 * @param responseTemplate - Dynamic response template (supports {param}, {timestamp}, {uuid})
 * @param dynamicConfig - Dynamic data generation configuration
 * @param delay - Simulated delay in ms
 * @param statusCode - Simulated HTTP status code
 * @param headers - Simulated response headers
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
export interface MockToolConfig {
  enabled: boolean;
  response?: unknown;
  responseTemplate?: string;
  dynamicConfig?: MockDynamicConfig;
  delay?: number;
  statusCode?: number;
  headers?: Record<string, string>;
}

/**
 * Global mock configuration
 *
 * @param enabled - Whether global mock is enabled
 * @param mockData - Mock data for each tool
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
export interface MockConfig {
  enabled: boolean;
  mockData?: Record<string, MockToolConfig>;
}

/**
 * Alert configuration
 *
 * @param enabled - Whether alert logging is enabled
 * @param logDir - Alert log directory (default: ./logs)
 * @param errorRateThreshold - Error rate threshold percentage (default: 10)
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
export interface AlertConfig {
  enabled: boolean;
  logDir?: string;
  errorRateThreshold?: number;
}

/**
 * Audit configuration
 *
 * @param enabled - Whether audit logging is enabled
 * @param maskSensitiveFields - Whether to mask sensitive fields (default: true)
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
export interface AuditConfig {
  enabled: boolean;
  maskSensitiveFields?: boolean;
}

/**
 * Fallback configuration for service degradation
 *
 * When service call fails, fallback chain is triggered:
 * Real service → Cache (fallback, ignore TTL) → Mock → Error
 *
 * @param enabled - Whether fallback mechanism is enabled
 * @param useExpiredCache - Whether to use expired cache for fallback (default: true)
 * @param useMockAsFallback - Whether to use Mock as fallback option (default: true)
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
export interface FallbackConfig {
  enabled: boolean;
  useExpiredCache: boolean;
  useMockAsFallback: boolean;
}

/**
 * Execution result source identifier
 *
 * Indicates where the response data came from:
 * - 'real': Real service call
 * - 'fallback_cache': Fallback to cached data (service failed)
 * - 'fallback_mock': Fallback to mock data (service + cache failed)
 * - 'error': All fallbacks exhausted, error returned
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
export type ResultSource = 'real' | 'fallback_cache' | 'fallback_mock' | 'error';

/**
 * Default fallback configuration
 *
 * Cache GET data is for quick fallback usage, NOT for query acceleration.
 * Expired cache data still has value in fallback scenarios.
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
export const DEFAULT_FALLBACK: FallbackConfig = {
  enabled: true,
  useExpiredCache: true,
  useMockAsFallback: true,
};

/**
 * Default SQLite logging configuration
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
export const DEFAULT_SQLITE_LOGGING: SQLiteLoggingConfig = {
  enabled: true,
  dbPath: './data/logs.db',
  maxDays: 30,
  batchSize: 100,
  syncInterval: 60000,
};

/**
 * Default compression configuration
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
export const DEFAULT_COMPRESSION: CompressionConfig = {
  enabled: false,
  threshold: 1024,
  level: 6,
  mimeTypes: ['application/json', 'text/plain', 'text/html'],
};

/**
 * Default hot reload configuration
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
export const DEFAULT_HOT_RELOAD: HotReloadConfig = {
  enabled: true,
  watchFile: true,
  debounceMs: 1000,
};

/**
 * Default backup configuration
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
export const DEFAULT_BACKUP: BackupConfig = {
  enabled: true,
  dir: './backups',
  maxVersions: 10,
  schedule: '0 * * * *', // Every hour
};

/**
 * Default alert configuration
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
export const DEFAULT_ALERT: AlertConfig = {
  enabled: true,
  logDir: './logs',
  errorRateThreshold: 10,
};

/**
 * Default audit configuration
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
export const DEFAULT_AUDIT: AuditConfig = {
  enabled: true,
  maskSensitiveFields: true,
};
