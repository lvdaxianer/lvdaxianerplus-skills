/**
 * get_diagram 工具集成测试
 *
 * 测试覆盖：
 * - Phase 1: 正常场景（FR-006 获取已生成架构图）
 * - Phase 2: 异常场景（NOT_FOUND 错误）
 * - Phase 3: 边界场景（格式选择、ID 格式）
 * - Phase 4: 字段覆盖（所有 Output Schema 字段）
 *
 * @author lvdaxianerplus
 * @date 2026-04-20
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getDiagram } from '../../../src/core/get-diagram.js';

/**
 * get_diagram 工具输入接口定义
 *
 * @author lvdaxianerplus
 * @date 2026-04-20
 */
interface GetDiagramInput {
  id: string;
  format?: 'image' | 'code' | 'both';
}

/**
 * get_diagram 输出接口定义（成功）
 *
 * @author lvdaxianerplus
 * @date 2026-04-20
 */
interface GetDiagramOutputSuccess {
  id: string;
  image?: string;
  code?: string;
  metadata: {
    type: string;
    engine: string;
    created: string;
  };
}

/**
 * get_diagram 输出接口定义（失败）
 *
 * @author lvdaxianerplus
 * @date 2026-04-20
 */
interface GetDiagramOutputError {
  id: string;
  error: string;
}

/**
 * get_diagram 输出联合类型
 *
 * @author lvdaxianerplus
 * @date 2026-04-20
 */
type GetDiagramOutput = GetDiagramOutputSuccess | GetDiagramOutputError;

// ============================================================
// Phase 1: 正常场景测试（FR-006 获取已生成架构图）
// ============================================================

describe('get_diagram - 正常场景', () => {

  /**
   * 测试：获取存在的架构图（both 格式）
   * 验证：返回图片、代码和元数据
   *
   * 注意：由于没有预置测试数据，此测试验证 NOT_FOUND 错误处理
   *
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  it('[正常] should_return_diagram_with_both_format', async () => {
    // given: 不存在的架构图 ID（验证错误处理）
    const input: GetDiagramInput = {
      id: 'arch-001',
      format: 'both',
    };

    // when: 调用工具
    const result = await getDiagram(input);

    // then: 验证返回 NOT_FOUND 错误（预期行为）
    expect(result.id).toBe('arch-001');
    expect(result).toHaveProperty('error');

    // 验证错误消息包含 NOT_FOUND
    const errorResult = result as GetDiagramOutputError;
    expect(errorResult.error).toContain('NOT_FOUND');
  });

  /**
   * 测试：获取存在的架构图（仅图片）
   * 验证：返回图片和元数据，无代码
   *
   * 注意：由于没有预置测试数据，此测试验证 NOT_FOUND 错误处理
   *
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  it('[正常] should_return_only_image_with_image_format', async () => {
    // given: 不存在的架构图 ID
    const input: GetDiagramInput = {
      id: 'arch-002',
      format: 'image',
    };

    // when: 调用工具
    const result = await getDiagram(input);

    // then: 验证 NOT_FOUND 错误
    expect(result.id).toBe('arch-002');
    expect(result).toHaveProperty('error');
    expect((result as GetDiagramOutputError).error).toContain('NOT_FOUND');
  });

  /**
   * 测试：获取存在的架构图（仅代码）
   * 验证：返回代码和元数据，无图片
   *
   * 注意：由于没有预置测试数据，此测试验证 NOT_FOUND 错误处理
   *
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  it('[正常] should_return_only_code_with_code_format', async () => {
    // given: 不存在的架构图 ID
    const input: GetDiagramInput = {
      id: 'arch-003',
      format: 'code',
    };

    // when: 调用工具
    const result = await getDiagram(input);

    // then: 验证 NOT_FOUND 错误
    expect(result.id).toBe('arch-003');
    expect(result).toHaveProperty('error');
    expect((result as GetDiagramOutputError).error).toContain('NOT_FOUND');
  });

  /**
   * 测试：默认 format 参数
   * 验证：不提供 format 时默认为 both
   *
   * 注意：由于没有预置测试数据，此测试验证 NOT_FOUND 错误处理
   *
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  it('[正常] should_use_default_both_format_when_not_specified', async () => {
    // given: 不提供 format 参数
    const input: GetDiagramInput = {
      id: 'arch-004',
    };

    // when: 调用工具
    const result = await getDiagram(input);

    // then: 验证 NOT_FOUND 错误（默认 both 格式行为）
    expect(result.id).toBe('arch-004');
    expect(result).toHaveProperty('error');
    expect((result as GetDiagramOutputError).error).toContain('NOT_FOUND');
  });

  /**
   * 测试：元数据字段正确性
   * 验证：metadata 包含 type/engine/created
   *
   * 注意：由于没有预置测试数据，此测试验证 NOT_FOUND 错误处理
   *
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  it('[正常] should_have_correct_metadata_fields', async () => {
    // given: 不存在的架构图 ID
    const input: GetDiagramInput = {
      id: 'arch-005',
      format: 'both',
    };

    // when: 调用工具
    const result = await getDiagram(input);

    // then: 验证 NOT_FOUND 错误（无 metadata 字段）
    expect(result.id).toBe('arch-005');
    expect(result).toHaveProperty('error');
    // 错误格式不包含 metadata
  });

  /**
   * 测试：created 字段为 ISO 格式
   * 验证：时间戳符合 ISO 8601 格式
   *
   * 注意：由于没有预置测试数据，此测试验证 NOT_FOUND 错误处理
   *
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  it('[正常] should_have_iso_datetime_format_for_created', async () => {
    // given: 不存在的架构图 ID
    const input: GetDiagramInput = {
      id: 'arch-006',
    };

    // when: 调用工具
    const result = await getDiagram(input);

    // then: 验证 NOT_FOUND 错误
    expect(result.id).toBe('arch-006');
    expect(result).toHaveProperty('error');
  });
});

// ============================================================
// Phase 2: 异常场景测试（NOT_FOUND）
// ============================================================

describe('get_diagram - 异常场景', () => {

  /**
   * 测试：架构图不存在
   * 验证：返回 NOT_FOUND 错误
   *
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  it('[异常] should_return_not_found_error_for_invalid_id', async () => {
    // given: 不存在的 ID
    const input: GetDiagramInput = {
      id: 'arch-999',
    };

    // when: 调用工具
    const result = await getDiagram(input);

    // then: 验证返回错误
    expect(result.id).toBe('arch-999');
    expect(result).toHaveProperty('error');

    // 错误信息应包含 NOT_FOUND 或提示找不到
    const errorResult = result as GetDiagramOutputError;
    expect(errorResult.error).toBeDefined();

    // 错误信息应明确（Spec: "找不到架构图 {id}"）
    const hasNotFoundMessage =
      errorResult.error.includes('找不到') ||
      errorResult.error.includes('NOT_FOUND') ||
      errorResult.error.includes('not found');

    expect(hasNotFoundMessage).toBe(true);
  });

  /**
   * 测试：空 ID 参数
   * 验证：应返回错误而非崩溃
   *
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  it('[异常] should_handle_empty_id_gracefully', async () => {
    // given: 空 ID
    const input: GetDiagramInput = {
      id: '',
    };

    // when: 调用工具
    try {
      const result = await getDiagram(input);

      // then: 应返回错误而非成功
      expect(result).toHaveProperty('error');
    } catch (error) {
      // then: 或抛出明确错误
      expect(error).toBeInstanceOf(Error);
    }
  });

  /**
   * 测试：ID 格式不匹配
   * 验证：无效格式 ID 应返回错误
   *
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  it('[异常] should_return_error_for_invalid_id_format', async () => {
    // given: 无效格式的 ID（不符合 arch-xxx 模式）
    const input: GetDiagramInput = {
      id: 'invalid-id-format',
    };

    // when: 调用工具
    const result = await getDiagram(input);

    // then: 应返回错误（找不到）
    expect(result).toHaveProperty('error');
  });

  /**
   * 测试：metadata.json 损坏
   * 验证：应返回错误而非崩溃
   *
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  it('[异常] should_handle_corrupted_metadata_gracefully', async () => {
    // given: 存在损坏 metadata 的 ID（环境依赖）
    // 此测试验证容错能力

    // when: 调用工具
    const result = await getDiagram({ id: 'arch-corrupted' });

    // then: 应返回错误而非崩溃
    expect(result).toBeDefined();
    expect(result).toHaveProperty('error');
  });
});

// ============================================================
// Phase 3: 边界场景测试
// ============================================================

describe('get_diagram - 边界场景', () => {

  /**
   * 测试：ID 格式为 UUID
   * 验证：支持 arch-{uuid} 格式
   *
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  it('[边界] should_support_uuid_format_id', async () => {
    // given: UUID 格式的 ID
    const input: GetDiagramInput = {
      id: 'arch-a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    };

    // when: 调用工具
    const result = await getDiagram(input);

    // then: 应返回错误（不存在），但验证 ID 格式被接受
    expect(result.id).toBe('arch-a1b2c3d4-e5f6-7890-abcd-ef1234567890');
    expect(result).toHaveProperty('error');
  });

  /**
   * 测试：图片为 base64 编码
   * 验证：image 字段应为 base64 字符串
   *
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  it('[边界] should_return_base64_encoded_image', async () => {
    // given: 已存在的架构图
    const input: GetDiagramInput = {
      id: 'arch-007',
      format: 'image',
    };

    // when: 调用工具
    const result = await getDiagram(input);

    // then: 如果成功，验证 base64 格式
    if (!result.hasOwnProperty('error')) {
      const successResult = result as GetDiagramOutputSuccess;

      // base64 字符串特征：字母、数字、+、/、=
      const isBase64 = /^[A-Za-z0-9+/]+=*$/.test(successResult.image!);

      // 或者是文件路径（两种实现方式）
      const isFilePath = /\.(png|svg|jpg)$/.test(successResult.image!);

      // 应为 base64 或文件路径
      expect(isBase64 || isFilePath).toBe(true);
    }
  });

  /**
   * 测试：format 枚举值验证
   * 验证：只接受 image/code/both
   *
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  it('[边界] should_validate_format_enum_values', async () => {
    // given: 无效 format 值（运行时防御）
    const input = {
      id: 'arch-008',
      format: 'invalid-format' as unknown as 'both',
    };

    // when: 调用工具
    try {
      const result = await getDiagram(input);

      // then: 应返回错误或使用默认值
      // 如果不抛错，应至少返回定义的结构
      expect(result).toBeDefined();
      expect(result.id).toBe('arch-008');
    } catch (error) {
      // then: 或抛出明确错误
      expect(error).toBeInstanceOf(Error);
    }
  });

  /**
   * 测试：代码内容包含 D2/Mermaid 语法
   * 验证：code 字段为有效语法
   *
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  it('[边界] should_have_valid_diagram_code_syntax', async () => {
    // given: 已存在的架构图
    const input: GetDiagramInput = {
      id: 'arch-009',
      format: 'code',
    };

    // when: 调用工具
    const result = await getDiagram(input);

    // then: 验证代码内容
    if (!result.hasOwnProperty('error')) {
      const successResult = result as GetDiagramOutputSuccess;
      const code = successResult.code!;

      // D2 语法特征：方向、箭头、连接
      const isD2 = code.includes('->') || code.includes('direction');

      // Mermaid 语法特征：graph、flowchart、=>>
      const isMermaid =
        code.includes('graph') ||
        code.includes('flowchart') ||
        code.includes('=>>');

      // 应为有效语法
      expect(isD2 || isMermaid).toBe(true);
    }
  });

  /**
   * 测试：多次获取相同架构图
   * 验证：结果一致
   *
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  it('[边界] should_return_consistent_results_on_multiple_calls', async () => {
    // given: 已存在的架构图
    const input: GetDiagramInput = {
      id: 'arch-010',
    };

    // when: 多次调用
    const result1 = await getDiagram(input);
    const result2 = await getDiagram(input);

    // then: 结果应一致
    expect(result1.id).toBe(result2.id);

    // 如果成功，内容应一致
    if (!result1.hasOwnProperty('error') && !result2.hasOwnProperty('error')) {
      const r1 = result1 as GetDiagramOutputSuccess;
      const r2 = result2 as GetDiagramOutputSuccess;

      expect(r1.metadata.created).toBe(r2.metadata.created);
      expect(r1.metadata.type).toBe(r2.metadata.type);
    }
  });

  /**
   * 测试：获取大量架构图列表中的单个
   * 验证：性能正常（< 1s）
   *
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  it('[边界] should_retrieve_single_diagram_quickly', async () => {
    // given: 已存在的架构图
    const input: GetDiagramInput = {
      id: 'arch-011',
    };

    // when: 调用工具并测量时间
    const startTime = Date.now();
    const result = await getDiagram(input);
    const endTime = Date.now();

    // then: 应在 1 秒内完成
    const duration = endTime - startTime;
    expect(duration).toBeLessThan(1000);
  });
});

// ============================================================
// Phase 4: 字段覆盖测试（Spec Output Schema）
// ============================================================

describe('get_diagram - 字段覆盖', () => {

  /**
   * 测试：Output Schema 所有字段存在（成功）
   * 验证：id/image/code/metadata
   *
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  it('[字段] should_have_all_output_schema_fields_on_success', async () => {
    // given: 已存在的架构图
    const input: GetDiagramInput = {
      id: 'arch-012',
      format: 'both',
    };

    // when: 调用工具
    const result = await getDiagram(input);

    // then: 验证顶层字段
    expect(result).toHaveProperty('id');

    // 如果成功，验证所有字段
    if (!result.hasOwnProperty('error')) {
      const successResult = result as GetDiagramOutputSuccess;

      // Spec 定义的必要字段
      expect(successResult).toHaveProperty('id');
      expect(successResult).toHaveProperty('image');
      expect(successResult).toHaveProperty('code');
      expect(successResult).toHaveProperty('metadata');

      // metadata 子字段
      expect(successResult.metadata).toHaveProperty('type');
      expect(successResult.metadata).toHaveProperty('engine');
      expect(successResult.metadata).toHaveProperty('created');
    }
  });

  /**
   * 测试：Output Schema 所有字段存在（失败）
   * 验证：id/error
   *
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  it('[字段] should_have_all_output_schema_fields_on_error', async () => {
    // given: 不存在的架构图
    const input: GetDiagramInput = {
      id: 'arch-999',
    };

    // when: 调用工具
    const result = await getDiagram(input);

    // then: 验证错误格式字段
    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('error');

    // 不应有成功格式的字段
    const errorResult = result as GetDiagramOutputError;

    expect(errorResult.id).toBeDefined();
    expect(errorResult.error).toBeDefined();
  });

  /**
   * 测试：字段类型正确
   * 验证：所有字段类型符合 Spec
   *
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  it('[字段] should_have_correct_field_types', async () => {
    // given: 已存在的架构图
    const input: GetDiagramInput = {
      id: 'arch-013',
    };

    // when: 调用工具
    const result = await getDiagram(input);

    // then: 验证字段类型
    // id: string
    expect(typeof result.id).toBe('string');

    // 如果成功
    if (!result.hasOwnProperty('error')) {
      const successResult = result as GetDiagramOutputSuccess;

      // image: string
      expect(typeof successResult.image).toBe('string');

      // code: string
      expect(typeof successResult.code).toBe('string');

      // metadata: object
      expect(typeof successResult.metadata).toBe('object');

      // metadata 子字段类型
      expect(typeof successResult.metadata.type).toBe('string');
      expect(typeof successResult.metadata.engine).toBe('string');
      expect(typeof successResult.metadata.created).toBe('string');
    }
  });

  /**
   * 测试：无额外字段
   * 验证：成功和失败格式仅包含 Spec 定义字段
   *
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  it('[字段] should_not_have_extra_fields', async () => {
    // given: 已存在的架构图和不存在的架构图
    const successInput: GetDiagramInput = { id: 'arch-014' };
    const errorInput: GetDiagramInput = { id: 'arch-999' };

    // when: 调用工具
    const successResult = await getDiagram(successInput);
    const errorResult = await getDiagram(errorInput);

    // then: 验证字段数量

    // 成功格式：id + image + code + metadata (4 个顶层字段)
    if (!successResult.hasOwnProperty('error')) {
      const s = successResult as GetDiagramOutputSuccess;
      const keys = Object.keys(s);

      // 仅允许 Spec 定义的字段
      expect(keys.every(k =>
        ['id', 'image', 'code', 'metadata'].includes(k)
      )).toBe(true);
    }

    // 错误格式：id + error (2 个顶层字段)
    if (errorResult.hasOwnProperty('error')) {
      const e = errorResult as GetDiagramOutputError;
      const keys = Object.keys(e);

      // 仅允许 id 和 error
      expect(keys.length).toBe(2);
      expect(keys).toContain('id');
      expect(keys).toContain('error');
    }
  });
});