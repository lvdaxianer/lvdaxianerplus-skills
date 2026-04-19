/**
 * HTTP 响应辅助模块
 *
 * Features:
 * - 统一的 JSON 响应格式
 * - CORS 头设置
 * - 错误响应处理
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */

import type { ServerResponse } from 'http';

/**
 * 设置 CORS 响应头
 *
 * @param res - HTTP 响应对象
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
export function setCorsHeaders(res: ServerResponse): void {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

/**
 * 发送 JSON 响应
 *
 * @param res - HTTP 响应对象
 * @param statusCode - HTTP 状态码
 * @param data - 响应数据
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
export function sendJsonResponse(
  res: ServerResponse,
  statusCode: number,
  data: unknown
): void {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

/**
 * 发送 HTML 响应
 *
 * @param res - HTTP 响应对象
 * @param statusCode - HTTP 状态码
 * @param html - HTML 内容
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
export function sendHtmlResponse(
  res: ServerResponse,
  statusCode: number,
  html: string
): void {
  res.writeHead(statusCode, { 'Content-Type': 'text/html' });
  res.end(html);
}

/**
 * 发送成功响应
 *
 * @param res - HTTP 响应对象
 * @param data - 响应数据
 * @param message - 成功消息
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
export function sendSuccessResponse(
  res: ServerResponse,
  data: unknown,
  message: string = 'Success'
): void {
  sendJsonResponse(res, 200, { success: true, message, data });
}

/**
 * 发送错误响应
 *
 * @param res - HTTP 响应对象
 * @param statusCode - HTTP 状态码
 * @param error - 错误消息
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
export function sendErrorResponse(
  res: ServerResponse,
  statusCode: number,
  error: string
): void {
  sendJsonResponse(res, statusCode, { success: false, error });
}

/**
 * 发送 404 Not Found 响应
 *
 * @param res - HTTP 响应对象
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
export function sendNotFoundResponse(res: ServerResponse): void {
  sendErrorResponse(res, 404, 'Not found');
}

/**
 * 发送 400 Bad Request 响应
 *
 * @param res - HTTP 响应对象
 * @param error - 错误消息
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
export function sendBadRequestResponse(res: ServerResponse, error: string): void {
  sendErrorResponse(res, 400, error);
}

/**
 * 发送 405 Method Not Allowed 响应
 *
 * @param res - HTTP 响应对象
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
export function sendMethodNotAllowedResponse(res: ServerResponse): void {
  sendErrorResponse(res, 405, 'Method not allowed');
}

/**
 * 发送 500 Internal Server Error 响应
 *
 * @param res - HTTP 响应对象
 * @param error - 错误消息
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
export function sendInternalServerErrorResponse(res: ServerResponse, error: string): void {
  sendErrorResponse(res, 500, error);
}

/**
 * 解析请求体（JSON）
 *
 * @param req - HTTP 请求对象
 * @returns Promise 解析后的 JSON 数据
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
export async function parseJsonBody(req: import('http').IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      // 条件注释：请求体为空时返回 null，非空时解析 JSON
      if (body.length === 0) {
        resolve(null);
      } else {
        try {
          resolve(JSON.parse(body));
        } catch (error) {
          reject(new Error('Invalid JSON'));
        }
      }
    });
    req.on('error', reject);
  });
}

/**
 * 从 URL 中获取查询参数
 *
 * @param url - URL 对象
 * @param key - 参数名
 * @param defaultValue - 默认值
 * @returns 参数值
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
export function getQueryParam(
  url: URL,
  key: string,
  defaultValue: string | undefined = undefined
): string | undefined {
  const value = url.searchParams.get(key);
  // 条件注释：参数存在时返回值，不存在时返回默认值
  if (value) {
    return value;
  } else {
    return defaultValue;
  }
}

/**
 * 从 URL 中获取数字查询参数
 *
 * @param url - URL 对象
 * @param key - 参数名
 * @param defaultValue - 默认值
 * @returns 数字参数值
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
export function getQueryParamAsNumber(
  url: URL,
  key: string,
  defaultValue: number
): number {
  const value = url.searchParams.get(key);
  // 条件注释：参数存在且是有效数字时返回解析值，否则返回默认值
  if (value) {
    const parsed = parseInt(value, 10);
    // 条件注释：解析成功时返回解析值，失败时返回默认值
    if (!isNaN(parsed)) {
      return parsed;
    } else {
      return defaultValue;
    }
  } else {
    return defaultValue;
  }
}