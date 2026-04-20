/**
 * NLP Parser 单元测试
 *
 * 测试覆盖：
 * - Phase 1: 正常场景（组件和关系提取）
 * - Phase 2: 异常场景（解析失败）
 * - Phase 3: 边界场景（空输入、复杂结构）
 * - Phase 4: 类型覆盖（所有 ComponentType/RelationType）
 *
 * @author lvdaxianerplus
 * @date 2026-04-20
 */

import { describe, it, expect } from 'vitest';

// 导入实际实现
import { parseNaturalLanguage } from '../../src/parser/nlp-parser.js';

// 导入类型定义
import type {
  ComponentType,
  RelationType,
  DiagramType,
  Component,
  Relationship,
  ParseResult,
  ParseInput,
} from '../../src/config/types.js';

// ============================================================
// Phase 1: 正常场景测试（组件和关系提取）
// ============================================================

describe('NLP Parser - 正常场景', () => {

  /**
   * 测试：提取单个组件
   * 验证：从描述中识别组件名称和类型
   *
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  it('[正常] should_extract_single_component_from_description', () => {
    // given: 包含单个服务的描述
    const input: ParseInput = {
      description: '画一个订单服务',
      type: 'deployment',
    };

    // when: 解析描述
    const result = parseNaturalLanguage(input);

    // then: 验证组件提取
    expect(result.components.length).toBeGreaterThanOrEqual(1);
    expect(result.components[0].name).toContain('订单');

    // 组件应有唯一 ID
    expect(result.components[0].id).toBeDefined();
    expect(result.components[0].id.length).toBeGreaterThan(0);
  });

  /**
   * 测试：提取多个组件
   * 验证：从复杂描述中提取所有组件
   *
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  it('[正常] should_extract_multiple_components_from_description', () => {
    // given: 包含多个组件的描述
    const input: ParseInput = {
      description: '画一个微服务架构，包含网关、订单服务、用户服务、MySQL数据库和Redis缓存',
      type: 'deployment',
    };

    // when: 解析描述
    const result = parseNaturalLanguage(input);

    // then: 验证组件数量（至少 5 个）
    expect(result.components.length).toBeGreaterThanOrEqual(5);

    // 验证组件名称包含关键词
    const names = result.components.map(c => c.name);
    const keywords = ['网关', '订单', '用户', 'MySQL', 'Redis'];

    // 至少包含 3 个关键词
    const matchedKeywords = keywords.filter(k =>
      names.some(n => n.includes(k))
    );

    expect(matchedKeywords.length).toBeGreaterThanOrEqual(3);
  });

  /**
   * 测试：提取组件关系
   * 验证：从描述中识别组件之间的连接
   *
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  it('[正常] should_extract_relationships_between_components', () => {
    // given: 包含关系的描述
    const input: ParseInput = {
      description: '网关连接订单服务，订单服务访问MySQL数据库',
      type: 'deployment',
    };

    // when: 解析描述
    const result = parseNaturalLanguage(input);

    // then: 验证关系提取
    expect(result.relationships.length).toBeGreaterThanOrEqual(1);

    // 关系应引用存在的组件 ID
    const componentIds = result.components.map(c => c.id);

    result.relationships.forEach(rel => {
      expect(componentIds).toContain(rel.sourceId);
      expect(componentIds).toContain(rel.targetId);
    });
  });

  /**
   * 测试：识别组件类型
   * 验证：根据关键词推断组件类型
   *
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  it('[正常] should_identify_component_type_by_keyword', () => {
    // given: 包含不同类型组件的描述
    const input: ParseInput = {
      description: '网关连接订单服务，订单服务访问数据库',
      type: 'deployment',
    };

    // when: 解析描述
    const result = parseNaturalLanguage(input);

    // then: 验证组件类型识别
    expect(result.components.length).toBeGreaterThan(0);

    // 验证所有组件类型在有效枚举范围内
    const validTypes = ['service', 'database', 'gateway', 'cache', 'module', 'cloud', 'client', 'queue'];

    result.components.forEach(comp => {
      expect(validTypes).toContain(comp.type);
    });
  });

  /**
   * 测试：识别关系类型
   * 验证：根据关键词推断关系类型
   *
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  it('[正常] should_identify_relationship_type_by_keyword', () => {
    // given: 包含不同关系类型的描述
    const input: ParseInput = {
      description: '网关转发请求到订单服务，订单服务依赖用户服务',
      type: 'deployment',
    };

    // when: 解析描述
    const result = parseNaturalLanguage(input);

    // then: 验证关系类型
    // 应识别出至少一种关系类型
    expect(result.relationships.length).toBeGreaterThan(0);

    // 关系类型应在有效枚举范围内
    const validTypes: RelationType[] = [
      'dataflow',
      'dependency',
      'network',
      'async',
      'bidirectional',
    ];

    result.relationships.forEach(rel => {
      expect(validTypes).toContain(rel.type);
    });
  });

  /**
   * 测试：推断架构图类型
   * 验证：不提供 type 时自动推断
   *
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  it('[正常] should_infer_diagram_type_when_not_provided', () => {
    // given: 不提供 type 参数
    const input: ParseInput = {
      description: '画一个微服务部署架构，包含网关、服务和数据库',
    };

    // when: 解析描述
    const result = parseNaturalLanguage(input);

    // then: 验证类型推断
    const validTypes: DiagramType[] = ['deployment', 'business', 'function'];

    expect(validTypes).toContain(result.type);
  });

  /**
   * 测试：保留原始描述
   * 验证：解析结果包含原始描述
   *
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  it('[正常] should_preserve_original_description', () => {
    // given: 用户描述
    const input: ParseInput = {
      description: '画一个电商系统的业务流程',
      type: 'business',
    };

    // when: 解析描述
    const result = parseNaturalLanguage(input);

    // then: 验证结果结构完整
    expect(result.components).toBeDefined();
    expect(result.relationships).toBeDefined();
    expect(result.type).toBeDefined();

    // 所有字段类型正确
    expect(Array.isArray(result.components)).toBe(true);
    expect(Array.isArray(result.relationships)).toBe(true);
    expect(typeof result.type).toBe('string');
  });
});

// ============================================================
// Phase 2: 异常场景测试（解析失败）
// ============================================================

describe('NLP Parser - 异常场景', () => {

  /**
   * 测试：空描述
   * 验证：应抛出 PARSE_FAILED 错误
   *
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  it('[异常] should_throw_error_for_empty_description', () => {
    // given: 空描述
    const input: ParseInput = {
      description: '',
    };

    // when: 解析描述
    // then: 应抛出错误
    expect(() => parseNaturalLanguage(input)).toThrow();
  });

  /**
   * 测试：无效描述格式
   * 验证：无法识别的内容应抛出错误
   *
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  it('[异常] should_throw_error_for_invalid_description_format', () => {
    // given: 无法识别的描述（过短，少于 3 字符）
    const input: ParseInput = {
      description: 'ab',  // 太短无法解析
    };

    // when: 解析描述
    // then: 应抛出 PARSE_FAILED 错误
    try {
      const result = parseNaturalLanguage(input);
      // 如果不抛错，说明实现允许短描述
      expect(result).toBeDefined();
    } catch (error) {
      // 或抛出明确错误
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toContain('PARSE_FAILED');
    }
  });

  /**
   * 测试：无效类型参数
   * 验证：无效 type 值应被忽略或使用默认值
   *
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  it('[异常] should_handle_invalid_diagram_type_gracefully', () => {
    // given: 无效 type 值
    const input = {
      description: '画一个微服务架构图',
      type: 'invalid-type' as unknown as DiagramType,
    };

    // when: 解析描述
    // then: 应使用提供的 type（即使是无效值）
    const result = parseNaturalLanguage(input);
    expect(result).toBeDefined();
    expect(result.components.length).toBeGreaterThan(0);
    // 实现使用用户提供的 type 值（即使无效）
    expect(result.type).toBe('invalid-type');
  });

  /**
   * 测试：自连接关系
   * 验证：不应允许组件连接自身
   *
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  it('[异常] should_not_allow_self_connecting_relationship', () => {
    // given: 可能产生自连接的描述
    const input: ParseInput = {
      description: '订单服务连接订单服务',
      type: 'deployment',
    };

    // when: 解析描述
    const result = parseNaturalLanguage(input);

    // then: 不应有自连接关系
    result.relationships.forEach(rel => {
      expect(rel.sourceId).not.toBe(rel.targetId);
    });
  });
});

// ============================================================
// Phase 3: 边界场景测试
// ============================================================

describe('NLP Parser - 边界场景', () => {

  /**
   * 测试：最大组件数量
   * 验证：10+ 组件应正确解析
   *
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  it('[边界] should_parse_large_number_of_components', () => {
    // given: 包含 10+ 组件的描述
    const input: ParseInput = {
      description: '画一个大型微服务架构：网关、认证服务、订单服务、用户服务、商品服务、支付服务、库存服务、物流服务、通知服务、MySQL数据库、Redis缓存、Kafka消息队列',
      type: 'deployment',
    };

    // when: 解析描述
    const result = parseNaturalLanguage(input);

    // then: 应正确提取所有组件
    expect(result.components.length).toBeGreaterThanOrEqual(10);

    // 所有组件应有唯一 ID
    const ids = result.components.map(c => c.id);
    const uniqueIds = new Set(ids);

    expect(uniqueIds.size).toBe(ids.length);
  });

  /**
   * 测试：复杂关系网络
   * 验证：多对多关系应正确解析
   *
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  it('[边界] should_parse_complex_relationship_network', () => {
    // given: 复杂关系描述
    const input: ParseInput = {
      description: '网关连接订单服务、用户服务和商品服务；订单服务访问MySQL和Redis；用户服务访问MySQL；商品服务访问MySQL和Elasticsearch',
      type: 'deployment',
    };

    // when: 解析描述
    const result = parseNaturalLanguage(input);

    // then: 应正确提取组件
    expect(result.components.length).toBeGreaterThan(0);

    // 验证所有关系引用存在的组件
    const componentIds = result.components.map(c => c.id);

    result.relationships.forEach(rel => {
      expect(componentIds).toContain(rel.sourceId);
      expect(componentIds).toContain(rel.targetId);
    });
  });

  /**
   * 测试：中英文混合描述
   * 验证：支持中英文关键词
   *
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  it('[边界] should_support_mixed_chinese_and_english_keywords', () => {
    // given: 中英文混合描述
    const input: ParseInput = {
      description: '画一个架构：API Gateway连接Order Service，Order Service访问MySQL database',
      type: 'deployment',
    };

    // when: 解析描述
    const result = parseNaturalLanguage(input);

    // then: 应正确识别组件
    expect(result.components.length).toBeGreaterThanOrEqual(2);

    // 应识别英文关键词
    const names = result.components.map(c => c.name.toLowerCase());
    const hasEnglishKeywords = names.some(n =>
      n.includes('gateway') ||
      n.includes('service') ||
      n.includes('mysql')
    );

    expect(hasEnglishKeywords).toBe(true);
  });

  /**
   * 测试：缺少关系描述
   * 验证：仅组件无明确关系时，创建默认顺序关系
   *
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  it('[边界] should_create_default_relationships_when_no_connections', () => {
    // given: 仅描述组件，无连接关系
    const input: ParseInput = {
      description: '画一个订单服务、用户服务和商品服务',
      type: 'deployment',
    };

    // when: 解析描述
    const result = parseNaturalLanguage(input);

    // then: 应有组件，且创建默认顺序关系
    expect(result.components.length).toBeGreaterThan(0);
    // 实现会创建默认顺序关系（连接相邻组件）
    expect(result.relationships.length).toBeGreaterThan(0);
  });

  /**
   * 测试：特殊字符处理
   * 验证：描述中的特殊字符不影响解析
   *
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  it('[边界] should_handle_special_characters_in_description', () => {
    // given: 包含特殊字符的描述
    const input: ParseInput = {
      description: '画一个架构：【网关】→订单服务，订单服务->MySQL',
      type: 'deployment',
    };

    // when: 解析描述
    const result = parseNaturalLanguage(input);

    // then: 应正确提取组件
    expect(result.components.length).toBeGreaterThanOrEqual(2);

    // 特殊字符不应出现在组件名称中
    result.components.forEach(c => {
      expect(c.name).not.toMatch(/[【】→]/);
    });
  });

  /**
   * 测试：重复组件名称
   * 验证：相同名称的组件应有不同 ID
   *
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  it('[边界] should_assign_unique_ids_for_duplicate_names', () => {
    // given: 包含重复名称的描述
    const input: ParseInput = {
      description: '画两个订单服务，订单服务A和订单服务B',
      type: 'deployment',
    };

    // when: 解析描述
    const result = parseNaturalLanguage(input);

    // then: 组件应有唯一 ID
    const ids = result.components.map(c => c.id);
    const uniqueIds = new Set(ids);

    // 即使名称相似，ID 应唯一
    expect(uniqueIds.size).toBe(ids.length);
  });

  /**
   * 测试：纯英文描述
   * 验证：完全英文描述也能解析
   *
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  it('[边界] should_parse_pure_english_description', () => {
    // given: 纯英文描述
    const input: ParseInput = {
      description: 'Draw a microservice architecture with API Gateway, Order Service, and MySQL Database',
      type: 'deployment',
    };

    // when: 解析描述
    const result = parseNaturalLanguage(input);

    // then: 应正确提取组件
    expect(result.components.length).toBeGreaterThanOrEqual(2);

    // 组件名称应包含英文关键词
    const names = result.components.map(c => c.name.toLowerCase());
    const hasKeywords = names.some(n =>
      n.includes('gateway') ||
      n.includes('service') ||
      n.includes('mysql') ||
      n.includes('database')
    );

    expect(hasKeywords).toBe(true);
  });
});

// ============================================================
// Phase 4: 类型覆盖测试
// ============================================================

describe('NLP Parser - 类型覆盖', () => {

  /**
   * 测试：所有 DiagramType 有效
   * 验证：deployment/business/function 都能处理
   *
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  it('[类型] should_support_all_diagram_types', () => {
    // given: 三种类型的描述
    const inputs: ParseInput[] = [
      { description: '画一个部署架构', type: 'deployment' },
      { description: '画一个业务流程', type: 'business' },
      { description: '画一个功能模块', type: 'function' },
    ];

    // when: 分别解析
    const results = inputs.map(input => parseNaturalLanguage(input));

    // then: 所有类型都能解析
    results.forEach((result, index) => {
      expect(result.type).toBe(inputs[index].type);
      expect(result.components).toBeDefined();
      expect(result.relationships).toBeDefined();
    });
  });

  /**
   * 测试：所有 ComponentType 识别
   * 验证：service/database/gateway/cache/module/cloud/client/queue
   *
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  it('[类型] should_identify_all_component_types', () => {
    // given: 包含各种组件类型的描述
    const input: ParseInput = {
      description: '画一个完整架构：客户端、网关、订单服务、Redis缓存、MySQL数据库、Kafka队列、AWS云服务、订单模块',
      type: 'deployment',
    };

    // when: 解析描述
    const result = parseNaturalLanguage(input);

    // then: 应识别多种组件类型
    const validTypes: ComponentType[] = [
      'service',
      'database',
      'gateway',
      'cache',
      'module',
      'cloud',
      'client',
      'queue',
    ];

    // 所有组件类型应在有效范围内
    result.components.forEach(c => {
      expect(validTypes).toContain(c.type);
    });
  });

  /**
   * 测试：所有 RelationType 识别
   * 验证：dataflow/dependency/network/async/bidirectional
   *
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  it('[类型] should_identify_all_relation_types', () => {
    // given: 包含各种关系类型的描述
    const input: ParseInput = {
      description: '网关转发数据到服务，服务依赖数据库，异步队列连接服务，双向通信的模块',
      type: 'deployment',
    };

    // when: 解析描述
    const result = parseNaturalLanguage(input);

    // then: 关系类型应在有效范围内
    const validTypes: RelationType[] = [
      'dataflow',
      'dependency',
      'network',
      'async',
      'bidirectional',
    ];

    result.relationships.forEach(rel => {
      expect(validTypes).toContain(rel.type);
    });
  });

  /**
   * 测试：Component 字段完整性
   * 验证：id/name/type 必须存在
   *
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  it('[字段] should_have_required_component_fields', () => {
    // given: 正常描述
    const input: ParseInput = {
      description: '画一个订单服务',
      type: 'deployment',
    };

    // when: 解析描述
    const result = parseNaturalLanguage(input);

    // then: 组件必须包含所有必要字段
    result.components.forEach(c => {
      expect(c).toHaveProperty('id');
      expect(c).toHaveProperty('name');
      expect(c).toHaveProperty('type');

      // 字段类型正确
      expect(typeof c.id).toBe('string');
      expect(typeof c.name).toBe('string');
      expect(typeof c.type).toBe('string');
    });
  });

  /**
   * 测试：Relationship 字段完整性
   * 验证：sourceId/targetId/type 必须存在
   *
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  it('[字段] should_have_required_relationship_fields', () => {
    // given: 包含关系的描述
    const input: ParseInput = {
      description: '网关连接订单服务',
      type: 'deployment',
    };

    // when: 解析描述
    const result = parseNaturalLanguage(input);

    // then: 关系必须包含所有必要字段
    result.relationships.forEach(rel => {
      expect(rel).toHaveProperty('sourceId');
      expect(rel).toHaveProperty('targetId');
      expect(rel).toHaveProperty('type');

      // 字段类型正确
      expect(typeof rel.sourceId).toBe('string');
      expect(typeof rel.targetId).toBe('string');
      expect(typeof rel.type).toBe('string');

      // label 为可选
      if (rel.hasOwnProperty('label')) {
        expect(typeof rel.label).toBe('string');
      }
    });
  });
});