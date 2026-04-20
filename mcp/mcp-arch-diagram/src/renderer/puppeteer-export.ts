/**
 * MCP 架构图生成器 - Puppeteer 图片导出
 *
 * 使用 Puppeteer 内置渲染将 D2/Mermaid 代码转换为图片
 *
 * @author lvdaxianerplus
 * @date 2026-04-20
 */

import puppeteer from 'puppeteer';
import type { ImageFormat } from '../config/types.js';

/**
 * Puppeteer 导出器类
 *
 * 使用 Puppeteer 渲染 Mermaid 图表并导出为图片
 *
 * @author lvdaxianerplus
 * @date 2026-04-20
 */
export class PuppeteerExporter {
  private browser: puppeteer.Browser | null = null;

  /**
   * 初始化 Puppeteer 浏览器
   *
   * @returns 浏览器实例
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  private async initBrowser(): Promise<puppeteer.Browser> {
    // 如果浏览器已存在，直接返回
    if (this.browser) {
      return this.browser;
    }

    // 启动浏览器（无头模式）
    this.browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
      ],
    });

    // 返回浏览器实例
    return this.browser;
  }

  /**
   * 关闭浏览器
   *
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  async closeBrowser(): Promise<void> {
    // 如果浏览器存在，关闭浏览器
    if (this.browser) {
      await this.browser.close();

      // 重置浏览器实例
      this.browser = null;
    }
  }

  /**
   * 构建 Mermaid HTML 页面
   *
   * @param code - Mermaid 代码
   * @returns HTML 字符串
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  private buildMermaidHtml(code: string): string {
    // 构建 HTML 页面，包含 Mermaid CDN
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
  <style>
    body {
      margin: 0;
      padding: 20px;
      background: white;
    }
    .mermaid {
      font-family: 'trebuchet ms', verdana, arial;
    }
  </style>
</head>
<body>
  <div class="mermaid">
    ${code}
  </div>
  <script>
    mermaid.initialize({
      startOnLoad: true,
      theme: 'default',
      securityLevel: 'loose'
    });
  </script>
</body>
</html>
`;

    // 返回 HTML
    return html;
  }

  /**
   * 导出 Mermaid 图表为图片
   *
   * @param code - Mermaid 代码
   * @param format - 图片格式
   * @returns 图片数据（base64）
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  async exportMermaidToImage(code: string, format: ImageFormat): Promise<string> {
    // 初始化浏览器
    const browser = await this.initBrowser();

    // 创建新页面
    const page = await browser.newPage();

    // 构建 HTML 内容
    const html = this.buildMermaidHtml(code);

    // 设置页面内容
    await page.setContent(html, {
      waitUntil: 'networkidle0',
      timeout: 30000,
    });

    // 等待 Mermaid 渲染完成
    await page.waitForSelector('.mermaid svg', {
      timeout: 10000,
    });

    // 获取 SVG 元素
    const svgElement = await page.$('.mermaid svg');

    // 如果找不到 SVG，抛出错误
    if (!svgElement) {
      await page.close();
      throw new Error('Mermaid rendering failed: SVG not found');
    }

    // 获取 SVG 边界框
    const boundingBox = await svgElement.boundingBox();

    // 如果边界框无效，抛出错误
    if (!boundingBox) {
      await page.close();
      throw new Error('Mermaid rendering failed: Invalid bounding box');
    }

    // 调整视口大小
    await page.setViewport({
      width: Math.ceil(boundingBox.width) + 40,
      height: Math.ceil(boundingBox.height) + 40,
    });

    // 截图
    const screenshot = await svgElement.screenshot({
      type: format === 'png' ? 'png' : 'jpeg',
      encoding: 'base64',
    });

    // 关闭页面
    await page.close();

    // 返回 base64 图片数据（encoding: 'base64' 保证返回 string）
    return screenshot as string;
  }

  /**
   * 导出图表为图片（通用方法）
   *
   * @param code - 图表代码（Mermaid）
   * @param engine - 渲染引擎
   * @param format - 图片格式
   * @returns 图片数据（base64）
   * @author lvdaxianerplus
   * @date 2026-04-20
   */
  async exportToImage(code: string, engine: string, format: ImageFormat): Promise<string> {
    // 如果是 Mermaid 引擎
    if (engine === 'mermaid') {
      // 使用 Mermaid 导出
      return await this.exportMermaidToImage(code, format);
    }

    // D2 引擎暂不支持 Puppeteer 渲染（需要 D2 CLI）
    // 返回空字符串，表示降级处理
    throw new Error('D2 engine requires CLI rendering, use code file fallback');
  }
}

/**
 * 创建 Puppeteer 导出器实例
 *
 * @returns Puppeteer 导出器实例
 * @author lvdaxianerplus
 * @date 2026-04-20
 */
export const createPuppeteerExporter = (): PuppeteerExporter => {
  return new PuppeteerExporter();
};