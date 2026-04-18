/**
 * Authentication handler
 *
 * @author lvdaxianerplus
 * @date 2026-04-18
 */

import type { ToolConfig, Config } from '../config/types.js';

/**
 * Resolve authentication headers for a tool
 *
 * @param tool - Tool configuration
 * @param config - Global configuration
 * @returns Headers object with auth
 */
export function resolveAuth(tool: ToolConfig, config: Config): Record<string, string> {
  // Initialize empty headers object to accumulate auth headers
  const headers: Record<string, string> = {};

  // Step 1: Determine which token to use for authentication
  // Priority: tool-specific token > global default token > first available token
  let token: string | undefined;

  // Priority 1: Tool-specific token via tool.token field
  if (tool.token && config.tokens) {
    // Tool references a named token in the tokens map
    token = config.tokens[tool.token];
  } else if (config.auth?.default && config.tokens) {
    // Priority 2: Global default token from auth.default
    token = config.tokens[config.auth.default];
  } else if (config.tokens) {
    // Priority 3: Fall back to first token in the map
    // This provides backward compatibility when no specific token is configured
    const firstKey = Object.keys(config.tokens)[0];
    if (firstKey) {
      token = config.tokens[firstKey];
    }
  }

  // Step 2: Determine authentication type to use
  // Priority: tool-specific authType > global auth.type > bearer (default)
  // Bearer is the most common authentication method for REST APIs
  const authType = tool.authType ?? config.auth?.type ?? 'bearer';

  // Step 3: Set the appropriate authentication header based on token and auth type
  // Bearer: Adds Authorization: Bearer <token> header (JWT, OAuth tokens)
  // Basic: Adds Authorization: Basic <base64> header (username:password)
  // API Key: Adds X-API-Key: <token> header (custom API key header)
  if (token) {
    if (authType === 'bearer') {
      // Bearer token authentication for OAuth/JWT
      headers['Authorization'] = `Bearer ${token}`;
    } else if (authType === 'basic') {
      // Basic authentication with base64 encoded credentials
      // Token is expected to be in username:password format
      headers['Authorization'] = `Basic ${Buffer.from(token).toString('base64')}`;
    } else if (authType === 'apiKey') {
      // API key authentication using custom header
      headers['X-API-Key'] = token;
    } else {
      // Unknown authentication type specified - skip adding auth header
      // This prevents sending malformed authentication
    }
  }

  // Return accumulated headers object
  // Empty object returned if no token was found or auth type is unknown
  return headers;
}
