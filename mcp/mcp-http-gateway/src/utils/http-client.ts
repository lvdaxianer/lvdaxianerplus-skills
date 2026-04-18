/**
 * HTTP client wrapper
 *
 * @author lvdaxianerplus
 * @date 2026-04-18
 */

import { HttpsProxyAgent } from 'https-proxy-agent';
import type { ProxyConfig } from '../config/types.js';

export interface HttpRequest {
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: string;
  timeout?: number;
}

export interface HttpResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body?: string;
}

export interface HttpClientOptions {
  timeout?: number;
  proxy?: ProxyConfig;
}

/**
 * HTTP client for making requests
 */
export class HttpClient {
  private timeout: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private proxyAgent?: any;

  constructor(options: HttpClientOptions = {}) {
    this.timeout = options.timeout ?? 30000;

    if (options.proxy?.url) {
      this.proxyAgent = new HttpsProxyAgent(options.proxy.url);
    }
  }

  /**
   * Make an HTTP request
   *
   * @param request - Request configuration
   * @returns HTTP response
   */
  async request(request: HttpRequest): Promise<HttpResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fetchOptions: RequestInit & { agent?: any } = {
        method: request.method,
        headers: request.headers,
        signal: controller.signal,
      };

      if (this.proxyAgent) {
        fetchOptions.agent = this.proxyAgent;
      }

      if (request.body && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
        fetchOptions.body = request.body;
      }

      const response = await fetch(request.url, fetchOptions);

      clearTimeout(timeoutId);

      const headers: Record<string, string> = {};
      response.headers.forEach((value: string, key: string) => {
        headers[key] = value;
      });

      const body = await response.text();

      return {
        status: response.status,
        statusText: response.statusText,
        headers,
        body,
      };
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Request timeout after ${this.timeout}ms`);
      }

      throw error;
    }
  }
}

/**
 * Create HTTP client instance
 *
 * @param options - Client options
 * @returns HTTP client
 */
export function createHttpClient(options: HttpClientOptions = {}): HttpClient {
  return new HttpClient(options);
}
