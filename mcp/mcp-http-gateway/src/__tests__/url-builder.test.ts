/**
 * Unit tests for URL builder
 *
 * @author lvdaxianerplus
 * @date 2026-04-18
 */

import { describe, it, expect } from 'vitest';
import { buildUrl, extractPathParamNames, separateParams } from '../core/url-builder.js';

describe('URL Builder', () => {
  describe('buildUrl', () => {
    it('should build URL with base URL and path', () => {
      const url = buildUrl('https://api.example.com', '/user', {}, {});
      expect(url).toBe('https://api.example.com/user');
    });

    it('should replace path parameters', () => {
      const url = buildUrl('https://api.example.com', '/user/{userId}', { userId: '123' }, {});
      expect(url).toBe('https://api.example.com/user/123');
    });

    it('should add query parameters', () => {
      const url = buildUrl('https://api.example.com', '/user', {}, { name: 'john', city: 'beijing' });
      expect(url).toBe('https://api.example.com/user?name=john&city=beijing');
    });

    it('should handle path and query parameters together', () => {
      const url = buildUrl('https://api.example.com', '/user/{userId}', { userId: '123' }, { includeDetail: 'true' });
      expect(url).toBe('https://api.example.com/user/123?includeDetail=true');
    });

    it('should encode special characters in path parameters', () => {
      const url = buildUrl('https://api.example.com', '/user/{userId}', { userId: 'john doe' }, {});
      expect(url).toBe('https://api.example.com/user/john%20doe');
    });

    it('should remove trailing slash from base URL', () => {
      const url = buildUrl('https://api.example.com/', '/user', {}, {});
      expect(url).toBe('https://api.example.com/user');
    });
  });

  describe('extractPathParamNames', () => {
    it('should extract path parameter names', () => {
      const params = extractPathParamNames('/user/{userId}/posts/{postId}');
      expect(params).toEqual(['userId', 'postId']);
    });

    it('should return empty array when no path parameters', () => {
      const params = extractPathParamNames('/user');
      expect(params).toEqual([]);
    });
  });

  describe('separateParams', () => {
    it('should separate path and query parameters', () => {
      const args = { userId: '123', name: 'john', includeDetail: 'true' };
      const result = separateParams(args, ['userId'], ['name', 'includeDetail']);

      expect(result.pathParams).toEqual({ userId: '123' });
      expect(result.queryParams).toEqual({ name: 'john', includeDetail: 'true' });
    });

    it('should handle missing parameters', () => {
      const args = { userId: '123' };
      const result = separateParams(args, ['userId'], ['name']);

      expect(result.pathParams).toEqual({ userId: '123' });
      expect(result.queryParams).toEqual({});
    });
  });
});
