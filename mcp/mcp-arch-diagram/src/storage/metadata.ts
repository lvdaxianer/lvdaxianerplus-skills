/**
 * MCP 架构图生成器 - 元数据存储模块
 *
 * 提供 Diagram 元数据的保存/查询功能
 *
 * @author lvdaxianerplus
 * @date 2026-04-20
 */

import fs from 'fs';
import path from 'path';
import type { DiagramMetadata } from '../config/types.js';

/**
 * 元数据存储类
 *
 * 负责架构图元数据的读写和查询
 *
 * @author lvdaxianerplus
 * @date 2026-04-20
 */
export class MetadataStore {
  /**
   * 确保元数据文件所在目录存在
   *
   * @param metadataPath - 元数据文件路径
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  private ensureDirectory(metadataPath: string): void {
    // 获取目录路径
    const dir = path.dirname(metadataPath);

    // 如果目录不存在，创建目录
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  /**
   * 读取所有元数据
   *
   * @param metadataPath - 元数据文件路径
   * @returns 元数据列表
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  private readAllMetadata(metadataPath: string): DiagramMetadata[] {
    // 检查文件是否存在
    if (!fs.existsSync(metadataPath)) {
      // 文件不存在，返回空数组
      return [];
    }

    // 读取文件内容
    const content = fs.readFileSync(metadataPath, 'utf-8');

    // 尝试解析 JSON
    try {
      const data = JSON.parse(content);

      // 如果数据是数组，返回数组
      if (Array.isArray(data)) {
        return data as DiagramMetadata[];
      }

      // 如果数据是对象，转换为数组
      if (typeof data === 'object' && data !== null) {
        // 可能是单个元数据对象
        return [data as DiagramMetadata];
      }

      // 数据格式无效，返回空数组
      return [];
    } catch (error) {
      // JSON 解析失败，返回空数组
      return [];
    }
  }

  /**
   * 写入所有元数据
   *
   * @param metadataList - 元数据列表
   * @param metadataPath - 元数据文件路径
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  private writeAllMetadata(metadataList: DiagramMetadata[], metadataPath: string): void {
    // 确保目录存在
    this.ensureDirectory(metadataPath);

    // 转换为 JSON 字符串
    const content = JSON.stringify(metadataList, null, 2);

    // 写入文件
    fs.writeFileSync(metadataPath, content, 'utf-8');
  }

  /**
   * 保存元数据
   *
   * @param metadata - 架构图元数据
   * @param metadataPath - 元数据文件路径
   * @returns 是否成功
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  async saveMetadata(metadata: DiagramMetadata, metadataPath: string): Promise<boolean> {
    // 检查元数据有效性
    if (!metadata || !metadata.id) {
      // 元数据无效，返回 false
      return false;
    }

    // 读取现有元数据列表
    const existingList = this.readAllMetadata(metadataPath);

    // 查找是否已存在相同 ID 的元数据
    const existingIndex = existingList.findIndex((m) => m.id === metadata.id);

    // 如果存在，更新元数据
    if (existingIndex >= 0) {
      // 更新现有元数据
      existingList[existingIndex] = metadata;
    } else {
      // 不存在，添加新元数据
      existingList.push(metadata);
    }

    // 写入文件
    this.writeAllMetadata(existingList, metadataPath);

    // 返回成功
    return true;
  }

  /**
   * 根据 ID 获取元数据
   *
   * @param id - 架构图 ID
   * @param metadataPath - 元数据文件路径
   * @returns 元数据或 null
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  async getMetadataById(id: string, metadataPath: string): Promise<DiagramMetadata | null> {
    // 检查 ID 有效性
    if (!id || id.trim().length === 0) {
      // ID 无效，返回 null
      return null;
    }

    // 读取所有元数据
    const metadataList = this.readAllMetadata(metadataPath);

    // 查找匹配的元数据
    const metadata = metadataList.find((m) => m.id === id);

    // 如果找到，返回元数据
    if (metadata) {
      return metadata;
    }

    // 未找到，返回 null
    return null;
  }

  /**
   * 获取所有元数据
   *
   * @param metadataPath - 元数据文件路径
   * @returns 元数据列表
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  async getAllMetadata(metadataPath: string): Promise<DiagramMetadata[]> {
    // 读取所有元数据
    const metadataList = this.readAllMetadata(metadataPath);

    // 返回元数据列表
    return metadataList;
  }

  /**
   * 删除元数据
   *
   * @param id - 架构图 ID
   * @param metadataPath - 元数据文件路径
   * @returns 是否成功
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  async deleteMetadata(id: string, metadataPath: string): Promise<boolean> {
    // 检查 ID 有效性
    if (!id || id.trim().length === 0) {
      // ID 无效，返回 false
      return false;
    }

    // 读取所有元数据
    const metadataList = this.readAllMetadata(metadataPath);

    // 查找要删除的元数据
    const deleteIndex = metadataList.findIndex((m) => m.id === id);

    // 如果不存在，返回 false
    if (deleteIndex < 0) {
      return false;
    }

    // 删除元数据
    metadataList.splice(deleteIndex, 1);

    // 写入更新后的列表
    this.writeAllMetadata(metadataList, metadataPath);

    // 返回成功
    return true;
  }
}