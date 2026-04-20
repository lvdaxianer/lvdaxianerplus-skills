/**
 * MCP 架构图生成器 - 配置加载器
 *
 * 从 YAML 文件加载应用配置
 *
 * @author lvdaxianerplus
 * @date 2026-04-20
 */

import fs from 'fs';
import path from 'path';
import YAML from 'yaml';
import type { AppConfig } from '../config/types.js';
import { DEFAULT_CONFIG } from '../config/defaults.js';

/**
 * 配置加载器类
 *
 * 支持 YAML 配置文件加载和默认值合并
 *
 * @author lvdaxianerplus
 * @date 2026-04-20
 */
export class ConfigLoader {
  private configPath: string;

  /**
   * 构造函数
   *
   * @param configPath - 配置文件路径
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  constructor(configPath: string) {
    // 初始化配置文件路径
    this.configPath = configPath;
  }

  /**
   * 检查配置文件是否存在
   *
   * @returns 文件是否存在
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  private exists(): boolean {
    // 使用 fs 检查文件存在性
    if (fs.existsSync(this.configPath)) {
      return true;
    }

    return false;
  }

  /**
   * 读取 YAML 文件内容
   *
   * @returns YAML 解析后的对象
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  private readYaml(): Record<string, unknown> | null {
    // 检查文件存在性
    if (!this.exists()) {
      // 文件不存在，返回 null
      return null;
    }

    // 读取文件内容
    const content = fs.readFileSync(this.configPath, 'utf-8');

    // 解析 YAML
    try {
      const parsed = YAML.parse(content);

      // 返回解析结果
      if (parsed && typeof parsed === 'object') {
        return parsed as Record<string, unknown>;
      }

      // 解析失败，返回 null
      return null;
    } catch (error) {
      // YAML 解析错误，返回 null
      return null;
    }
  }

  /**
   * 合并配置对象
   *
   * @param base - 基础配置
   * @param override - 覆盖配置
   * @returns 合合后的配置
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  private mergeConfig(
    base: AppConfig,
    override: Record<string, unknown>
  ): AppConfig {
    // 创建合并后的配置对象
    const merged: AppConfig = {
      server: {
        name: base.server.name,
        version: base.server.version,
      },
      output: {
        defaultDir: base.output.defaultDir,
        defaultFormat: base.output.defaultFormat,
        defaultEngine: base.output.defaultEngine,
      },
      metadata: {
        filename: base.metadata.filename,
      },
      logging: {
        level: base.logging.level,
        file: base.logging.file,
      },
    };

    // 如果 override 有 server 配置
    if (override.server && typeof override.server === 'object') {
      const serverOverride = override.server as Record<string, unknown>;

      // 如果 override 有 name，则覆盖
      if (serverOverride.name && typeof serverOverride.name === 'string') {
        merged.server.name = serverOverride.name;
      }

      // 如果 override 有 version，则覆盖
      if (serverOverride.version && typeof serverOverride.version === 'string') {
        merged.server.version = serverOverride.version;
      }
    }

    // 如果 override 有 output 配置
    if (override.output && typeof override.output === 'object') {
      const outputOverride = override.output as Record<string, unknown>;

      // 如果 override 有 defaultDir，则覆盖
      if (outputOverride.defaultDir && typeof outputOverride.defaultDir === 'string') {
        merged.output.defaultDir = outputOverride.defaultDir;
      }

      // 如果 override 有 defaultFormat，则覆盖
      if (outputOverride.defaultFormat && typeof outputOverride.defaultFormat === 'string') {
        merged.output.defaultFormat = outputOverride.defaultFormat as 'png' | 'svg';
      }

      // 如果 override 有 defaultEngine，则覆盖
      if (outputOverride.defaultEngine && typeof outputOverride.defaultEngine === 'string') {
        merged.output.defaultEngine = outputOverride.defaultEngine as 'd2' | 'mermaid';
      }
    }

    // 如果 override 有 metadata 配置
    if (override.metadata && typeof override.metadata === 'object') {
      const metadataOverride = override.metadata as Record<string, unknown>;

      // 如果 override 有 filename，则覆盖
      if (metadataOverride.filename && typeof metadataOverride.filename === 'string') {
        merged.metadata.filename = metadataOverride.filename;
      }
    }

    // 如果 override 有 logging 配置
    if (override.logging && typeof override.logging === 'object') {
      const loggingOverride = override.logging as Record<string, unknown>;

      // 如果 override 有 level，则覆盖
      if (loggingOverride.level && typeof loggingOverride.level === 'string') {
        merged.logging.level = loggingOverride.level as 'error' | 'warn' | 'info' | 'debug';
      }

      // 如果 override 有 file，则覆盖
      if (loggingOverride.file && typeof loggingOverride.file === 'string') {
        merged.logging.file = loggingOverride.file;
      }
    }

    // 返回合并后的配置
    return merged;
  }

  /**
   * 加载配置
   *
   * @returns 应用配置
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  load(): AppConfig {
    // 读取 YAML 配置
    const yamlConfig = this.readYaml();

    // 如果 YAML 配置不存在，返回默认配置
    if (!yamlConfig) {
      return DEFAULT_CONFIG;
    }

    // 合合 YAML 配置和默认配置
    const merged = this.mergeConfig(DEFAULT_CONFIG, yamlConfig);

    // 返回合并后的配置
    return merged;
  }
}

/**
 * 创建配置加载器实例
 *
 * @param configPath - 配置文件路径
 * @returns 配置加载器实例
 * @author lvdaxianerplus
 * @date 2026-04-20
 */
export const createConfigLoader = (configPath: string): ConfigLoader => {
  return new ConfigLoader(configPath);
};

/**
 * 加载默认配置文件
 *
 * @returns 应用配置
 * @author lvdaxianerplus
 * @date 2026-04-20
 */
export const loadDefaultConfig = (): AppConfig => {
  // 默认配置文件路径
  const defaultConfigPath = path.join(process.cwd(), 'config', 'default.yaml');

  // 创建配置加载器
  const loader = createConfigLoader(defaultConfigPath);

  // 加载配置
  return loader.load();
};