/**
 * MCP 架构图生成器 - 文件存储模块
 *
 * 提供图片和代码文件的保存/读取功能
 *
 * @author lvdaxianerplus
 * @date 2026-04-20
 */

import fs from 'fs';
import path from 'path';
import type { SaveOptions, ImageFormat } from '../config/types.js';

/**
 * 文件存储类
 *
 * 负责图片和代码文件的读写操作
 *
 * @author lvdaxianerplus
 * @date 2026-04-20
 */
export class FileStore {
  /**
   * 确保输出目录存在
   *
   * @param outputDir - 输出目录路径
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  private ensureDirectory(outputDir: string): void {
    // 如果目录不存在，创建目录
    if (!fs.existsSync(outputDir)) {
      // 创建递归目录
      fs.mkdirSync(outputDir, { recursive: true });
    }
  }

  /**
   * 构建文件完整路径
   *
   * @param outputDir - 输出目录
   * @param filename - 文件名
   * @param extension - 文件扩展名
   * @returns 完整文件路径
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  private buildPath(outputDir: string, filename: string, extension: string): string {
    // 如果 filename 为空，抛出错误
    if (!filename || filename.trim().length === 0) {
      throw new Error('Filename cannot be empty');
    }

    // 构建完整路径
    return path.join(outputDir, `${filename}.${extension}`);
  }

  /**
   * 获取图片扩展名
   *
   * @param format - 图片格式
   * @returns 文件扩展名
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  private getImageExtension(format: ImageFormat): string {
    // 返回格式对应的扩展名
    if (format === 'png') {
      return 'png';
    }

    if (format === 'svg') {
      return 'svg';
    }

    // 无效格式，抛出错误
    throw new Error(`Invalid image format: ${format}`);
  }

  /**
   * 保存图片文件
   *
   * @param imageData - 图片数据（base64 或 Buffer）
   * @param options - 保存选项
   * @returns 文件路径
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  async saveImage(imageData: string | Buffer, options: SaveOptions): Promise<string> {
    // 确保目录存在
    this.ensureDirectory(options.outputDir);

    // 获取图片扩展名
    const extension = this.getImageExtension(options.imageFormat);

    // 构建文件路径
    const filePath = this.buildPath(options.outputDir, options.filename, extension);

    // 转换数据格式
    let data: Buffer;

    if (typeof imageData === 'string') {
      // 如果是 base64 字符串，转换为 Buffer
      // 检查是否包含 base64 前缀
      if (imageData.startsWith('data:')) {
        // 提取 base64 数据部分
        const base64Data = imageData.split(',')[1];
        data = Buffer.from(base64Data, 'base64');
      } else {
        // 直接转换
        data = Buffer.from(imageData, 'base64');
      }
    } else {
      // 已经是 Buffer，直接使用
      data = imageData;
    }

    // 写入文件
    fs.writeFileSync(filePath, data);

    // 返回文件路径
    return filePath;
  }

  /**
   * 保存代码文件
   *
   * @param code - D2/Mermaid 代码
   * @param options - 保存选项
   * @returns 文件路径
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  async saveCode(code: string, options: SaveOptions): Promise<string> {
    // 确保目录存在
    this.ensureDirectory(options.outputDir);

    // 确定代码文件扩展名（默认使用 .d2）
    const extension = 'd2';

    // 构建文件路径
    const filePath = this.buildPath(options.outputDir, options.filename, extension);

    // 如果代码为空，抛出错误
    if (!code || code.trim().length === 0) {
      throw new Error('Code content cannot be empty');
    }

    // 写入文件
    fs.writeFileSync(filePath, code, 'utf-8');

    // 返回文件路径
    return filePath;
  }

  /**
   * 获取文件内容
   *
   * @param filePath - 文件路径
   * @returns 文件内容
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  async getFile(filePath: string): Promise<string | Buffer> {
    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      // 文件不存在，抛出错误
      throw new Error(`File not found: ${filePath}`);
    }

    // 判断文件类型
    const extension = path.extname(filePath).toLowerCase();

    // 图片文件返回 Buffer
    if (extension === '.png' || extension === '.svg' || extension === '.jpg' || extension === '.jpeg') {
      // 读取为 Buffer
      const data = fs.readFileSync(filePath);

      // 返回 Buffer
      return data;
    }

    // 其他文件返回字符串
    const content = fs.readFileSync(filePath, 'utf-8');

    // 返回字符串
    return content;
  }

  /**
   * 删除文件
   *
   * @param filePath - 文件路径
   * @returns 是否成功
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  async deleteFile(filePath: string): Promise<boolean> {
    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      // 文件不存在，返回 false
      return false;
    }

    // 删除文件
    try {
      fs.unlinkSync(filePath);

      // 返回成功
      return true;
    } catch (error) {
      // 删除失败，返回 false
      return false;
    }
  }
}