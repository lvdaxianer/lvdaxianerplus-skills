/**
 * Unit tests for config validator
 *
 * @author lvdaxianerplus
 * @date 2026-04-18
 */

import { describe, it, expect } from 'vitest';
import { validateConfig } from '../config/validator.js';

describe('Config Validator', () => {
  it('should validate a correct config', () => {
    const config = {
      baseUrl: 'https://api.example.com',
      tools: {
        getUser: {
          description: 'Get user',
          method: 'GET',
          path: '/user/{userId}',
        },
      },
    };

    const result = validateConfig(config);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject config without baseUrl', () => {
    const config = {
      tools: {
        getUser: {
          description: 'Get user',
          method: 'GET',
          path: '/user',
        },
      },
    };

    const result = validateConfig(config);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.message.includes('baseUrl'))).toBe(true);
  });

  it('should reject config without tools', () => {
    const config = {
      baseUrl: 'https://api.example.com',
    };

    const result = validateConfig(config);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.message.includes('tools'))).toBe(true);
  });

  it('should reject tool without description', () => {
    const config = {
      baseUrl: 'https://api.example.com',
      tools: {
        getUser: {
          method: 'GET',
          path: '/user',
        },
      },
    };

    const result = validateConfig(config);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.message.includes('missing description'))).toBe(true);
  });

  it('should reject tool with invalid method', () => {
    const config = {
      baseUrl: 'https://api.example.com',
      tools: {
        getUser: {
          description: 'Get user',
          method: 'INVALID',
          path: '/user',
        },
      },
    };

    const result = validateConfig(config);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.message.includes('invalid method'))).toBe(true);
  });

  it('should validate token references', () => {
    const config = {
      baseUrl: 'https://api.example.com',
      tokens: {
        A: 'token-aaa',
      },
      tools: {
        getUser: {
          description: 'Get user',
          method: 'GET',
          path: '/user',
          token: 'A',
        },
      },
    };

    const result = validateConfig(config);
    expect(result.valid).toBe(true);
  });

  it('should reject invalid token reference', () => {
    const config = {
      baseUrl: 'https://api.example.com',
      tokens: {
        A: 'token-aaa',
      },
      tools: {
        getUser: {
          description: 'Get user',
          method: 'GET',
          path: '/user',
          token: 'B',
        },
      },
    };

    const result = validateConfig(config);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.message.includes('token B not found'))).toBe(true);
  });
});
