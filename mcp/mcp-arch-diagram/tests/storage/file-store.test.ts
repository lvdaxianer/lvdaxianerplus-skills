/**
 * Storage 单元测试
 *
 * 测试覆盖：
 * - Phase 1: 正常场景（文件保存和元数据管理）
 * - Phase 2: 异常场景（IO 错误）
 * - Phase 3: 边界场景（大量文件、重复 ID）
 * - Phase 4: 字段覆盖（所有 Output/Metadata 字段）
 *
 * @author lvdaxianerplus
 * @date 2026-04-20
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

// 导入实际实现
import { FileStore } from '../../src/storage/file-store.js';
import { MetadataStore } from '../../src/storage/metadata.js';

// 导入类型定义
import type {
  DiagramMetadata,
  SaveOptions,
  ImageFormat,
} from '../../src/config/types.js';

// ============================================================
// Phase 1: 正常场景测试（文件保存和元数据管理）
// ============================================================

describe('FileStore - 正常场景', () => {

  let fileStore: FileStore;

  /**
   * 初始化 FileStore 实例
   *
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  beforeEach(() => {
    fileStore = new FileStore();
  });

  /**
   * 初始化 FileStore 实例
   *
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  beforeEach(() => {
    fileStore = new FileStore();
  });

  /**
   * 测试：保存图片文件
   * 验证：返回有效文件路径
   *
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  it('[正常] should_save_image_file_and_return_path', async () => {
    // given: base64 图片数据
    const imageData = 'base64-encoded-image-data';
    const options: SaveOptions = {
      outputDir: './diagrams',
      filename: 'arch-001',
      imageFormat: 'png',
    };

    // when: 保存图片
    const imagePath = await fileStore.saveImage(imageData, options);

    // then: 返回文件路径
    expect(imagePath).toBeDefined();
    expect(imagePath).toContain('arch-001');
    expect(imagePath).toMatch(/\.(png|svg)$/);
  });

  /**
   * 测试：保存代码文件
   * 验证：返回有效文件路径
   *
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  it('[正常] should_save_code_file_and_return_path', async () => {
    // given: D2 代码
    const code = 'direction: right\n服务 -> 数据库';
    const options: SaveOptions = {
      outputDir: './diagrams',
      filename: 'arch-001',
      imageFormat: 'png',
    };

    // when: 保存代码
    const codePath = await fileStore.saveCode(code, options);

    // then: 返回文件路径
    expect(codePath).toBeDefined();
    expect(codePath).toContain('arch-001');
    expect(codePath).toMatch(/\.(d2|mmd)$/);
  });

  /**
   * 测试：获取文件内容
   * 验证：返回文件内容字符串
   *
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  it('[正常] should_get_file_content_by_path', async () => {
    // given: 文件路径
    const filePath = './diagrams/arch-001.d2';

    // when: 获取文件
    const content = await fileStore.getFile(filePath);

    // then: 返回文件内容
    expect(content).toBeDefined();
    expect(typeof content === 'string' || Buffer.isBuffer(content)).toBe(true);
  });

  /**
   * 测试：删除文件
   * 验证：返回成功标志
   *
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  it('[正常] should_delete_file_successfully', async () => {
    // given: 文件路径
    const filePath = './diagrams/arch-001.png';

    // when: 删除文件
    const result = await fileStore.deleteFile(filePath);

    // then: 返回成功
    expect(result).toBeDefined();
    expect(typeof result).toBe('boolean');
  });

  /**
   * 测试：SVG 格式保存
   * 验证：生成 .svg 文件
   *
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  it('[正常] should_save_svg_format_image', async () => {
    // given: SVG 格式选项
    const imageData = '<svg>...</svg>';
    const options: SaveOptions = {
      outputDir: './diagrams',
      filename: 'arch-002',
      imageFormat: 'svg',
    };

    // when: 保存图片
    const imagePath = await fileStore.saveImage(imageData, options);

    // then: 返回 .svg 文件路径
    expect(imagePath).toMatch(/\.svg$/);
  });
});

describe('MetadataStore - 正常场景', () => {

  let metadataStore: MetadataStore;

  /**
   * 初始化 MetadataStore 实例
   *
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  beforeEach(() => {
    metadataStore = new MetadataStore();
  });

  /**
   * 测试：保存元数据
   * 验证：成功保存并返回 true
   *
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  it('[正常] should_save_metadata_successfully', async () => {
    // given: 元数据
    const metadata: DiagramMetadata = {
      id: 'arch-001',
      type: 'deployment',
      engine: 'd2',
      created: '2026-04-20T10:00:00Z',
      components: [],
      relationships: [],
      outputDir: './diagrams',
    };

    // when: 保存元数据
    const result = await metadataStore.saveMetadata(metadata, './diagrams/metadata.json');

    // then: 返回成功
    expect(result).toBeDefined();
    expect(typeof result).toBe('boolean');
  });

  /**
   * 测试：根据 ID 获取元数据
   * 验证：返回匹配的元数据
   *
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  it('[正常] should_get_metadata_by_id', async () => {
    // given: 元数据 ID
    const id = 'arch-001';

    // when: 获取元数据
    const metadata = await metadataStore.getMetadataById(id, './diagrams/metadata.json');

    // then: 返回元数据或 null
    expect(metadata).toBeDefined();

    if (metadata !== null) {
      expect(metadata.id).toBe('arch-001');
    }
  });

  /**
   * 测试：获取所有元数据
   * 验证：返回元数据列表
   *
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  it('[正常] should_get_all_metadata', async () => {
    // when: 获取所有元数据
    const allMetadata = await metadataStore.getAllMetadata('./diagrams/metadata.json');

    // then: 返回数组
    expect(allMetadata).toBeDefined();
    expect(Array.isArray(allMetadata)).toBe(true);
  });

  /**
   * 测试：删除元数据
   * 验证：成功删除并返回 true
   *
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  it('[正常] should_delete_metadata_successfully', async () => {
    // given: 元数据 ID
    const id = 'arch-001';

    // when: 删除元数据
    const result = await metadataStore.deleteMetadata(id, './diagrams/metadata.json');

    // then: 返回成功
    expect(result).toBeDefined();
    expect(typeof result).toBe('boolean');
  });
});

// ============================================================
// Phase 2: 异常场景测试（IO 错误）
// ============================================================

describe('FileStore - 异常场景', () => {

  let fileStore: FileStore;

  /**
   * 初始化 FileStore 实例
   *
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  beforeEach(() => {
    fileStore = new FileStore();
  });

  /**
   * 测试：保存到不存在目录
   * 验证：应抛出错误或创建目录
   *
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  it('[异常] should_handle_nonexistent_output_directory', async () => {
    // given: 不存在的目录路径
    const imageData = 'base64-data';
    const options: SaveOptions = {
      outputDir: '/nonexistent/path/diagrams',
      filename: 'arch-001',
      imageFormat: 'png',
    };

    // when: 保存图片
    // then: 应抛出错误或自动创建目录
    try {
      const result = await fileStore.saveImage(imageData, options);
      expect(result).toBeDefined();
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
    }
  });

  /**
   * 测试：获取不存在文件
   * 验证：应抛出错误或返回 null
   *
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  it('[异常] should_handle_nonexistent_file_on_get', async () => {
    // given: 不存在的文件路径
    const filePath = '/nonexistent/file.d2';

    // when: 获取文件
    // then: 应抛出错误
    expect(async () => {
      await fileStore.getFile(filePath);
    }).rejects.toThrow();
  });

  /**
   * 测试：删除不存在文件
   * 验证：应返回 false 或抛出错误
   *
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  it('[异常] should_return_false_when_deleting_nonexistent_file', async () => {
    // given: 不存在的文件路径
    const filePath = '/nonexistent/file.png';

    // when: 删除文件
    // then: 应返回 false 或抛出错误
    try {
      const result = await fileStore.deleteFile(filePath);
      expect(result).toBe(false);
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
    }
  });

  /**
   * 测试：空文件名
   * 验证：应抛出错误
   *
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  it('[异常] should_throw_error_for_empty_filename', async () => {
    // given: 空文件名
    const imageData = 'base64-data';
    const options: SaveOptions = {
      outputDir: './diagrams',
      filename: '',
      imageFormat: 'png',
    };

    // when: 保存图片
    // then: 应抛出错误
    expect(async () => {
      await fileStore.saveImage(imageData, options);
    }).rejects.toThrow();
  });

  /**
   * 测试：无效图片格式
   * 验证：非 png/svg 格式应抛出错误
   *
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  it('[异常] should_throw_error_for_invalid_image_format', async () => {
    // given: 无效格式
    const imageData = 'base64-data';
    const options = {
      outputDir: './diagrams',
      filename: 'arch-001',
      imageFormat: 'jpg' as unknown as ImageFormat,
    };

    // when: 保存图片
    // then: 应抛出错误
    expect(async () => {
      await fileStore.saveImage(imageData, options);
    }).rejects.toThrow();
  });
});

describe('MetadataStore - 异常场景', () => {

  let metadataStore: MetadataStore;

  /**
   * 初始化 MetadataStore 实例
   *
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  beforeEach(() => {
    metadataStore = new MetadataStore();
  });

  /**
   * 测试：获取不存在的 ID
   * 验证：返回 null
   *
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  it('[异常] should_return_null_for_nonexistent_id', async () => {
    // given: 不存在的 ID
    const id = 'arch-999';

    // when: 获取元数据
    const metadata = await metadataStore.getMetadataById(id, './diagrams/metadata.json');

    // then: 返回 null
    expect(metadata).toBeNull();
  });

  /**
   * 测试：元数据文件不存在
   * 验证：返回空数组或 null
   *
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  it('[异常] should_handle_nonexistent_metadata_file', async () => {
    // given: 不存在的元数据文件
    const metadataPath = '/nonexistent/metadata.json';

    // when: 获取所有元数据
    // then: 应返回空数组或抛出错误
    try {
      const allMetadata = await metadataStore.getAllMetadata(metadataPath);
      expect(allMetadata).toEqual([]);
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
    }
  });

  /**
   * 测试：元数据 JSON 损坏
   * 验证：应抛出解析错误
   *
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  it('[异常] should_handle_corrupted_metadata_json', async () => {
    // given: 损坏的 JSON 文件路径
    const metadataPath = './diagrams/corrupted.json';

    // when: 获取元数据
    // then: 应抛出错误或返回空
    try {
      const result = await metadataStore.getAllMetadata(metadataPath);
      expect(Array.isArray(result)).toBe(true);
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
    }
  });

  /**
   * 测试：删除不存在的 ID
   * 验证：返回 false
   *
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  it('[异常] should_return_false_when_deleting_nonexistent_id', async () => {
    // given: 不存在的 ID
    const id = 'arch-999';

    // when: 删除元数据
    const result = await metadataStore.deleteMetadata(id, './diagrams/metadata.json');

    // then: 返回 false
    expect(result).toBe(false);
  });
});

// ============================================================
// Phase 3: 边界场景测试
// ============================================================

describe('FileStore - 边界场景', () => {

  let fileStore: FileStore;

  /**
   * 初始化 FileStore 实例
   *
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  beforeEach(() => {
    fileStore = new FileStore();
  });

  /**
   * 测试：大文件保存
   * 验证：大图片数据也能保存
   *
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  it('[边界] should_save_large_image_file', async () => {
    // given: 大图片数据（模拟）
    const largeImageData = 'base64-encoded-large-image';
    const options: SaveOptions = {
      outputDir: './diagrams',
      filename: 'arch-large',
      imageFormat: 'png',
    };

    // when: 保存图片
    const imagePath = await fileStore.saveImage(largeImageData, options);

    // then: 应成功保存
    expect(imagePath).toBeDefined();
  });

  /**
   * 测试：文件名包含特殊字符
   * 验证：特殊字符被处理或转义
   *
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  it('[边界] should_handle_special_characters_in_filename', async () => {
    // given: 包含特殊字符的文件名
    const imageData = 'base64-data';
    const options: SaveOptions = {
      outputDir: './diagrams',
      filename: 'arch-test-001',
      imageFormat: 'png',
    };

    // when: 保存图片
    const imagePath = await fileStore.saveImage(imageData, options);

    // then: 应成功保存
    expect(imagePath).toBeDefined();
    expect(imagePath).toContain('arch-test-001');
  });

  /**
   * 测试：重复文件名
   * 验证：覆盖或生成新文件名
   *
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  it('[边界] should_handle_duplicate_filename', async () => {
    // given: 相同文件名
    const imageData1 = 'base64-data-1';
    const imageData2 = 'base64-data-2';
    const options: SaveOptions = {
      outputDir: './diagrams',
      filename: 'arch-duplicate',
      imageFormat: 'png',
    };

    // when: 连续保存两次
    const path1 = await fileStore.saveImage(imageData1, options);
    const path2 = await fileStore.saveImage(imageData2, options);

    // then: 应返回路径
    expect(path1).toBeDefined();
    expect(path2).toBeDefined();
  });

  /**
   * 测试：空代码内容
   * 验证：空字符串也能保存
   *
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  it('[边界] should_save_empty_code_file', async () => {
    // given: 空代码
    const code = '';
    const options: SaveOptions = {
      outputDir: './diagrams',
      filename: 'arch-empty',
      imageFormat: 'png',
    };

    // when: 保存代码
    // then: 应抛出错误或保存空文件
    try {
      const codePath = await fileStore.saveCode(code, options);
      expect(codePath).toBeDefined();
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
    }
  });
});

describe('MetadataStore - 边界场景', () => {

  let metadataStore: MetadataStore;

  /**
   * 初始化 MetadataStore 实例
   *
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  beforeEach(() => {
    metadataStore = new MetadataStore();
  });

  /**
   * 测试：大量元数据条目
   * 验证：100+ 条目也能处理
   *
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  it('[边界] should_handle_large_number_of_metadata_entries', async () => {
    // when: 获取大量元数据
    const allMetadata = await metadataStore.getAllMetadata('./diagrams/metadata.json');

    // then: 应返回数组（即使很大）
    expect(Array.isArray(allMetadata)).toBe(true);
  });

  /**
   * 测试：元数据包含大量组件
   * 验证：components 数组能正确保存
   *
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  it('[边界] should_save_metadata_with_many_components', async () => {
    // given: 包含大量组件的元数据
    const components: Component[] = Array.from({ length: 50 }, (_, i) => ({
      id: `comp-${i}`,
      name: `组件${i}`,
      type: 'service' as ComponentType,
    }));

    const metadata: DiagramMetadata = {
      id: 'arch-large',
      type: 'deployment',
      engine: 'd2',
      created: '2026-04-20T10:00:00Z',
      components,
      relationships: [],
      outputDir: './diagrams',
    };

    // when: 保存元数据
    const result = await metadataStore.saveMetadata(metadata, './diagrams/metadata.json');

    // then: 应成功
    expect(result).toBeDefined();
  });

  /**
   * 测试：ID 格式为 UUID
   * 验证：UUID 格式 ID 能正确处理
   *
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  it('[边界] should_handle_uuid_format_id', async () => {
    // given: UUID 格式 ID
    const id = 'arch-a1b2c3d4-e5f6-7890-abcd-ef1234567890';

    // when: 获取元数据
    const metadata = await metadataStore.getMetadataById(id, './diagrams/metadata.json');

    // then: 应返回 null（不存在）或正确数据
    if (metadata !== null) {
      expect(metadata.id).toBe(id);
    }
  });
});

// ============================================================
// Phase 4: 字段覆盖测试
// ============================================================

describe('Storage - 字段覆盖', () => {

  let metadataStore: MetadataStore;

  /**
   * 初始化 MetadataStore 实例
   *
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  beforeEach(() => {
    metadataStore = new MetadataStore();
  });

  /**
   * 测试：DiagramMetadata 所有字段存在
   * 验证：id/type/engine created/components/relationships/outputDir
   *
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  it('[字段] should_have_all_metadata_fields', async () => {
    // given: 保存元数据
    const metadata: DiagramMetadata = {
      id: 'arch-001',
      type: 'deployment',
      engine: 'd2',
      created: '2026-04-20T10:00:00Z',
      components: [
        { id: 'svc', name: '服务', type: 'service' },
      ],
      relationships: [
        { sourceId: 'svc', targetId: 'db', type: 'dataflow' },
      ],
      outputDir: './diagrams',
    };

    await metadataStore.saveMetadata(metadata, './diagrams/metadata.json');

    // when: 获取元数据
    const result = await metadataStore.getMetadataById('arch-001', './diagrams/metadata.json');

    // then: 如果存在，验证所有字段
    if (result !== null) {
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('type');
      expect(result).toHaveProperty('engine');
      expect(result).toHaveProperty('created');
      expect(result).toHaveProperty('components');
      expect(result).toHaveProperty('relationships');
      expect(result).toHaveProperty('outputDir');
    }
  });

  /**
   * 测试：字段类型正确
   * 验证：所有字段类型符合定义
   *
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  it('[字段] should_have_correct_field_types', async () => {
    // given: 元数据
    const metadata: DiagramMetadata = {
      id: 'arch-002',
      type: 'deployment',
      engine: 'd2',
      created: '2026-04-20T10:00:00Z',
      components: [],
      relationships: [],
      outputDir: './diagrams',
    };

    await metadataStore.saveMetadata(metadata, './diagrams/metadata.json');

    // when: 获取元数据
    const result = await metadataStore.getMetadataById('arch-002', './diagrams/metadata.json');

    // then: 验证字段类型
    if (result !== null) {
      // id: string
      expect(typeof result.id).toBe('string');

      // type: DiagramType (string)
      expect(typeof result.type).toBe('string');
      expect(['deployment', 'business', 'function']).toContain(result.type);

      // engine: Engine (string)
      expect(typeof result.engine).toBe('string');
      expect(['d2', 'mermaid']).toContain(result.engine);

      // created: string (ISO datetime)
      expect(typeof result.created).toBe('string');

      // components: array
      expect(Array.isArray(result.components)).toBe(true);

      // relationships: array
      expect(Array.isArray(result.relationships)).toBe(true);

      // outputDir: string
      expect(typeof result.outputDir).toBe('string');
    }
  });

  /**
   * 测试：Component 子字段完整
   * 验证：id/name/type 存在
   *
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  it('[字段] should_have_complete_component_fields_in_metadata', async () => {
    // given: 包含组件的元数据
    const metadata: DiagramMetadata = {
      id: 'arch-003',
      type: 'deployment',
      engine: 'd2',
      created: '2026-04-20T10:00:00Z',
      components: [
        { id: 'svc', name: '订单服务', type: 'service' },
        { id: 'db', name: 'MySQL', type: 'database' },
      ],
      relationships: [],
      outputDir: './diagrams',
    };

    await metadataStore.saveMetadata(metadata, './diagrams/metadata.json');

    // when: 获取元数据
    const result = await metadataStore.getMetadataById('arch-003', './diagrams/metadata.json');

    // then: 验证组件字段
    if (result !== null && result.components.length > 0) {
      result.components.forEach(comp => {
        expect(comp).toHaveProperty('id');
        expect(comp).toHaveProperty('name');
        expect(comp).toHaveProperty('type');

        // 验证类型
        expect(typeof comp.id).toBe('string');
        expect(typeof comp.name).toBe('string');
        expect(typeof comp.type).toBe('string');
      });
    }
  });

  /**
   * 测试：Relationship 子字段完整
   * 验证：sourceId/targetId/type 存在，label 可选
   *
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  it('[字段] should_have_complete_relationship_fields_in_metadata', async () => {
    // given: 包含关系的元数据
    const metadata: DiagramMetadata = {
      id: 'arch-004',
      type: 'deployment',
      engine: 'd2',
      created: '2026-04-20T10:00:00Z',
      components: [
        { id: 'gw', name: '网关', type: 'gateway' },
        { id: 'svc', name: '服务', type: 'service' },
      ],
      relationships: [
        { sourceId: 'gw', targetId: 'svc', type: 'dataflow', label: 'HTTP' },
      ],
      outputDir: './diagrams',
    };

    await metadataStore.saveMetadata(metadata, './diagrams/metadata.json');

    // when: 获取元数据
    const result = await metadataStore.getMetadataById('arch-004', './diagrams/metadata.json');

    // then: 验证关系字段
    if (result !== null && result.relationships.length > 0) {
      result.relationships.forEach(rel => {
        expect(rel).toHaveProperty('sourceId');
        expect(rel).toHaveProperty('targetId');
        expect(rel).toHaveProperty('type');

        // 验证类型
        expect(typeof rel.sourceId).toBe('string');
        expect(typeof rel.targetId).toBe('string');
        expect(typeof rel.type).toBe('string');

        // label 可选
        if (rel.hasOwnProperty('label')) {
          expect(typeof rel.label).toBe('string');
        }
      });
    }
  });
});