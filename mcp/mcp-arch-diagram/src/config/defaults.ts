/**
 * MCP 架构图生成器 - 默认配置
 *
 * 定义所有默认常量和配置值
 *
 * @author lvdaxianerplus
 * @date 2026-04-20
 */

import type { AppConfig, ImageFormat, Engine, DiagramType } from './types.js';

/**
 * 默认输出目录
 *
 * @author lvdaxianerplus
 * @date 2026-04-20
 */
export const DEFAULT_OUTPUT_DIR = './diagrams';

/**
 * 默认图片格式
 *
 * @author lvdaxianerplus
 * @date 2026-04-20
 */
export const DEFAULT_IMAGE_FORMAT: ImageFormat = 'png';

/**
 * 默认渲染引擎
 *
 * @author lvdaxianerplus
 * @date 2026-04-20
 */
export const DEFAULT_ENGINE: Engine = 'd2';

/**
 * 默认架构图类型
 *
 * @author lvdaxianerplus
 * @date 2026-04-20
 */
export const DEFAULT_DIAGRAM_TYPE: DiagramType = 'deployment';

/**
 * 默认 D2 方向
 *
 * @author lvdaxianerplus
 * @date 2026-04-20
 */
export const DEFAULT_D2_DIRECTION: 'right' | 'down' | 'left' | 'up' = 'right';

/**
 * 默认 Mermaid 主题
 *
 * @author lvdaxianerplus
 * @date 2026-04-20
 */
export const DEFAULT_MERMAID_THEME: 'default' | 'dark' | 'forest' = 'default';

/**
 * 元数据文件名
 *
 * @author lvdaxianerplus
 * @date 2026-04-20
 */
export const METADATA_FILENAME = 'metadata.json';

/**
 * 日志文件名
 *
 * @author lvdaxianerplus
 * @date 2026-04-20
 */
export const LOG_FILENAME = 'mcp-arch-diagram.log';

/**
 * 默认日志级别
 *
 * @author lvdaxianerplus
 * @date 2026-04-20
 */
export const DEFAULT_LOG_LEVEL: 'error' | 'warn' | 'info' | 'debug' = 'info';

/**
 * 服务名称
 *
 * @author lvdaxianerplus
 * @date 2026-04-20
 */
export const SERVER_NAME = 'mcp-arch-diagram';

/**
 * 服务版本
 *
 * @author lvdaxianerplus
 * @date 2026-04-20
 */
export const SERVER_VERSION = '0.1.0';

/**
 * 架构图 ID 前缀
 *
 * @author lvdaxianerplus
 * @date 2026-04-20
 */
export const DIAGRAM_ID_PREFIX = 'arch-';

/**
 * 性能阈值：复杂架构图生成时间（毫秒）
 *
 * @author lvdaxianerplus
 * @date 2026-04-20
 */
export const PERFORMANCE_THRESHOLD_MS = 10000;

/**
 * 组件类型关键词映射
 *
 * 用于 NLP 解析器识别组件类型
 *
 * @author lvdaxianerplus
 * @date 2026-04-20
 */
export const COMPONENT_TYPE_KEYWORDS: Record<string, string[]> = {
  service: ['服务', 'service', 'svc', '微服务', 'api'],
  database: ['数据库', 'database', 'db', 'mysql', 'postgres', 'mongodb', 'sql'],
  gateway: ['网关', 'gateway', 'gw', 'api网关', '入口'],
  cache: ['缓存', 'cache', 'redis', 'memcached'],
  module: ['模块', 'module', '组件', '功能'],
  cloud: ['云', 'cloud', 'aws', 'azure', 'gcp', '阿里云'],
  client: ['客户端', 'client', '用户', '浏览器', 'app', 'mobile'],
  queue: ['队列', 'queue', 'mq', 'kafka', 'rabbitmq', '消息'],
};

/**
 * 关系类型关键词映射
 *
 * 用于 NLP 解析器识别关系类型
 *
 * @author lvdaxianerplus
 * @date 2026-04-20
 */
export const RELATION_TYPE_KEYWORDS: Record<string, string[]> = {
  dataflow: ['连接', '流向', '转发', '调用', 'request', 'response', 'http'],
  dependency: ['依赖', 'dependency', '需要', '使用', '访问'],
  network: ['网络', 'network', 'tcp', 'udp', 'socket'],
  async: ['异步', 'async', '消息', 'event', '推送'],
  bidirectional: ['双向', '交互', '通信', '来回'],
};

/**
 * 架构图类型关键词映射
 *
 * 用于推断架构图类型
 *
 * @author lvdaxianerplus
 * @date 2026-04-20
 */
export const DIAGRAM_TYPE_KEYWORDS: Record<string, string[]> = {
  deployment: ['部署', 'deployment', '架构', '微服务', '分布式', '系统'],
  business: ['业务', 'business', '流程', '流程图', '流程'],
  function: ['功能', 'function', '模块', '组件', '结构'],
};

/**
 * 默认应用配置
 *
 * @author lvdaxianerplus
 * @date 2026-04-20
 */
export const DEFAULT_CONFIG: AppConfig = {
  server: {
    name: SERVER_NAME,
    version: SERVER_VERSION,
  },
  output: {
    defaultDir: DEFAULT_OUTPUT_DIR,
    defaultFormat: DEFAULT_IMAGE_FORMAT,
    defaultEngine: DEFAULT_ENGINE,
  },
  metadata: {
    filename: METADATA_FILENAME,
  },
  logging: {
    level: DEFAULT_LOG_LEVEL,
    file: LOG_FILENAME,
  },
};

/**
 * 有效枚举值列表
 *
 * @author lvdaxianerplus
 * @date 2026-04-20
 */
export const VALID_DIAGRAM_TYPES: DiagramType[] = ['deployment', 'business', 'function'];
export const VALID_ENGINES: Engine[] = ['d2', 'mermaid'];
export const VALID_IMAGE_FORMATS: ImageFormat[] = ['png', 'svg'];
export const VALID_GET_FORMATS: string[] = ['image', 'code', 'both'];

/**
 * D2 箭头样式映射
 *
 * @author lvdaxianerplus
 * @date 2026-04-20
 */
export const D2_ARROW_STYLES: Record<string, string> = {
  dataflow: '->',
  dependency: '-->',
  network: '->',
  async: '->>',
  bidirectional: '<->',
};

/**
 * D2 组件图标映射
 *
 * @author lvdaxianerplus
 * @date 2026-04-20
 */
export const D2_SHAPE_MAP: Record<string, string> = {
  service: 'rectangle',
  database: 'cylinder',
  gateway: 'hexagon',
  cache: 'diamond',
  module: 'rectangle',
  cloud: 'circle',
  client: 'person',
  queue: 'queue',
};