/**
 * Mock data generator with dynamic field support
 *
 * Features:
 * - Generate data based on field type and constraints
 * - AI semantic generation based on aiHint
 * - Support for nested objects and arrays
 * - Random seed for reproducible generation
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */

import type { DynamicFieldConfig, MockDynamicConfig } from '../config/types.js';
import { v4 as uuidv4 } from 'uuid';

// Random seed state
let currentSeed: number | null = null;
let seededRandom: () => number = Math.random;

/**
 * Set random seed for reproducible generation
 *
 * @param seed - Random seed number
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
export function setSeed(seed: number): void {
  currentSeed = seed;
  // Simple seeded random implementation
  seededRandom = () => {
    const nextSeed = (currentSeed! * 9301 + 49297) % 233280;
    currentSeed = nextSeed;
    return nextSeed / 233280;
  };
}

/**
 * Reset seed to use Math.random
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
export function resetSeed(): void {
  currentSeed = null;
  seededRandom = Math.random;
}

/**
 * Generate random number in range
 *
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Random number in [min, max]
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
function randomInt(min: number, max: number): number {
  return Math.floor(seededRandom() * (max - min + 1)) + min;
}

/**
 * Generate random float in range
 *
 * @param min - Minimum value
 * @param max - Maximum value
 * @param precision - Decimal precision
 * @returns Random float in [min, max]
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
function randomFloat(min: number, max: number, precision?: number): number {
  let value = seededRandom() * (max - min) + min;
  if (precision !== undefined) {
    value = Math.round(value * Math.pow(10, precision)) / Math.pow(10, precision);
  }
  return value;
}

/**
 * Generate random string of specified length
 *
 * @param length - String length
 * @returns Random alphanumeric string
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
function randomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[randomInt(0, chars.length - 1)];
  }
  return result;
}

/**
 * Generate data for a single field
 *
 * @param field - Field configuration
 * @param args - Request arguments (for parameter placeholder replacement)
 * @returns Generated data value
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
export function generateFieldData(
  field: DynamicFieldConfig,
  args?: Record<string, unknown>
): unknown {
  const { type, constraints, aiHint } = field;

  // Switch by field type
  switch (type) {
    case 'string':
      return generateString(constraints, aiHint, args);
    case 'number':
      return generateNumber(constraints, aiHint);
    case 'boolean':
      return generateBoolean();
    case 'date':
      return generateDate(constraints, aiHint);
    case 'array':
      return generateArray(constraints, field, args);
    case 'object':
      return generateObject(constraints, args);
    default:
      return null;
  }
}

/**
 * Generate string value
 *
 * @param constraints - String constraints
 * @param aiHint - AI semantic hint
 * @param args - Request arguments
 * @returns Generated string
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
function generateString(
  constraints?: DynamicFieldConfig['constraints'],
  aiHint?: string,
  args?: Record<string, unknown>
): string {
  // Condition: enum values provided - select from enum
  if (constraints?.enum?.length) {
    return constraints.enum[randomInt(0, constraints.enum.length - 1)];
  }

  // Condition: aiHint provided - generate semantic string
  if (aiHint) {
    return generateSemanticString(aiHint, constraints);
  }

  // Condition: pattern provided - generate from regex pattern (simplified)
  if (constraints?.pattern) {
    return generateFromPattern(constraints.pattern, constraints);
  }

  // Condition: fixedLength provided
  const length = constraints?.fixedLength ?? randomInt(
    constraints?.minLength ?? 1,
    constraints?.maxLength ?? 20
  );

  // Default: random alphanumeric string
  return randomString(length);
}

/**
 * Generate semantic string based on AI hint
 *
 * @param hint - AI hint describing desired data type
 * @param constraints - Optional constraints
 * @returns Semantically appropriate string
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
function generateSemanticString(hint: string, constraints?: DynamicFieldConfig['constraints']): string {
  // Predefined semantic templates
  const semanticTemplates: Record<string, () => string> = {
    // Names
    '用户名': () => randomChineseName(),
    '姓名': () => randomChineseName(),
    'name': () => randomEnglishName(),
    'username': () => randomEnglishName().toLowerCase() + randomInt(100, 999),

    // Contact info
    '邮箱': () => randomEmail(),
    'email': () => randomEmail(),
    '手机号': () => randomPhone(),
    'phone': () => randomPhone(),
    '电话': () => randomPhone(),

    // Location
    '地址': () => randomAddress(),
    'address': () => randomAddress(),
    '城市': () => randomCity(),
    'city': () => randomCity(),

    // Business
    '公司': () => randomCompany(),
    '企业': () => randomCompany(),
    'company': () => randomCompany(),
    '产品名': () => randomProductName(),
    'product': () => randomProductName(),

    // IDs
    'ID': () => uuidv4(),
    'UUID': () => uuidv4(),
    'id': () => randomString(16),
    '订单号': () => randomOrderId(),
    'orderId': () => randomOrderId(),
    '订单ID': () => randomOrderId(),

    // Financial
    '银行卡': () => randomBankCard(),
    '卡号': () => randomBankCard(),

    // Default
    'default': () => randomString(10),
  };

  // Condition: match semantic template
  for (const [key, generator] of Object.entries(semanticTemplates)) {
    if (hint.toLowerCase().includes(key.toLowerCase())) {
      const value = generator();
      // Apply length constraints if specified
      if (constraints?.maxLength && value.length > constraints.maxLength) {
        return value.substring(0, constraints.maxLength);
      }
      return value;
    }
  }

  // Default: random string
  const length = randomInt(constraints?.minLength ?? 5, constraints?.maxLength ?? 15);
  return randomString(length);
}

/**
 * Generate from regex pattern (simplified implementation)
 *
 * @param pattern - Regex pattern
 * @param constraints - Length constraints
 * @returns String matching pattern
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
function generateFromPattern(pattern: string, constraints?: DynamicFieldConfig['constraints']): string {
  // Simplified pattern generation
  // Handle common patterns: [A-Z], [0-9], \d, {n}, {n,m}

  let result = '';

  // Condition: pattern starts with ^ - generate fixed format
  if (pattern.includes('[A-Z]')) {
    const count = constraints?.fixedLength ?? 2;
    for (let i = 0; i < count; i++) {
      result += String.fromCharCode(randomInt(65, 90)); // A-Z
    }
  }

  if (pattern.includes('\\d') || pattern.includes('[0-9]')) {
    const length = constraints?.fixedLength ?? 8;
    for (let i = 0; i < length; i++) {
      result += String.fromCharCode(randomInt(48, 57)); // 0-9
    }
  }

  // Default: random string matching approximate length
  if (result.length === 0) {
    const length = constraints?.fixedLength ?? 10;
    result = randomString(length);
  }

  return result;
}

/**
 * Generate number value
 *
 * @param constraints - Number constraints
 * @param aiHint - AI hint for semantic numbers
 * @returns Generated number
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
function generateNumber(
  constraints?: DynamicFieldConfig['constraints'],
  aiHint?: string
): number {
  const min = constraints?.min ?? 0;
  const max = constraints?.max ?? 100;
  const precision = constraints?.precision;

  // Condition: integer required
  if (constraints?.integer) {
    return randomInt(min, max);
  }

  // Default: float with optional precision
  return randomFloat(min, max, precision);
}

/**
 * Generate boolean value
 *
 * @returns Random boolean
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
function generateBoolean(): boolean {
  return seededRandom() > 0.5;
}

/**
 * Generate date value
 *
 * @param constraints - Date constraints
 * @param aiHint - AI hint (e.g., "创建时间", "过期日期")
 * @returns Generated date string
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
function generateDate(
  constraints?: DynamicFieldConfig['constraints'],
  aiHint?: string
): string {
  // Condition: date range specified
  const minDate = constraints?.minDate
    ? new Date(constraints.minDate)
    : new Date(Date.now() - 365 * 24 * 60 * 60 * 1000); // 1 year ago
  const maxDate = constraints?.maxDate
    ? new Date(constraints.maxDate)
    : new Date(); // now

  // Generate random date in range
  const range = maxDate.getTime() - minDate.getTime();
  const randomTime = minDate.getTime() + seededRandom() * range;
  const date = new Date(randomTime);

  // Condition: format specified
  const format = constraints?.format ?? 'YYYY-MM-DD';

  return formatDate(date, format);
}

/**
 * Format date according to format string
 *
 * @param date - Date object
 * @param format - Format string (YYYY-MM-DD, YYYY-MM-DD HH:mm:ss, etc.)
 * @returns Formatted date string
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
function formatDate(date: Date, format: string): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return format
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
}

/**
 * Generate array value
 *
 * @param constraints - Array constraints
 * @param field - Field configuration for item type
 * @param args - Request arguments
 * @returns Generated array
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
function generateArray(
  constraints?: DynamicFieldConfig['constraints'],
  field?: DynamicFieldConfig,
  args?: Record<string, unknown>
): unknown[] {
  // Condition: fixed items count specified
  const count = constraints?.fixedItems ?? randomInt(
    constraints?.minItems ?? 1,
    constraints?.maxItems ?? 5
  );

  // Condition: item type specified
  if (constraints?.itemType) {
    return Array.from({ length: count }, () =>
      generateFieldData(constraints.itemType!, args)
    );
  }

  // Default: array of random strings
  return Array.from({ length: count }, () => randomString(8));
}

/**
 * Generate object value
 *
 * @param constraints - Object constraints with nested fields
 * @param args - Request arguments
 * @returns Generated object
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
function generateObject(
  constraints?: DynamicFieldConfig['constraints'],
  args?: Record<string, unknown>
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  // Condition: nested fields specified
  if (constraints?.fields) {
    for (const nestedField of constraints.fields) {
      result[nestedField.name] = generateFieldData(nestedField, args);
    }
  }

  return result;
}

/**
 * Generate complete mock response from dynamic config
 *
 * @param config - Dynamic mock configuration
 * @param args - Request arguments
 * @returns Generated response object
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
export function generateDynamicResponse(
  config: MockDynamicConfig,
  args?: Record<string, unknown>
): Record<string, unknown> {
  // Condition: seed specified - use seeded random
  if (config.seed !== undefined) {
    setSeed(config.seed);
  } else {
    resetSeed();
  }

  const result: Record<string, unknown> = {};

  for (const field of config.fields) {
    // Condition: field is required or random inclusion
    if (field.required || seededRandom() > 0.3) {
      result[field.name] = generateFieldData(field, args);
    }
  }

  return result;
}

// ===== Semantic Data Generators =====

/**
 * Chinese name database (sample)
 */
const CHINESE_NAMES = [
  '张伟', '王芳', '李娜', '刘洋', '陈明', '杨静', '赵磊', '周婷',
  '吴昊', '郑杰', '孙丽', '朱华', '马超', '胡敏', '林峰', '何雪',
  '高勇', '罗琳', '梁军', '谢娟', '唐亮', '韩梅', '冯刚', '董燕',
  '萧红', '程浩', '曹云', '袁波', '邓强', '许晴', '傅斌', '沈莉',
];

/**
 * Generate random Chinese name
 *
 * @returns Chinese name
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
function randomChineseName(): string {
  return CHINESE_NAMES[randomInt(0, CHINESE_NAMES.length - 1)];
}

/**
 * Generate random English name
 *
 * @returns English name
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
function randomEnglishName(): string {
  const firstNames = ['John', 'Jane', 'Mike', 'Emily', 'David', 'Sarah', 'Tom', 'Lisa', 'Alex', 'Kate'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Davis', 'Miller', 'Wilson'];
  return firstNames[randomInt(0, firstNames.length - 1)] + ' ' + lastNames[randomInt(0, lastNames.length - 1)];
}

/**
 * Generate random email
 *
 * @returns Email address
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
function randomEmail(): string {
  const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'qq.com', '163.com', '126.com'];
  const username = randomString(randomInt(5, 10)).toLowerCase();
  return `${username}@${domains[randomInt(0, domains.length - 1)]}`;
}

/**
 * Generate random phone number (Chinese format)
 *
 * @returns Phone number
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
function randomPhone(): string {
  const prefixes = ['138', '139', '150', '151', '152', '158', '159', '186', '187', '188'];
  return prefixes[randomInt(0, prefixes.length - 1)] + randomString(8).replace(/[A-Za-z]/g, () =>
    String.fromCharCode(randomInt(48, 57))
  );
}

/**
 * Generate random address
 *
 * @returns Address string
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
function randomAddress(): string {
  const cities = ['北京', '上海', '广州', '深圳', '杭州', '南京', '武汉', '成都', '西安', '重庆'];
  const districts = ['朝阳区', '海淀区', '浦东新区', '天河区', '西湖区'];
  const streets = ['长安街', '中山路', '人民路', '解放路', '建设大道'];

  return `${cities[randomInt(0, cities.length - 1)]}${districts[randomInt(0, districts.length - 1)]}${streets[randomInt(0, streets.length - 1)]}${randomInt(1, 999)}号`;
}

/**
 * Generate random city name
 *
 * @returns City name
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
function randomCity(): string {
  const cities = ['北京', '上海', '广州', '深圳', '杭州', '南京', '武汉', '成都', '西安', '重庆', '天津', '苏州', '郑州', '长沙', '青岛'];
  return cities[randomInt(0, cities.length - 1)];
}

/**
 * Generate random company name
 *
 * @returns Company name
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
function randomCompany(): string {
  const prefixes = ['华为', '腾讯', '阿里巴巴', '百度', '字节跳动', '小米', '京东', '美团'];
  const types = ['科技有限公司', '网络技术有限公司', '信息技术有限公司', '软件有限公司'];
  return prefixes[randomInt(0, prefixes.length - 1)] + types[randomInt(0, types.length - 1)];
}

/**
 * Generate random product name
 *
 * @returns Product name
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
function randomProductName(): string {
  const products = ['智能音箱', '无线耳机', '智能手表', '平板电脑', '智能家电', '云服务', '数据分析平台', '企业管理系统'];
  return products[randomInt(0, products.length - 1)];
}

/**
 * Generate random order ID
 *
 * @returns Order ID (format: YYYYMMDD + 8 random digits)
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
function randomOrderId(): string {
  const date = new Date();
  const datePart = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  const randomPart = String(randomInt(10000000, 99999999));
  return datePart + randomPart;
}

/**
 * Generate random bank card number (mock format)
 *
 * @returns Bank card number (16 digits)
 *
 * @author lvdaxianerplus
 * @date 2026-04-19
 */
function randomBankCard(): string {
  const prefixes = ['6222', '6228', '6217', '6225']; // Common bank prefixes
  const prefix = prefixes[randomInt(0, prefixes.length - 1)];
  const rest = String(randomInt(1000000000000, 9999999999999));
  return prefix + rest;
}