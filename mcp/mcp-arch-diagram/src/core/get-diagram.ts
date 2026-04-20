/**
 * MCP 架构图生成器 - get_diagram 工具实现
 *
 * 获取已保存的架构图
 *
 * @author lvdaxianerplus
 * @date 2026-04-20
 */

import path from 'path';
import type {
  GetDiagramInput,
  GetDiagramOutputSuccess,
  GetDiagramOutputError,
  GetDiagramOutput,
  GetFormat,
} from '../config/types.js';
import { FileStore } from '../storage/file-store.js';
import { MetadataStore } from '../storage/metadata.js';

/**
 * get_diagram 工具实现
 *
 * @param input - 获取参数
 * @returns 架构图数据或错误
 * @author lvdaxianerplus
 * @date 2026-04-20
 */
export async function getDiagram(input: GetDiagramInput): Promise<GetDiagramOutput> {
  // 初始化存储模块
  const fileStore = new FileStore();
  const metadataStore = new MetadataStore();

  // 验证 ID 参数
  if (!input.id || input.id.trim().length === 0) {
    // 返回错误
    const errorOutput: GetDiagramOutputError = {
      id: input.id || '',
      error: 'NOT_FOUND: 架构图 ID 无效',
    };

    return errorOutput;
  }

  // 确定 format（默认 both）
  const format: GetFormat = input.format || 'both';

  // 构建元数据文件路径
  // 使用默认输出目录
  const outputDir = './diagrams';
  const metadataPath = path.join(outputDir, 'metadata.json');

  // 获取元数据
  const metadata = await metadataStore.getMetadataById(input.id, metadataPath);

  // 如果元数据不存在
  if (!metadata) {
    // 返回 NOT_FOUND 错误
    const errorOutput: GetDiagramOutputError = {
      id: input.id,
      error: `NOT_FOUND: 找不到架构图 ${input.id}`,
    };

    return errorOutput;
  }

  // 构建文件路径
  const imagePath = path.join(metadata.outputDir, `${metadata.id}.png`);
  const codePath = path.join(metadata.outputDir, `${metadata.id}.d2`);

  // 初始化输出对象
  const output: GetDiagramOutputSuccess = {
    id: metadata.id,
    metadata: {
      type: metadata.type,
      engine: metadata.engine,
      created: metadata.created,
    },
  };

  // 根据 format 获取内容
  if (format === 'image' || format === 'both') {
    // 尝试获取图片
    try {
      const imageData = await fileStore.getFile(imagePath);

      // 如果是 Buffer，转换为 base64
      if (Buffer.isBuffer(imageData)) {
        output.image = imageData.toString('base64');
      } else {
        output.image = imageData as string;
      }
    } catch (error) {
      // 图片获取失败，不设置 image 字段
      // 如果是 both 格式且图片失败，仍然尝试获取代码
    }
  }

  if (format === 'code' || format === 'both') {
    // 尝试获取代码
    try {
      const codeData = await fileStore.getFile(codePath);

      // 设置代码字段
      if (typeof codeData === 'string') {
        output.code = codeData;
      } else {
        output.code = codeData.toString('utf-8');
      }
    } catch (error) {
      // 代码获取失败，不设置 code 字段
    }
  }

  // 返回成功结果
  return output;
}