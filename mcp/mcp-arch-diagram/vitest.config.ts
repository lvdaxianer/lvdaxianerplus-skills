/**
 * Vitest 测试配置
 *
 * @author lvdaxianerplus
 * @date 2026-04-20
 */

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // 测试环境配置
    environment: 'node',

    // 全局测试配置
    globals: true,

    // 测试覆盖率配置
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',

      // 覆盖率阈值：严格按照 Spec 要求 80%+
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },

    // 测试文件匹配模式
    include: ['tests/**/*.test.ts'],

    // 排除模式
    exclude: ['node_modules', 'dist'],

    // 测试超时时间（毫秒）
    testTimeout: 30000,

    // 钩子超时时间
    hookTimeout: 10000,
  },
});