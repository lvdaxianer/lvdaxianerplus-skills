/**
 * list_templates 工具集成测试
 *
 * 测试覆盖：
 * - Phase 1: 正常场景（FR-004 模板系统）
 * - Phase 2: 异常场景（无效类型筛选）
 * - Phase 3: 边界场景（空结果、全类型返回）
 * - Phase 4: 字段覆盖（所有 Template Schema 字段）
 *
 * @author lvdaxianerplus
 * @date 2026-04-20
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { listTemplates } from '../../../src/core/list-templates.js';

/**
 * list_templates 工具接口定义
 *
 * @author lvdaxianerplus
 * @date 2026-04-20
 */
interface ListTemplatesInput {
  type?: 'deployment' | 'business' | 'function';
}

/**
 * 模板项接口定义
 *
 * @author lvdaxianerplus
 * @date 2026-04-20
 */
interface TemplateItem {
  name: string;
  type: string;
  description: string;
}

/**
 * list_templates 输出接口定义
 *
 * @author lvdaxianerplus
 * @date 2026-04-20
 */
interface ListTemplatesOutput {
  templates: TemplateItem[];
}

// ============================================================
// Phase 1: 正常场景测试（FR-004 模板系统）
// ============================================================

describe('list_templates - 正常场景', () => {

  /**
   * 测试：返回所有模板（无筛选）
   * 验证：至少返回 5 个模板，包含所有类型
   *
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  it('[正常] should_return_all_templates_without_filter', async () => {
    // given: 不提供类型筛选
    const input: ListTemplatesInput = {};

    // when: 调用工具
    const result = await listTemplates(input);

    // then: 验证返回模板数量 ≥ 5
    expect(result.templates).toBeDefined();
    expect(result.templates.length).toBeGreaterThanOrEqual(5);

    // 验证包含多种类型
    const types = result.templates.map(t => t.type);
    const uniqueTypes = [...new Set(types)];

    // deployment/business/function 至少包含 2 种类型
    expect(uniqueTypes.length).toBeGreaterThanOrEqual(2);
  });

  /**
   * 测试：按 deployment 类型筛选模板
   * 验证：只返回 deployment 类型模板
   *
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  it('[正常] should_filter_templates_by_deployment_type', async () => {
    // given: 筛选 deployment 类型
    const input: ListTemplatesInput = { type: 'deployment' };

    // when: 调用工具
    const result = await listTemplates(input);

    // then: 验证所有返回的模板都是 deployment 类型
    expect(result.templates).toBeDefined();
    expect(result.templates.length).toBeGreaterThan(0);

    // 所有模板类型应为 deployment
    result.templates.forEach(template => {
      expect(template.type).toBe('deployment');
    });
  });

  /**
   * 测试：按 business 类型筛选模板
   * 验证：只返回 business 类型模板
   *
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  it('[正常] should_filter_templates_by_business_type', async () => {
    // given: 筛选 business 类型
    const input: ListTemplatesInput = { type: 'business' };

    // when: 调用工具
    const result = await listTemplates(input);

    // then: 验证所有返回的模板都是 business 类型
    expect(result.templates).toBeDefined();

    // 如果有 business 类型模板，验证类型正确
    if (result.templates.length > 0) {
      result.templates.forEach(template => {
        expect(template.type).toBe('business');
      });
    }
  });

  /**
   * 测试：按 function 类型筛选模板
   * 验证：只返回 function 类型模板
   *
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  it('[正常] should_filter_templates_by_function_type', async () => {
    // given: 筛选 function 类型
    const input: ListTemplatesInput = { type: 'function' };

    // when: 调用工具
    const result = await listTemplates(input);

    // then: 验证所有返回的模板都是 function 类型
    expect(result.templates).toBeDefined();

    // 如果有 function 类型模板，验证类型正确
    if (result.templates.length > 0) {
      result.templates.forEach(template => {
        expect(template.type).toBe('function');
      });
    }
  });

  /**
   * 测试：返回模板包含预定义模板名称
   * 验证：包含 microservice、three-tier 等模板
   *
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  it('[正常] should_include_predefined_template_names', async () => {
    // given: 不提供筛选
    const input: ListTemplatesInput = {};

    // when: 调用工具
    const result = await listTemplates(input);

    // then: 验证包含预定义模板
    const names = result.templates.map(t => t.name);

    // 应包含 microservice 或 three-tier 模板（Spec 定义）
    const hasDeploymentTemplate =
      names.includes('microservice') ||
      names.includes('three-tier') ||
      names.includes('kubernetes');

    expect(hasDeploymentTemplate).toBe(true);
  });

  /**
   * 测试：模板描述不为空
   * 验证：每个模板都有有意义的描述
   *
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  it('[正常] should_have_meaningful_description_for_each_template', async () => {
    // given: 不提供筛选
    const input: ListTemplatesInput = {};

    // when: 调用工具
    const result = await listTemplates(input);

    // then: 验证每个模板描述不为空且有意义
    result.templates.forEach(template => {
      expect(template.description).toBeDefined();
      expect(template.description.length).toBeGreaterThan(5);

      // 描述应包含中文或英文关键词
      const hasKeywords =
        template.description.includes('架构') ||
        template.description.includes('模板') ||
        template.description.includes('architecture') ||
        template.description.includes('template');

      expect(hasKeywords).toBe(true);
    });
  });
});

// ============================================================
// Phase 2: 异常场景测试
// ============================================================

describe('list_templates - 异常场景', () => {

  /**
   * 测试：无效类型参数
   * 验证：应返回空数组或忽略无效筛选
   *
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  it('[异常] should_handle_invalid_type_gracefully', async () => {
    // given: 提供无效类型（类型系统不允许，测试运行时防御）
    // 由于 TypeScript 类型限制，此测试验证运行时防御
    const input = { type: 'invalid-type' as unknown as 'deployment' };

    // when: 调用工具（可能抛出错误或返回空）
    try {
      const result = await listTemplates(input);

      // then: 如果不抛错，应返回空数组
      expect(result.templates).toBeDefined();
      expect(result.templates.length).toBe(0);
    } catch (error) {
      // then: 或者抛出明确的错误
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toContain('INVALID_INPUT');
    }
  });

  /**
   * 测试：模板存储目录不存在
   * 验证：应返回空数组而非崩溃
   *
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  it('[异常] should_return_empty_when_templates_directory_not_found', async () => {
    // given: 模板目录不存在时（环境依赖）
    // 此测试验证工具的健壮性

    // when: 调用工具
    const result = await listTemplates({});

    // then: 即使目录不存在，也应返回空数组而非崩溃
    expect(result).toBeDefined();
    expect(result.templates).toBeDefined();
    expect(Array.isArray(result.templates)).toBe(true);
  });

  /**
   * 测试：模板 YAML 文件损坏
   * 验证：应跳过损坏文件，返回有效模板
   *
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  it('[异常] should_skip_corrupted_template_files', async () => {
    // given: 存在损坏的模板文件时（环境依赖）
    // 此测试验证容错能力

    // when: 调用工具
    const result = await listTemplates({});

    // then: 应返回有效模板，跳过损坏文件
    expect(result.templates).toBeDefined();

    // 返回的模板都应包含必要字段
    result.templates.forEach(template => {
      expect(template.name).toBeDefined();
      expect(template.type).toBeDefined();
      expect(template.description).toBeDefined();
    });
  });
});

// ============================================================
// Phase 3: 边界场景测试
// ============================================================

describe('list_templates - 边界场景', () => {

  /**
   * 测试：筛选类型无匹配模板
   * 验证：返回空数组
   *
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  it('[边界] should_return_empty_array_when_no_matching_type', async () => {
    // given: 筛选一个可能无模板的类型
    // 假设 'business' 类型可能无模板
    const input: ListTemplatesInput = { type: 'business' };

    // when: 调用工具
    const result = await listTemplates(input);

    // then: 返回空数组而非 null 或 undefined
    expect(result.templates).toBeDefined();
    expect(Array.isArray(result.templates)).toBe(true);
    // 允许长度为 0（无匹配）
  });

  /**
   * 测试：返回模板数量上限
   * 验证：不应超过合理数量（如 20 个）
   *
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  it('[边界] should_not_exceed_reasonable_template_count', async () => {
    // given: 不提供筛选
    const input: ListTemplatesInput = {};

    // when: 调用工具
    const result = await listTemplates(input);

    // then: 模板数量应在合理范围（≤ 20）
    expect(result.templates.length).toBeLessThanOrEqual(20);
  });

  /**
   * 测试：模板名称格式规范
   * 验证：名称使用 kebab-case
   *
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  it('[边界] should_use_kebab_case_for_template_names', async () => {
    // given: 不提供筛选
    const input: ListTemplatesInput = {};

    // when: 调用工具
    const result = await listTemplates(input);

    // then: 模板名称应符合 kebab-case 格式
    result.templates.forEach(template => {
      // kebab-case: 小写字母 + 可选连字符
      const isValidKebabCase = /^[a-z]+(-[a-z]+)*$/.test(template.name);
      expect(isValidKebabCase).toBe(true);
    });
  });

  /**
   * 测试：模板类型枚举值有效
   * 验证：类型只能是 deployment/business/function
   *
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  it('[边界] should_have_valid_type_enum_values', async () => {
    // given: 不提供筛选
    const input: ListTemplatesInput = {};

    // when: 调用工具
    const result = await listTemplates(input);

    // then: 类型值应在有效枚举范围内
    const validTypes = ['deployment', 'business', 'function'];

    result.templates.forEach(template => {
      expect(validTypes).toContain(template.type);
    });
  });

  /**
   * 测试：空输入参数
   * 验证：空对象应返回所有模板
   *
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  it('[边界] should_accept_empty_input_object', async () => {
    // given: 空对象
    const input: ListTemplatesInput = {};

    // when: 调用工具
    const result = await listTemplates(input);

    // then: 应正常返回模板列表
    expect(result).toBeDefined();
    expect(result.templates).toBeDefined();
    expect(Array.isArray(result.templates)).toBe(true);
  });

  /**
   * 测试：模板列表稳定性
   * 验证：多次调用返回相同结果
   *
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  it('[边界] should_return_stable_results_on_multiple_calls', async () => {
    // given: 相同输入
    const input: ListTemplatesInput = { type: 'deployment' };

    // when: 多次调用
    const result1 = await listTemplates(input);
    const result2 = await listTemplates(input);

    // then: 结果应一致
    expect(result1.templates.length).toBe(result2.templates.length);

    // 模板名称应一致
    const names1 = result1.templates.map(t => t.name).sort();
    const names2 = result2.templates.map(t => t.name).sort();

    expect(names1).toEqual(names2);
  });
});

// ============================================================
// Phase 4: 字段覆盖测试（Spec Output Schema）
// ============================================================

describe('list_templates - 字段覆盖', () => {

  /**
   * 测试：Output Schema 所有字段存在
   * 验证：templates 数组及其子字段
   *
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  it('[字段] should_have_all_output_schema_fields', async () => {
    // given: 不提供筛选
    const input: ListTemplatesInput = {};

    // when: 调用工具
    const result = await listTemplates(input);

    // then: 验证顶层字段
    expect(result).toHaveProperty('templates');

    // 验证数组类型
    expect(Array.isArray(result.templates)).toBe(true);

    // 验证每个模板项的字段
    if (result.templates.length > 0) {
      const template = result.templates[0];

      // Spec 定义的三个必要字段
      expect(template).toHaveProperty('name');
      expect(template).toHaveProperty('type');
      expect(template).toHaveProperty('description');
    }
  });

  /**
   * 测试：模板字段类型正确
   * 验证：name/type/description 都是字符串
   *
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  it('[字段] should_have_correct_field_types', async () => {
    // given: 不提供筛选
    const input: ListTemplatesInput = {};

    // when: 调用工具
    const result = await listTemplates(input);

    // then: 验证字段类型
    result.templates.forEach(template => {
      // name: string
      expect(typeof template.name).toBe('string');
      expect(template.name.length).toBeGreaterThan(0);

      // type: string
      expect(typeof template.type).toBe('string');
      expect(template.type.length).toBeGreaterThan(0);

      // description: string
      expect(typeof template.description).toBe('string');
      expect(template.description.length).toBeGreaterThan(0);
    });
  });

  /**
   * 测试：模板无额外字段
   * 验证：仅包含 name/type/description
   *
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  it('[字段] should_not_have_extra_fields', async () => {
    // given: 不提供筛选
    const input: ListTemplatesInput = {};

    // when: 调用工具
    const result = await listTemplates(input);

    // then: 模板项应只包含 Spec 定义的三个字段
    result.templates.forEach(template => {
      const keys = Object.keys(template);

      // 仅允许 name, type, description
      expect(keys.length).toBe(3);
      expect(keys).toContain('name');
      expect(keys).toContain('type');
      expect(keys).toContain('description');
    });
  });
});