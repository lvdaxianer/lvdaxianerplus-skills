/**
 * MCP 架构图生成器 - 类型定义
 *
 * 定义所有核心实体、枚举和接口
 *
 * @author lvdaxianerplus
 * @date 2026-04-20
 */

/**
 * 架构图类型枚举
 *
 * @author lvdaxianerplus
 * @date 2026-04-20
 */
export type DiagramType = 'deployment' | 'business' | 'function';

/**
 * 渲染引擎类型枚举
 *
 * @author lvdaxianerplus
 * @date 2026-04-20
 */
export type Engine = 'd2' | 'mermaid';

/**
 * 图片格式枚举
 *
 * @author lvdaxianerplus
 * @date 2026-04-20
 */
export type ImageFormat = 'png' | 'svg';

/**
 * 组件类型枚举
 *
 * @author lvdaxianerplus
 * @date 2026-04-20
 */
export type ComponentType =
  | 'service'
  | 'database'
  | 'gateway'
  | 'cache'
  | 'module'
  | 'cloud'
  | 'client'
  | 'queue';

/**
 * 关系类型枚举
 *
 * @author lvdaxianerplus
 * @date 2026-04-20
 */
export type RelationType =
  | 'dataflow'
  | 'dependency'
  | 'network'
  | 'async'
  | 'bidirectional';

/**
 * 获取格式枚举
 *
 * @author lvdaxianerplus
 * @date 2026-04-20
 */
export type GetFormat = 'image' | 'code' | 'both';

/**
 * 位置接口定义
 *
 * @author lvdaxianerplus
 * @date 2026-04-20
 */
export interface Position {
  x: number;
  y: number;
}

/**
 * 组件接口定义
 *
 * @author lvdaxianerplus
 * @date 2026-04-20
 */
export interface Component {
  id: string;
  name: string;
  type: ComponentType;
  position?: Position;
}

/**
 * 关系接口定义
 *
 * @author lvdaxianerplus
 * @date 2026-04-20
 */
export interface Relationship {
  sourceId: string;
  targetId: string;
  type: RelationType;
  label?: string;
}

/**
 * Diagram 实体接口定义
 *
 * @author lvdaxianerplus
 * @date 2026-04-20
 */
export interface Diagram {
  id: string;
  type: DiagramType;
  engine: Engine;
  components: Component[];
  relationships: Relationship[];
  description?: string;
  createdAt: Date;
  outputDir: string;
}

/**
 * Output 文件接口定义
 *
 * @author lvdaxianerplus
 * @date 2026-04-20
 */
export interface Output {
  diagramId: string;
  imagePath: string;
  codePath: string;
  format: ImageFormat;
  size?: number;
}

/**
 * 模板组件接口定义
 *
 * @author lvdaxianerplus
 * @date 2026-04-20
 */
export interface TemplateComponent {
  type: ComponentType;
  placeholder?: string;
  position?: Position;
  required: boolean;
}

/**
 * 模板连接接口定义
 *
 * @author lvdaxianerplus
 * @date 2026-04-20
 */
export interface TemplateConnection {
  from: string;
  to: string;
  relationType: RelationType;
}

/**
 * 模板样式接口定义
 *
 * @author lvdaxianerplus
 * @date 2026-04-20
 */
export interface TemplateStyling {
  theme?: string;
  direction?: 'right' | 'down' | 'left' | 'up';
}

/**
 * 模板结构接口定义
 *
 * @author lvdaxianerplus
 * @date 2026-04-20
 */
export interface TemplateStructure {
  components: TemplateComponent[];
  connections: TemplateConnection[];
  styling?: TemplateStyling;
}

/**
 * 模板实体接口定义
 *
 * @author lvdaxianerplus
 * @date 2026-04-20
 */
export interface Template {
  name: string;
  type: DiagramType;
  description: string;
  structure: TemplateStructure;
  placeholders: string[];
}

/**
 * generate_diagram 工具输入接口
 *
 * @author lvdaxianerplus
 * @date 2026-04-20
 */
export interface GenerateDiagramInput {
  description?: string;
  type?: DiagramType;
  template?: string;
  engine?: Engine;
  outputDir?: string;
  imageFormat?: ImageFormat;
}

/**
 * generate_diagram 工具输出接口
 *
 * @author lvdaxianerplus
 * @date 2026-04-20
 */
export interface GenerateDiagramOutput {
  success: boolean;
  files: {
    image: string;
    code: string;
  };
  preview?: string;
  message: string;
  metadata: {
    id: string;
    type: string;
    engine: string;
    created: string;
  };
}

/**
 * list_templates 工具输出接口
 *
 * @author lvdaxianerplus
 * @date 2026-04-20
 */
export interface ListTemplatesOutput {
  templates: TemplateItem[];
}

/**
 * 模板项接口（简化版）
 *
 * @author lvdaxianerplus
 * @date 2026-04-20
 */
export interface TemplateItem {
  name: string;
  type: string;
  description: string;
}

/**
 * get_diagram 工具输入接口
 *
 * @author lvdaxianerplus
 * @date 2026-04-20
 */
export interface GetDiagramInput {
  id: string;
  format?: GetFormat;
}

/**
 * get_diagram 工具成功输出接口
 *
 * @author lvdaxianerplus
 * @date 2026-04-20
 */
export interface GetDiagramOutputSuccess {
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
 * get_diagram 工具错误输出接口
 *
 * @author lvdaxianerplus
 * @date 2026-04-20
 */
export interface GetDiagramOutputError {
  id: string;
  error: string;
}

/**
 * get_diagram 工具输出联合类型
 *
 * @author lvdaxianerplus
 * @date 2026-04-20
 */
export type GetDiagramOutput = GetDiagramOutputSuccess | GetDiagramOutputError;

/**
 * 服务配置接口
 *
 * @author lvdaxianerplus
 * @date 2026-04-20
 */
export interface ServerConfig {
  name: string;
  version: string;
}

/**
 * 输出配置接口
 *
 * @author lvdaxianerplus
 * @date 2026-04-20
 */
export interface OutputConfig {
  defaultDir: string;
  defaultFormat: ImageFormat;
  defaultEngine: Engine;
}

/**
 * 元数据配置接口
 *
 * @author lvdaxianerplus
 * @date 2026-04-20
 */
export interface MetadataConfig {
  filename: string;
}

/**
 * 日志配置接口
 *
 * @author lvdaxianerplus
 * @date 2026-04-20
 */
export interface LoggingConfig {
  level: 'error' | 'warn' | 'info' | 'debug';
  file: string;
}

/**
 * 应用配置接口
 *
 * @author lvdaxianerplus
 * @date 2026-04-20
 */
export interface AppConfig {
  server: ServerConfig;
  output: OutputConfig;
  metadata: MetadataConfig;
  logging: LoggingConfig;
}

/**
 * 解析结果接口
 *
 * @author lvdaxianerplus
 * @date 2026-04-20
 */
export interface ParseResult {
  components: Component[];
  relationships: Relationship[];
  type: DiagramType;
}

/**
 * 解析输入接口
 *
 * @author lvdaxianerplus
 * @date 2026-04-20
 */
export interface ParseInput {
  description: string;
  type?: DiagramType;
}

/**
 * D2 生成选项接口
 *
 * @author lvdaxianerplus
 * @date 2026-04-20
 */
export interface D2GenerateOptions {
  direction?: 'right' | 'down' | 'left' | 'up';
  theme?: 'default' | 'dark' | 'colorblind';
}

/**
 * Mermaid 生成选项接口
 *
 * @author lvdaxianerplus
 * @date 2026-04-20
 */
export interface MermaidGenerateOptions {
  theme?: 'default' | 'dark' | 'forest';
}

/**
 * 文件保存选项接口
 *
 * @author lvdaxianerplus
 * @date 2026-04-20
 */
export interface SaveOptions {
  outputDir: string;
  filename: string;
  imageFormat: ImageFormat;
}

/**
 * Diagram 元数据存储接口
 *
 * @author lvdaxianerplus
 * @date 2026-04-20
 */
export interface DiagramMetadata {
  id: string;
  type: DiagramType;
  engine: Engine;
  created: string;
  components: Component[];
  relationships: Relationship[];
  outputDir: string;
}