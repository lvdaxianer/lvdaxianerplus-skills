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
 * Clear cache
 */
export function clearCache(): void {
  cache?.clear();
}
