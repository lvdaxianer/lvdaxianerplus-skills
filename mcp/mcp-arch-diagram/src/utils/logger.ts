/**
 * MCP 架构图生成器 - 结构化日志模块
 *
 * 提供带有业务标识的结构化日志输出
 *
 * @author lvdaxianerplus
 * @date 2026-04-20
 */

import fs from 'fs';
import path from 'path';

/**
 * 日志级别枚举
 *
 * @author lvdaxianerplus
 * @date 2026-04-20
 */
type LogLevel = 'error' | 'warn' | 'info' | 'debug';

/**
 * 日志配置接口
 *
 * @author lvdaxianerplus
 * @date 2026-04-20
 */
interface LogConfig {
  level: LogLevel;
  file: string;
}

/**
 * 日志条目接口
 *
 * @author lvdaxianerplus
 * @date 2026-04-20
 */
interface LogEntry {
  timestamp: string;
  level: LogLevel;
  business: string;
  message: string;
  metadata?: Record<string, unknown>;
}

/**
 * 结构化日志类
 *
 * 支持业务标识、文件输出和格式化
 *
 * @author lvdaxianerplus
 * @date 2026-04-20
 */
export class Logger {
  private level: LogLevel;
  private logFile: string;
  private logDir: string;

  /**
   * 日志级别优先级映射
   *
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  private levelPriority: Record<LogLevel, number> = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3,
  };

  /**
   * 构造函数
   *
   * @param config - 日志配置
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  constructor(config: LogConfig) {
    // 初始化日志级别
    this.level = config.level;

    // 初始化日志文件路径
    this.logFile = config.file;

    // 初始化日志目录
    this.logDir = path.dirname(this.logFile);

    // 如果日志目录不存在，创建目录
    if (this.logDir && !fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  /**
   * 格式化时间戳
   *
   * @returns ISO 格式时间戳
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  private formatTimestamp(): string {
    return new Date().toISOString();
  }

  /**
   * 判断是否应该输出日志
   *
   * @param level - 目标日志级别
   * @returns 是否应该输出
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  private shouldLog(level: LogLevel): boolean {
    // 如果目标级别优先级 <= 配置级别优先级，则输出
    if (this.levelPriority[level] <= this.levelPriority[this.level]) {
      return true;
    }

    // 否则不输出
    return false;
  }

  /**
   * 构建日志条目
   *
   * @param level - 日志级别
   * @param business - 业务标识
   * @param message - 日志消息
   * @param metadata - 可选元数据
   * @returns 格式化的日志字符串
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  private buildEntry(
    level: LogLevel,
    business: string,
    message: string,
    metadata?: Record<string, unknown>
  ): string {
    // 构建日志条目对象
    const entry: LogEntry = {
      timestamp: this.formatTimestamp(),
      level,
      business,
      message,
      metadata,
    };

    // 转换为 JSON 字符串
    return JSON.stringify(entry);
  }

  /**
   * 写入日志文件
   *
   * @param entry - 日志条目
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  private writeToFile(entry: string): void {
    // 如果日志文件路径为空，不写入
    if (!this.logFile) {
      return;
    }

    // 检查日志文件是否存在
    if (!fs.existsSync(this.logFile)) {
      // 创建空文件
      fs.writeFileSync(this.logFile, '');
    }

    // 写入日志条目（追加模式）
    fs.appendFileSync(this.logFile, entry + '\n');
  }

  /**
   * 输出日志
   *
   * @param level - 日志级别
   * @param business - 业务标识
   * @param message - 日志消息
   * @param metadata - 可选元数据
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  private log(
    level: LogLevel,
    business: string,
    message: string,
    metadata?: Record<string, unknown>
  ): void {
    // 检查是否应该输出
    if (!this.shouldLog(level)) {
      return;
    }

    // 构建日志条目
    const entry = this.buildEntry(level, business, message, metadata);

    // 写入文件
    this.writeToFile(entry);

    // 同时输出到控制台（开发环境）
    // 格式：[业务标识] 级别: 消息
    const consoleFormat = `[${business}] ${level.toUpperCase()}: ${message}`;

    // 根据级别选择输出方法
    if (level === 'error') {
      console.error(consoleFormat);
    } else if (level === 'warn') {
      console.warn(consoleFormat);
    } else {
      console.log(consoleFormat);
    }
  }

  /**
   * 输出 ERROR 级别日志
   *
   * @param business - 业务标识
   * @param message - 日志消息
   * @param metadata - 可选元数据
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  error(business: string, message: string, metadata?: Record<string, unknown>): void {
    this.log('error', business, message, metadata);
  }

  /**
   * 输出 WARN 级别日志
   *
   * @param business - 业务标识
   * @param message - 日志消息
   * @param metadata - 可选元数据
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  warn(business: string, message: string, metadata?: Record<string, unknown>): void {
    this.log('warn', business, message, metadata);
  }

  /**
   * 输出 INFO 级别日志
   *
   * @param business - 业务标识
   * @param message - 日志消息
   * @param metadata - 可选元数据
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  info(business: string, message: string, metadata?: Record<string, unknown>): void {
    this.log('info', business, message, metadata);
  }

  /**
   * 输出 DEBUG 级别日志
   *
   * @param business - 业务标识
   * @param message - 日志消息
   * @param metadata - 可选元数据
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  debug(business: string, message: string, metadata?: Record<string, unknown>): void {
    this.log('debug', business, message, metadata);
  }
}

/**
 * 默认日志实例
 *
 * @author lvdaxianerplus
 * @date 2026-04-20
 */
import { DEFAULT_LOG_LEVEL, LOG_FILENAME } from '../config/defaults.js';

/**
 * 创建默认日志实例
 *
 * @author lvdaxianerplus
 * @date 2026-04-20
 */
export const createDefaultLogger = (): Logger => {
  return new Logger({
    level: DEFAULT_LOG_LEVEL,
    file: LOG_FILENAME,
  });
};