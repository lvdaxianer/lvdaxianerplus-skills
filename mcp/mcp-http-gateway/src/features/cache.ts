/**
 * Cache manager using LRU strategy
 *
 * @author lvdaxianerplus
 * @date 2026-04-18
 */

import { LRUCache } from 'lru-cache';
import type { CacheConfig } from '../config/types.js';

interface CacheEntry {
  data: unknown;
  timestamp: number;
}

let cache: LRUCache<string, CacheEntry> | null = null;
let cacheConfig: CacheConfig | null = null;

/**
 * Initialize cache
 *
 * @param config - Cache configuration
 */
export function initCache(config: CacheConfig): void {
  cacheConfig = config;
  cache = new LRUCache<string, CacheEntry>({
    max: config.maxSize,
    ttl: config.ttl,
  });
}

/**
 * Generate cache key from tool name and arguments
 *
 * @param toolName - Tool name
 * @param args - Tool arguments
 * @returns Cache key
 */
/**
 * Generate cache key from tool name and arguments
 * Uses sorted JSON stringification to ensure consistent key generation
 * regardless of argument order (important for query params)
 *
 * @param toolName - Tool name (e.g., "getUser")
 * @param args - Tool arguments (e.g., { userId: "123", includeDetail: true })
 * @returns Cache key in format "toolName:{sorted JSON}"
 *
 * @example
 * // These will produce the same cache key:
 * generateCacheKey("getUser", { userId: "1", name: "John" })
 * generateCacheKey("getUser", { name: "John", userId: "1" })
 * // Both return: "getUser:{"name":"John","userId":"1"}"
 */
function generateCacheKey(toolName: string, args: Record<string, unknown>): string {
  // Sort keys alphabetically to ensure consistent ordering
  // This is critical because { a: 1, b: 2 } and { b: 2, a: 1 } should be the same cache key
  const sortedArgs = JSON.stringify(args, Object.keys(args).sort());
  return `${toolName}:${sortedArgs}`;
}

/**
 * Get cached response
 *
 * @param toolName - Tool name
 * @param args - Tool arguments
 * @param config - Cache config (used if cache not initialized)
 * @returns Cached data or undefined
 */
/**
 * Retrieve cached response if available and not expired
 *
 * @param toolName - Tool name for cache key generation
 * @param args - Tool arguments for cache key generation
 * @param config - Optional cache config to initialize cache if not yet initialized
 * @returns Cached response data or undefined if not found/expired
 *
 * @example
 * const cached = getCachedResponse("getUser", { userId: "123" });
 * if (cached) {
 *   // Use cached response
 * }
 */
export function getCachedResponse(
  toolName: string,
  args: Record<string, unknown>,
  config?: CacheConfig
): unknown | undefined {
  // Lazy initialization: create cache if not exists and config provided
  // This allows cache to be initialized on first use rather than at startup
  if (!cache && config) {
    initCache(config);
  }

  // Return undefined if cache is disabled or not initialized
  // This ensures graceful degradation when cache is not configured
  if (!cache || !cacheConfig?.enabled) {
    return undefined;
  }

  // Generate deterministic cache key from tool name and arguments
  const key = generateCacheKey(toolName, args);
  const entry = cache.get(key);

  // Cache miss: no entry found for this key
  if (!entry) {
    return undefined;
  }

  // TTL (Time-To-Live) check: verify entry hasn't expired
  // Calculate elapsed time since cache entry was stored
  // If elapsed time exceeds configured TTL, entry is considered stale
  const elapsed = Date.now() - entry.timestamp;
  if (elapsed > cacheConfig.ttl) {
    // Entry expired: delete from cache and return undefined
    // This prevents returning stale data to callers
    cache.delete(key);
    return undefined;
  }

  // Cache hit: return the stored data
  return entry.data;
}

/**
 * Cache a response
 *
 * @param toolName - Tool name
 * @param args - Tool arguments
 * @param data - Response data
 * @param config - Cache config (used if cache not initialized)
 */
/**
 * Store response data in cache with current timestamp
 *
 * @param toolName - Tool name for cache key generation
 * @param args - Tool arguments for cache key generation
 * @param data - Response data to cache (can be any JSON-serializable value)
 * @param config - Optional cache config to initialize cache if not yet initialized
 *
 * @example
 * // Cache a successful API response
 * cacheResponse("getUser", { userId: "123" }, { id: "123", name: "John" });
 *
 * @note
 * Only GET requests should be cached since they are idempotent.
 * POST/PUT/DELETE requests should not be cached as they modify server state.
 */
export function cacheResponse(
  toolName: string,
  args: Record<string, unknown>,
  data: unknown,
  config?: CacheConfig
): void {
  // Lazy initialization: create cache if not exists and config provided
  if (!cache && config) {
    initCache(config);
  }

  // Early return if cache is disabled or not initialized
  // This prevents storing data when caching is not configured
  if (!cache || !cacheConfig?.enabled) {
    return;
  }

  // Generate deterministic cache key from tool name and arguments
  const key = generateCacheKey(toolName, args);

  // Store response data with current timestamp for TTL tracking
  // LRU cache handles eviction when maxSize is reached
  // Entry will be automatically evicted when it expires (TTL)
  cache.set(key, {
    data,
    timestamp: Date.now(),
  });
}

/**
 * Get cache statistics
 *
 * @returns Cache statistics
 */
export function getCacheStats(): { size: number; maxSize: number; ttl: number } {
  return {
    size: cache?.size ?? 0,
    maxSize: cacheConfig?.maxSize ?? 0,
    ttl: cacheConfig?.ttl ?? 0,
  };
}

/**
 * Get all cache entries with data content
 *
 * @returns Array of cache entries with key, data, and timestamp
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
export function getAllCacheEntries(): Array<{
  key: string;
  toolName: string;
  args: string;
  data: unknown;
  timestamp: number;
  age: number;
}> {
  // 条件：缓存未初始化
  if (!cache) {
    return [];
  }

  const entries: Array<{
    key: string;
    toolName: string;
    args: string;
    data: unknown;
    timestamp: number;
    age: number;
  }> = [];

  // 遍历所有缓存条目
  for (const [key, entry] of cache.entries()) {
    // 解析缓存键：格式为 "toolName:{args json}"
    const colonIndex = key.indexOf(':');
    // 条件：键格式正确
    if (colonIndex > 0) {
      const toolName = key.substring(0, colonIndex);
      const args = key.substring(colonIndex + 1);

      entries.push({
        key,
        toolName,
        args,
        data: entry.data,
        timestamp: entry.timestamp,
        age: Date.now() - entry.timestamp,
      });
    } else {
      // 条件：键格式不正确，仍保留原始数据
      entries.push({
        key,
        toolName: key,
        args: '',
        data: entry.data,
        timestamp: entry.timestamp,
        age: Date.now() - entry.timestamp,
      });
    }
  }

  // 按时间戳降序排序（最新的在前）
  entries.sort((a, b) => b.timestamp - a.timestamp);

  return entries;
}

/**
 * Clear cache
 *
 * @author lvdaxianerplus
 * @date 2026-04-18
 */
export function clearCache(): void {
  cache?.clear();
}

/**
 * Clear cache entries for a specific tool
 *
 * @param toolName - Tool name to clear cache for
 * @returns Number of entries cleared
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
export function clearCacheByTool(toolName: string): number {
  // Cache not initialized
  if (!cache) {
    return 0;
  }

  let cleared = 0;

  // Iterate all keys and delete those starting with toolName:
  for (const key of cache.keys()) {
    if (key.startsWith(`${toolName}:`)) {
      cache.delete(key);
      cleared++;
    }
  }

  return cleared;
}

/**
 * Get cache keys for a specific tool
 *
 * @param toolName - Tool name
 * @returns Cache keys for the tool
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
export function getCacheKeysByTool(toolName: string): string[] {
  if (!cache) {
    return [];
  }

  const keys: string[] = [];
  for (const key of cache.keys()) {
    if (key.startsWith(`${toolName}:`)) {
      keys.push(key);
    }
  }

  return keys;
}

/**
 * Get cached response for fallback (ignores TTL expiration)
 *
 * In fallback scenarios, expired cache data still has value.
 * This function returns cached data even if TTL has expired,
 * because fallback needs any available data, not fresh data.
 *
 * Key insight: Cache GET data is for quick fallback usage, NOT for query acceleration.
 *
 * @param toolName - Tool name for cache key generation
 * @param args - Tool arguments for cache key generation
 * @param config - Optional cache config to initialize cache if not yet initialized
 * @returns Cached response data or undefined if not found (ignores TTL)
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
export function getCachedResponseForFallback(
  toolName: string,
  args: Record<string, unknown>,
  config?: CacheConfig
): unknown | undefined {
  // Lazy initialization: create cache if not exists and config provided
  if (!cache && config) {
    initCache(config);
  }

  // Return undefined if cache is disabled or not initialized
  // This ensures graceful degradation when cache is not configured
  if (!cache) {
    return undefined;
  }

  // Generate deterministic cache key from tool name and arguments
  const key = generateCacheKey(toolName, args);
  const entry = cache.get(key);

  // Cache miss: no entry found for this key
  // Note: We don't check TTL here because fallback needs ANY available data
  if (!entry) {
    return undefined;
  }

  // Cache hit: return the stored data (ignoring TTL expiration)
  // Expired data is still valuable in fallback scenarios
  return entry.data;
}

/**
 * Get cache entry timestamp (for logging purposes)
 *
 * @param toolName - Tool name for cache key generation
 * @param args - Tool arguments for cache key generation
 * @returns Cache timestamp or undefined if not found
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
export function getCacheTimestamp(
  toolName: string,
  args: Record<string, unknown>
): number | undefined {
  if (!cache) {
    return undefined;
  }

  const key = generateCacheKey(toolName, args);
  const entry = cache.get(key);

  if (!entry) {
    return undefined;
  }

  return entry.timestamp;
}
