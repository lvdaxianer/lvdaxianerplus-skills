/**
 * Unit tests for transform functions
 *
 * @author lvdaxianerplus
 * @date 2026-04-18
 */

import { describe, it, expect } from 'vitest';
import { transformRequest, transformResponse } from '../features/transform.js';

describe('Transform', () => {
  describe('transformRequest', () => {
    it('should transform parameter names', () => {
      const args = { user_name: 'john', create_at: '2024-01-01' };
      const transform = { user_name: 'userName', create_at: 'createdAt' };
      const result = transformRequest(args, transform);

      expect(result).toEqual({
        userName: 'john',
        createdAt: '2024-01-01',
      });
    });

    it('should keep original keys when no transform defined', () => {
      const args = { name: 'john' };
      const transform = {};
      const result = transformRequest(args, transform);

      expect(result).toEqual({ name: 'john' });
    });
  });

  describe('transformResponse', () => {
    it('should pick specified fields', () => {
      const data = { id: 1, name: 'john', age: 30, remark: 'test' };
      const config = { pick: ['id', 'name', 'age'] };
      const result = transformResponse(data, config);

      expect(result).toEqual({ id: 1, name: 'john', age: 30 });
    });

    it('should rename fields', () => {
      const data = { id: 1, user_name: 'john' };
      const config = { rename: { user_name: 'userName' } };
      const result = transformResponse(data, config);

      expect(result).toEqual({ id: 1, userName: 'john' });
    });

    it('should apply both pick and rename', () => {
      const data = { id: 1, user_name: 'john', age: 30, remark: 'test' };
      const config = {
        pick: ['id', 'user_name', 'age'],
        rename: { user_name: 'userName' },
      };
      const result = transformResponse(data, config);

      expect(result).toEqual({ id: 1, userName: 'john', age: 30 });
    });

    it('should return original data when no transform', () => {
      const data = { id: 1, name: 'john' };
      const result = transformResponse(data, {});

      expect(result).toEqual({ id: 1, name: 'john' });
    });

    it('should return non-object data unchanged', () => {
      const data = 'string response';
      const result = transformResponse(data, { pick: ['id'] });

      expect(result).toBe('string response');
    });
  });
});
