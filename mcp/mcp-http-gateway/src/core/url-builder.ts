/**
 * URL builder for constructing API requests
 *
 * @author lvdaxianerplus
 * @date 2026-04-18
 */

export interface UrlBuildResult {
  url: string;
  pathParams: Record<string, string>;
  queryParams: Record<string, string>;
}

/**
 * Build complete URL from path and parameters
 *
 * @param baseUrl - API base URL
 * @param path - API path (e.g., /user/{userId})
 * @param pathParams - Path parameter values (e.g., { userId: "123" })
 * @param queryParams - Query parameter values
 * @returns Complete URL
 */
export function buildUrl(
  baseUrl: string,
  path: string,
  pathParams: Record<string, string> = {},
  queryParams: Record<string, string> = {}
): string {
  let url = baseUrl.replace(/\/$/, '') + path;

  // Replace path parameters {param}
  for (const [key, value] of Object.entries(pathParams)) {
    url = url.replace(new RegExp(`\\{${key}\\}`, 'g'), encodeURIComponent(value));
  }

  // Add query parameters
  const queryString = buildQueryString(queryParams);
  if (queryString) {
    url += '?' + queryString;
  }

  return url;
}

/**
 * Build query string from parameters
 *
 * @param params - Query parameters
 * @returns Query string (without ?)
 */
function buildQueryString(params: Record<string, string>): string {
  const parts: string[] = [];

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      parts.push(
        `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
      );
    }
  }

  return parts.join('&');
}

/**
 * Extract path parameter names from a path
 *
 * @param path - API path (e.g., /user/{userId})
 * @returns Array of parameter names
 */
export function extractPathParamNames(path: string): string[] {
  const matches = path.match(/\{(\w+)\}/g);
  if (!matches) return [];
  return matches.map((m) => m.replace(/[{}]/g, ''));
}

/**
 * Separate arguments into path params and query params based on tool config
 *
 * @param args - Input arguments
 * @param pathParamNames - Expected path parameter names
 * @param queryParamNames - Expected query parameter names
 * @returns Separated parameters
 */
export function separateParams(
  args: Record<string, unknown>,
  pathParamNames: string[],
  queryParamNames: string[]
): { pathParams: Record<string, string>; queryParams: Record<string, string> } {
  const pathParams: Record<string, string> = {};
  const queryParams: Record<string, string> = {};

  for (const key of pathParamNames) {
    if (args[key] !== undefined) {
      pathParams[key] = String(args[key]);
    }
  }

  for (const key of queryParamNames) {
    if (args[key] !== undefined) {
      queryParams[key] = String(args[key]);
    }
  }

  return { pathParams, queryParams };
}
