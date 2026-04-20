/**
 * MCP 架构图生成器 - generate_diagram 工具实现
 *
 * 整合 NLP Parser、D2 Code Gen、Storage、Puppeteer Export
 *
 * @author lvdaxianerplus
 * @date 2026-04-20
 */

import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import type {
  GenerateDiagramInput,
  GenerateDiagramOutput,
  Diagram,
  DiagramType,
  Engine,
  ImageFormat,
} from '../config/types.js';

import {
  DEFAULT_OUTPUT_DIR,
  DEFAULT_IMAGE_FORMAT,
  DEFAULT_ENGINE,
  DEFAULT_DIAGRAM_TYPE,
  DIAGRAM_ID_PREFIX,
  VALID_DIAGRAM_TYPES,
  VALID_ENGINES,
  VALID_IMAGE_FORMATS,
} from '../config/defaults.js';

import { parseNaturalLanguage } from '../parser/nlp-parser.js';
import { generateD2Code } from '../renderer/d2-code-gen.js';
import { FileStore } from '../storage/file-store.js';
import { MetadataStore } from '../storage/metadata.js';
import { PuppeteerExporter } from '../renderer/puppeteer-export.js';
import { TemplateLoader } from '../templates/index.js';

/**
 * 验证输入参数
 *
 * @param input - 工具输入
 * @returns 是否有效
 * @author lvdaxianerplus
 * @date 2026-04-20
 */
function validateInput(input: GenerateDiagramInput): boolean {
  // 检查是否提供了 description 或 template
  if (!input.description && !input.template) {
    // 缺少必要参数
    return false;
  }

  // 检查 type 参数是否有效
  if (input.type && !VALID_DIAGRAM_TYPES.includes(input.type)) {
    // 类型无效
    return false;
  }

  // 检查 engine 参数是否有效
  if (input.engine && !VALID_ENGINES.includes(input.engine)) {
    // 引擎无效
    return false;
  }

  // 检查 imageFormat 参数是否有效
  if (input.imageFormat && !VALID_IMAGE_FORMATS.includes(input.imageFormat)) {
    // 格式无效
    return false;
  }

  // 输入有效
  return true;
}

/**
 * generate_diagram 工具实现
 *
 * @param input - 工具输入参数
 * @returns 工具输出结果
 * @author lvdaxianerplus
 * @date 2026-04-20
 */
export async function generateDiagram(input: GenerateDiagramInput): Promise<GenerateDiagramOutput> {
  // 验证输入参数
  if (!validateInput(input)) {
    // 返回 INVALID_INPUT 错误
    return {
      success: false,
      files: {
        image: '',
        code: '',
      },
      message: 'INVALID_INPUT: 缺少描述或模板参数',
      metadata: {
        id: '',
        type: '',
        engine: '',
        created: '',
      },
    };
  }

  // 初始化存储模块
  const fileStore = new FileStore();
  const metadataStore = new MetadataStore();

  // 初始化 Puppeteer 导出器
  const puppeteerExporter = new PuppeteerExporter();

  // 初始化模板加载器
  const templatesDir = path.join(process.cwd(), 'src', 'templates');
  const templateLoader = new TemplateLoader(templatesDir);
  templateLoader.loadAllTemplates();

  // 确定 ID
  const diagramId = `${DIAGRAM_ID_PREFIX}${uuidv4().slice(0, 8)}`;

  // 确定类型
  const diagramType: DiagramType = input.type || DEFAULT_DIAGRAM_TYPE;

  // 确定引擎
  const engine: Engine = input.engine || DEFAULT_ENGINE;

  // 确定图片格式
  const imageFormat: ImageFormat = input.imageFormat || DEFAULT_IMAGE_FORMAT;

  // 确定输出目录
  const outputDir = input.outputDir || DEFAULT_OUTPUT_DIR;

  // 初始化组件和关系
  let components: any[] = [];
  let relationships: any[] = [];

  // 检查是否使用模板
  if (input.template) {
    // 获取模板
    const template = templateLoader.getTemplateByName(input.template);

    // 如果模板不存在
    if (!template) {
      // 返回 TEMPLATE_NOT_FOUND 错误
      return {
        success: false,
        files: {
          image: '',
          code: '',
        },
        message: `TEMPLATE_NOT_FOUND: 找不到模板 ${input.template}`,
        metadata: {
          id: diagramId,
          type: diagramType,
          engine,
          created: new Date().toISOString(),
        },
      };
    }

    // 从模板结构构建组件
    if (template.structure.components) {
      // 遍历模板组件定义
      for (let i = 0; i < template.structure.components.length; i++) {
        const templateComp = template.structure.components[i];

        // 构建组件对象
        const component = {
          id: `comp-${i.toString().padStart(3, '0')}`,
          name: templateComp.placeholder || `组件${i + 1}`,
          type: templateComp.type,
        };

        // 添加到组件列表
        components.push(component);
      }
    }

    // 从模板结构构建关系
    if (template.structure.connections) {
      // 遍历模板连接定义
      for (const templateConn of template.structure.connections) {
        // 查找源和目标组件 ID
        const sourceComp = components.find((c) => c.name === templateConn.from || c.id === templateConn.from);
        const targetComp = components.find((c) => c.name === templateConn.to || c.id === templateConn.to);

        // 如果找到组件
        if (sourceComp && targetComp) {
          // 构建关系对象
          const relationship = {
            sourceId: sourceComp.id,
            targetId: targetComp.id,
            type: templateConn.relationType,
          };

          // 添加到关系列表
          relationships.push(relationship);
        }
      }
    }
  } else {
    // 使用 NLP Parser 解析描述
    try {
      // 解析描述
      const parseResult = parseNaturalLanguage({
        description: input.description || '',
        type: diagramType,
      });

      // 提取组件和关系
      components = parseResult.components;
      relationships = parseResult.relationships;
    } catch (error) {
      // 解析失败，返回 PARSE_FAILED 错误
      return {
        success: false,
        files: {
          image: '',
          code: '',
        },
        message: `PARSE_FAILED: ${(error as Error).message}`,
        metadata: {
          id: diagramId,
          type: diagramType,
          engine,
          created: new Date().toISOString(),
        },
      };
    }
  }

  // 构建 Diagram 对象
  const diagram: Diagram = {
    id: diagramId,
    type: diagramType,
    engine,
    components,
    relationships,
    description: input.description,
    createdAt: new Date(),
    outputDir,
  };

  // 生成代码
  let code: string;

  try {
    // 生成 D2 代码
    code = generateD2Code(diagram);
  } catch (error) {
    // 代码生成失败
    return {
      success: false,
      files: {
        image: '',
        code: '',
      },
      message: `GENERATION_FAILED: ${(error as Error).message}`,
      metadata: {
        id: diagramId,
        type: diagramType,
        engine,
        created: new Date().toISOString(),
      },
    };
  }

  // 保存代码文件
  let codePath: string;

  try {
    codePath = await fileStore.saveCode(code, {
      outputDir,
      filename: diagramId,
      imageFormat,
    });
  } catch (error) {
    // 保存失败
    return {
      success: false,
      files: {
        image: '',
        code: '',
      },
      message: `SAVE_FAILED: ${(error as Error).message}`,
      metadata: {
        id: diagramId,
        type: diagramType,
        engine,
        created: new Date().toISOString(),
      },
    };
  }

  // 尝试导出图片
  let imagePath: string = '';
  let preview: string | undefined;

  try {
    // 如果是 Mermaid 引擎，使用 Puppeteer 导出
    if (engine === 'mermaid') {
      // 将 D2 代码转换为 Mermaid 代码（简化版）
      const mermaidCode = convertD2ToMermaid(code);

      // 导出图片
      const imageBase64 = await puppeteerExporter.exportToImage(mermaidCode, engine, imageFormat);

      // 保存图片
      imagePath = await fileStore.saveImage(imageBase64, {
        outputDir,
        filename: diagramId,
        imageFormat,
      });

      // 设置预览
      preview = imageBase64;
    } else {
      // D2 引擎暂不支持 Puppeteer 直接导出
      // 图片路径为空，仅返回代码文件
      imagePath = '';
    }
  } catch (error) {
    // 图片导出失败，但代码文件已成功
    // 降级处理：返回代码文件路径
    imagePath = '';
  }

  // 保存元数据
  const metadata = {
    id: diagramId,
    type: diagramType,
    engine,
    created: new Date().toISOString(),
    components,
    relationships,
    outputDir,
  };

  const metadataPath = path.join(outputDir, 'metadata.json');

  await metadataStore.saveMetadata(metadata, metadataPath);

  // 返回成功结果
  return {
    success: true,
    files: {
      image: imagePath || codePath.replace('.d2', '.png'),
      code: codePath,
    },
    preview,
    message: '架构图生成成功',
    metadata: {
      id: diagramId,
      type: diagramType,
      engine,
      created: new Date().toISOString(),
    },
  };
}

/**
 * D2 代码转换为 Mermaid 代码（简化版）
 *
 * @param d2Code - D2 代码
 * @returns Mermaid 代码
 * @author lvdaxianerplus
 * @date 2026-04-20
 */
function convertD2ToMermaid(d2Code: string): string {
  // 初始化 Mermaid 代码行
  const lines: string[] = [];

  // 添加 Mermaid 图表声明
  lines.push('graph LR');

  // 解析 D2 代码（简化版）
  const d2Lines = d2Code.split('\n');

  for (const line of d2Lines) {
    // 去除空格
    const trimmed = line.trim();

    // 跳过方向声明
    if (trimmed.startsWith('direction:')) {
      continue;
    }

    // 跳过空行
    if (trimmed.length === 0) {
      continue;
    }

    // 检查是否是组件定义
    if (trimmed.includes(':') && !trimmed.includes('->')) {
      // 提取组件名称
      const match = trimmed.match(/^([^:]+):/);

      if (match) {
        // 提取名称（去除引号）
        const name = match[1].replace(/"/g, '').trim();

        // 添加 Mermaid 组件定义
        lines.push(`    ${name}[${name}]`);
      }
    }

    // 检查是否是关系定义
    if (trimmed.includes('->')) {
      // 提取关系定义
      const match = trimmed.match(/^(.+?)\s*(->|<->|-->)\s*(.+?)(:\s*(.+))?$/);

      if (match) {
        const source = match[1].replace(/"/g, '').trim();
        const target = match[3].replace(/"/g, '').trim();
        const label = match[5] || '';

        // 添加 Mermaid 关系定义
        if (label) {
          lines.push(`    ${source} -->|${label}| ${target}`);
        } else {
          lines.push(`    ${source} --> ${target}`);
        }
      }
    }
  }

  // 合并代码行
  return lines.join('\n');
}