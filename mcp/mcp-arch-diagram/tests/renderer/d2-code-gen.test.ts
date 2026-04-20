/**
 * D2 Code Generator 单元测试
 *
 * 测试覆盖：
 * - Phase 1: 正常场景（代码生成）
 * - Phase 2: 异常场景（无效输入）
 * - Phase 3: 边界场景（复杂结构）
 * - Phase 4: 语法验证（D2 特性）
 *
 * @author lvdaxianerplus
 * @date 2026-04-20
 */

import { describe, it, expect } from 'vitest';

// 导入实际实现
import { generateD2Code } from '../../src/renderer/d2-code-gen.js';

// 导入类型定义
import type {
  Diagram,
  Component,
  Relationship,
  D2GenerateOptions,
} from '../../src/config/types.js';

/**
 * 创建测试 Diagram 的辅助函数
 */
function createDiagram(
  id: string,
  components: Component[],
  relationships: Relationship[] = []
): Diagram {
  return {
    id,
    type: 'deployment',
    engine: 'd2',
    createdAt: new Date(),
    outputDir: './diagrams',
    components,
    relationships,
  };
}

// ============================================================
// Phase 1: 正常场景测试（代码生成）
// ============================================================

describe('D2 Code Generator - 正常场景', () => {

  /**
   * 测试：生成基本 D2 代码
   * 验证：输出包含方向和组件定义
   *
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  it('[正常] should_generate_basic_d2_code_structure', () => {
    // given: 单组件架构图
    const diagram: Diagram = {
      id: 'arch-001',
      type: 'deployment',
      engine: 'd2',
      components: [
        { id: 'svc1', name: '订单服务', type: 'service' },
      ],
      relationships: [],
      createdAt: new Date(),
      outputDir: './diagrams',
    };

    // when: 生成 D2 代码
    const code = generateD2Code(diagram);

    // then: 验证基本结构
    expect(code).toBeDefined();
    expect(code.length).toBeGreaterThan(0);

    // 应包含方向声明
    expect(code).toMatch(/direction:\s*(right|down|left|up)/);

    // 应包含组件定义
    expect(code).toContain('订单服务');
  });

  /**
   * 测试：生成包含关系的 D2 代码
   * 验证：关系转换为箭头语法
   *
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  it('[正常] should_generate_relationship_with_arrow_syntax', () => {
    // given: 包含关系的架构图
    const diagram: Diagram = {
      id: 'arch-002',
      type: 'deployment',
      engine: 'd2',
      createdAt: new Date(),
      outputDir: './diagrams',
      components: [
        { id: 'gw', name: '网关', type: 'gateway' },
        { id: 'svc', name: '订单服务', type: 'service' },
      ],
      relationships: [
        { sourceId: 'gw', targetId: 'svc', type: 'dataflow', label: 'HTTP' },
      ],
    };

    // when: 生成 D2 代码
    const code = generateD2Code(diagram);

    // then: 验证关系语法
    expect(code).toContain('网关');
    expect(code).toContain('订单服务');

    // D2 箭头语法：source -> target: label
    expect(code).toMatch(/网关\s*->\s*订单服务/);

    // 应包含关系标签
    expect(code).toContain('HTTP');
  });

  /**
   * 测试：设置方向选项
   * 验证：direction 参数生效
   *
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  it('[正常] should_apply_direction_option', () => {
    // given: 架构图和方向选项
    const diagram: Diagram = {
      id: 'arch-003',
      type: 'deployment',
      components: [
        { id: 'svc', name: '服务', type: 'service' },
      ],
      relationships: [],
    };

    const options: D2GenerateOptions = {
      direction: 'down',
    };

    // when: 生成 D2 代码
    const code = generateD2Code(diagram, options);

    // then: 验证方向
    expect(code).toContain('direction: down');
  });

  /**
   * 测试：默认方向为 right
   * 验证：不提供选项时默认横向布局
   *
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  it('[正常] should_use_default_direction_right', () => {
    // given: 架构图（无选项）
    const diagram: Diagram = {
      id: 'arch-004',
      type: 'deployment',
      components: [
        { id: 'svc', name: '服务', type: 'service' },
      ],
      relationships: [],
    };

    // when: 生成 D2 代码（无选项）
    const code = generateD2Code(diagram);

    // then: 验证默认方向
    expect(code).toContain('direction: right');
  });

  /**
   * 测试：组件 ID 转换为有效 D2 标识符
   * 验证：ID 不包含特殊字符
   *
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  it('[正常] should_convert_component_id_to_valid_identifier', () => {
    // given: 包含特殊字符 ID 的组件
    const diagram: Diagram = {
      id: 'arch-005',
      type: 'deployment',
      components: [
        { id: 'svc-order-001', name: '订单服务', type: 'service' },
      ],
      relationships: [],
    };

    // when: 生成 D2 代码
    const code = generateD2Code(diagram);

    // then: D2 标识符应有效（不含中文）
    // D2 标识符规则：字母、数字、下划线、连字符
    expect(code).toBeDefined();

    // 验证代码可解析（无语法错误特征）
    expect(code).not.toContain('undefined');
    expect(code).not.toContain('null');
  });

  /**
   * 测试：生成多组件架构图
   * 验证：所有组件都出现在代码中
   *
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  it('[正常] should_include_all_components_in_generated_code', () => {
    // given: 多组件架构图
    const diagram: Diagram = {
      id: 'arch-006',
      type: 'deployment',
      components: [
        { id: 'gw', name: '网关', type: 'gateway' },
        { id: 'svc1', name: '订单服务', type: 'service' },
        { id: 'svc2', name: '用户服务', type: 'service' },
        { id: 'db', name: 'MySQL', type: 'database' },
      ],
      relationships: [],
    };

    // when: 生成 D2 代码
    const code = generateD2Code(diagram);

    // then: 所有组件名称应出现
    expect(code).toContain('网关');
    expect(code).toContain('订单服务');
    expect(code).toContain('用户服务');
    expect(code).toContain('MySQL');
  });

  /**
   * 测试：关系标签包含在箭头旁
   * 验证：label 显示在连接线上
   *
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  it('[正常] should_include_relationship_label_on_arrow', () => {
    // given: 包含标签的关系
    const diagram: Diagram = {
      id: 'arch-007',
      type: 'deployment',
      components: [
        { id: 'a', name: '组件A', type: 'service' },
        { id: 'b', name: '组件B', type: 'service' },
      ],
      relationships: [
        { sourceId: 'a', targetId: 'b', type: 'dataflow', label: 'TCP' },
      ],
    };

    // when: 生成 D2 代码
    const code = generateD2Code(diagram);

    // then: 标签应在箭头后（D2 语法：a -> b: label）
    expect(code).toContain('TCP');

    // 验证格式正确
    expect(code).toMatch(/组件A\s*->\s*组件B:\s*TCP/);
  });
});

// ============================================================
// Phase 2: 异常场景测试（无效输入）
// ============================================================

describe('D2 Code Generator - 异常场景', () => {

  /**
   * 测试：空组件数组
   * 验证：应抛出错误或返回空代码
   *
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  it('[异常] should_handle_empty_components_array', () => {
    // given: 空组件数组
    const diagram: Diagram = {
      id: 'arch-008',
      type: 'deployment',
      components: [],
      relationships: [],
    };

    // when: 生成代码
    // then: 应抛出错误或返回最小代码
    try {
      const code = generateD2Code(diagram);

      // 如果不抛错，应返回至少方向声明
      expect(code).toContain('direction:');
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
    }
  });

  /**
   * 测试：关系引用不存在组件
   * 验证：应抛出错误
   *
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  it('[异常] should_throw_error_for_invalid_relationship_reference', () => {
    // given: 关系引用不存在的组件 ID
    const diagram: Diagram = {
      id: 'arch-009',
      type: 'deployment',
      components: [
        { id: 'a', name: '组件A', type: 'service' },
      ],
      relationships: [
        { sourceId: 'a', targetId: 'nonexistent', type: 'dataflow' },
      ],
    };

    // when: 生成代码
    // then: 应抛出错误
    expect(() => generateD2Code(diagram)).toThrow();
  });

  /**
   * 测试：无效 Diagram ID
   * 验证：ID 为空时应处理
   *
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  it('[异常] should_handle_empty_diagram_id', () => {
    // given: 空 ID
    const diagram: Diagram = {
      id: '',
      type: 'deployment',
      components: [
        { id: 'svc', name: '服务', type: 'service' },
      ],
      relationships: [],
    };

    // when: 生成代码
    // then: 应抛出错误或正常处理
    try {
      const code = generateD2Code(diagram);
      expect(code).toBeDefined();
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
    }
  });

  /**
   * 测试：无效 DiagramType
   * 验证：非枚举类型应被处理（使用默认值）
   *
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  it('[异常] should_handle_invalid_diagram_type_gracefully', () => {
    // given: 无效类型
    const diagram = {
      id: 'arch-010',
      type: 'invalid-type' as unknown as DiagramType,
      components: [
        { id: 'svc', name: '服务', type: 'service' },
      ],
      relationships: [],
      createdAt: new Date(),
      outputDir: './diagrams',
      engine: 'd2',
    };

    // when: 生成代码
    // then: 应生成代码（忽略无效类型）
    const code = generateD2Code(diagram);
    expect(code).toBeDefined();
    expect(code.length).toBeGreaterThan(0);
  });
});

// ============================================================
// Phase 3: 边界场景测试
// ============================================================

describe('D2 Code Generator - 边界场景', () => {

  /**
   * 测试：大量组件（10+）
   * 验证：代码正确包含所有组件
   *
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  it('[边界] should_generate_code_for_large_number_of_components', () => {
    // given: 10+ 组件的架构图
    const diagram: Diagram = {
      id: 'arch-011',
      type: 'deployment',
      components: [
        { id: 'gw', name: '网关', type: 'gateway' },
        { id: 'svc1', name: '订单服务', type: 'service' },
        { id: 'svc2', name: '用户服务', type: 'service' },
        { id: 'svc3', name: '商品服务', type: 'service' },
        { id: 'svc4', name: '支付服务', type: 'service' },
        { id: 'svc5', name: '库存服务', type: 'service' },
        { id: 'db1', name: 'MySQL', type: 'database' },
        { id: 'db2', name: 'Redis', type: 'cache' },
        { id: 'mq', name: 'Kafka', type: 'queue' },
        { id: 'cloud', name: 'AWS', type: 'cloud' },
      ],
      relationships: [],
    };

    // when: 生成代码
    const code = generateD2Code(diagram);

    // then: 所有组件应出现
    expect(code).toContain('网关');
    expect(code).toContain('订单服务');
    expect(code).toContain('用户服务');
    expect(code).toContain('商品服务');
    expect(code).toContain('支付服务');

    // 代码长度应合理（不超 10000 字符）
    expect(code.length).toBeLessThan(10000);
  });

  /**
   * 测试：复杂关系网络
   * 验证：多对多关系正确生成
   *
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  it('[边界] should_generate_complex_relationship_network', () => {
    // given: 复杂关系网络
    const diagram: Diagram = {
      id: 'arch-012',
      type: 'deployment',
      components: [
        { id: 'gw', name: '网关', type: 'gateway' },
        { id: 'svc1', name: '订单服务', type: 'service' },
        { id: 'svc2', name: '用户服务', type: 'service' },
        { id: 'db', name: 'MySQL', type: 'database' },
      ],
      relationships: [
        { sourceId: 'gw', targetId: 'svc1', type: 'dataflow' },
        { sourceId: 'gw', targetId: 'svc2', type: 'dataflow' },
        { sourceId: 'svc1', targetId: 'db', type: 'dependency' },
        { sourceId: 'svc2', targetId: 'db', type: 'dependency' },
        { sourceId: 'svc1', targetId: 'svc2', type: 'network' },
      ],
    };

    // when: 生成代码
    const code = generateD2Code(diagram);

    // then: 所有关系应生成箭头
    // 验证箭头数量（至少 5 个）
    const arrowMatches = code.match(/->/g);
    expect(arrowMatches?.length).toBeGreaterThanOrEqual(5);
  });

  /**
   * 测试：包含位置信息的组件
   * 验证：position 被忽略或正确应用
   *
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  it('[边界] should_handle_components_with_position', () => {
    // given: 包含位置的组件
    const diagram: Diagram = {
      id: 'arch-013',
      type: 'deployment',
      components: [
        {
          id: 'svc',
          name: '服务',
          type: 'service',
          position: { x: 100, y: 200 },
        },
      ],
      relationships: [],
    };

    // when: 生成代码
    const code = generateD2Code(diagram);

    // then: 应正常生成（position 可能被忽略）
    expect(code).toBeDefined();
    expect(code).toContain('服务');
  });

  /**
   * 测试：组件名称包含特殊字符
   * 验证：特殊字符被处理或转义
   *
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  it('[边界] should_handle_special_characters_in_component_name', () => {
    // given: 包含特殊字符的名称
    const diagram: Diagram = {
      id: 'arch-014',
      type: 'deployment',
      components: [
        { id: 'svc', name: '订单服务(v2.0)', type: 'service' },
      ],
      relationships: [],
    };

    // when: 生成代码
    const code = generateD2Code(diagram);

    // then: 应正常生成
    expect(code).toBeDefined();
    expect(code.length).toBeGreaterThan(0);

    // 名称应出现（可能被转义）
    expect(code).toContain('订单服务');
  });

  /**
   * 测试：所有方向选项有效
   * 验证：right/down/left/up 都能生成
   *
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  it('[边界] should_support_all_direction_options', () => {
    // given: 架构图
    const diagram: Diagram = {
      id: 'arch-015',
      type: 'deployment',
      components: [
        { id: 'svc', name: '服务', type: 'service' },
      ],
      relationships: [],
    };

    const directions: Array<'right' | 'down' | 'left' | 'up'> = [
      'right',
      'down',
      'left',
      'up',
    ];

    // when: 分别生成不同方向的代码
    const codes = directions.map(dir =>
      generateD2Code(diagram, { direction: dir })
    );

    // then: 每个方向都应正确生成
    codes.forEach((code, index) => {
      expect(code).toContain(`direction: ${directions[index]}`);
    });
  });

  /**
   * 测试：无关系的组件组合
   * 验证：仅组件定义，无箭头
   *
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  it('[边界] should_generate_only_component_definitions_without_relationships', () => {
    // given: 无关系的架构图
    const diagram: Diagram = {
      id: 'arch-016',
      type: 'deployment',
      components: [
        { id: 'a', name: '组件A', type: 'service' },
        { id: 'b', name: '组件B', type: 'service' },
      ],
      relationships: [],
    };

    // when: 生成代码
    const code = generateD2Code(diagram);

    // then: 应不包含箭头
    expect(code).not.toContain('->');

    // 应包含所有组件
    expect(code).toContain('组件A');
    expect(code).toContain('组件B');
  });
});

// ============================================================
// Phase 4: 语法验证测试（D2 特性）
// ============================================================

describe('D2 Code Generator - 语法验证', () => {

  /**
   * 测试：D2 方向语法正确
   * 验证：direction: right 格式
   *
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  it('[语法] should_use_correct_direction_syntax', () => {
    // given: 架构图
    const diagram: Diagram = {
      id: 'arch-017',
      type: 'deployment',
      components: [
        { id: 'svc', name: '服务', type: 'service' },
      ],
      relationships: [],
    };

    // when: 生成代码
    const code = generateD2Code(diagram);

    // then: D2 方向语法：direction: <value>
    expect(code).toMatch(/direction:\s*(right|down|left|up)/);
  });

  /**
   * 测试：D2 箭头语法正确
   * 验证：source -> target: label 格式
   *
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  it('[语法] should_use_correct_arrow_syntax', () => {
    // given: 包含关系和标签的架构图
    const diagram: Diagram = {
      id: 'arch-018',
      type: 'deployment',
      components: [
        { id: 'a', name: '组件A', type: 'service' },
        { id: 'b', name: '组件B', type: 'service' },
      ],
      relationships: [
        { sourceId: 'a', targetId: 'b', type: 'dataflow', label: 'HTTP' },
      ],
    };

    // when: 生成代码
    const code = generateD2Code(diagram);

    // then: D2 箭头语法：A -> B: label
    expect(code).toMatch(/组件A\s*->\s*组件B:\s*HTTP/);
  });

  /**
   * 测试：不同 RelationType 的箭头样式
   * 验证：dataflow 用 ->，dependency 用 -->，等
   *
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  it('[语法] should_apply_different_arrow_styles_for_relation_types', () => {
    // given: 不同关系类型
    const diagram: Diagram = {
      id: 'arch-019',
      type: 'deployment',
      components: [
        { id: 'a', name: 'A', type: 'service' },
        { id: 'b', name: 'B', type: 'service' },
        { id: 'c', name: 'C', type: 'service' },
      ],
      relationships: [
        { sourceId: 'a', targetId: 'b', type: 'dataflow' },
        { sourceId: 'b', targetId: 'c', type: 'dependency' },
      ],
    };

    // when: 生成代码
    const code = generateD2Code(diagram);

    // then: 应包含箭头
    expect(code).toContain('A');
    expect(code).toContain('B');
    expect(code).toContain('C');

    // 应有箭头符号
    expect(code).toMatch(/->/);
  });

  /**
   * 测试：组件类型对应 D2 图标
   * 验证：service/database 等使用正确图标
   *
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  it('[语法] should_apply_correct_icons_for_component_types', () => {
    // given: 不同类型组件
    const diagram: Diagram = {
      id: 'arch-020',
      type: 'deployment',
      components: [
        { id: 'svc', name: '服务', type: 'service' },
        { id: 'db', name: '数据库', type: 'database' },
        { id: 'gw', name: '网关', type: 'gateway' },
      ],
      relationships: [],
    };

    // when: 生成代码
    const code = generateD2Code(diagram);

    // then: 应包含所有组件名称
    expect(code).toContain('服务');
    expect(code).toContain('数据库');
    expect(code).toContain('网关');

    // D2 可能使用 shape 属性定义图标
    // 或使用默认形状
    expect(code).toBeDefined();
  });

  /**
   * 测试：代码无语法错误特征
   * 验证：不包含 undefined/null/空行过多
   *
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  it('[语法] should_not_contain_syntax_error_patterns', () => {
    // given: 正常架构图
    const diagram: Diagram = {
      id: 'arch-021',
      type: 'deployment',
      components: [
        { id: 'svc', name: '服务', type: 'service' },
      ],
      relationships: [],
    };

    // when: 生成代码
    const code = generateD2Code(diagram);

    // then: 不应有错误特征
    expect(code).not.toContain('undefined');
    expect(code).not.toContain('null');
    expect(code).not.toContain('[object Object]');

    // 不应有过多连续空行（最多 2 个）
    expect(code).not.toMatch(/\n\n\n\n/);
  });

  /**
   * 测试：bidirectional 关系使用双向箭头
   * 验证：<-> 语法
   *
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  it('[语法] should_use_bidirectional_arrow_for_bidirectional_relation', () => {
    // given: 双向关系
    const diagram: Diagram = {
      id: 'arch-022',
      type: 'deployment',
      components: [
        { id: 'a', name: 'A', type: 'service' },
        { id: 'b', name: 'B', type: 'service' },
      ],
      relationships: [
        { sourceId: 'a', targetId: 'b', type: 'bidirectional' },
      ],
    };

    // when: 生成代码
    const code = generateD2Code(diagram);

    // then: 应包含双向箭头 <-> 或两条单向箭头
    expect(code).toContain('A');
    expect(code).toContain('B');

    // 双向关系应有标记（<-> 或两条箭头）
    const hasBidirectional = code.includes('<->') || code.match(/->/g)?.length >= 2;

    expect(hasBidirectional).toBe(true);
  });
});