/**
 * CLI entry point
 *
 * @author lvdaxianerplus
 * @date 2026-04-18
 */

import { loadConfig } from './config/loader.js';
import { startStdioServer } from './core/server.js';
import { startHttpServer } from './routes/http-server.js';
import { initCache } from './features/cache.js';
import { setLogLevel } from './middleware/logger.js';
import { logger } from './middleware/logger.js';

interface CliArgs {
  configPath: string;
  httpEnabled: boolean;
  transport: string;
  ssePort: number;
  httpPort: number;
}

function parseArgs(): CliArgs {
  const args = process.argv.slice(2);

  const configPath = args.find((a) => !a.startsWith('--')) ?? './tools.json';

  return {
    configPath,
    httpEnabled: args.includes('--http'),
    transport: args.find((a) => a.startsWith('--transport='))?.split('=')[1] ?? 'stdio',
    ssePort: parseInt(args.find((a) => a.startsWith('--sse-port='))?.split('=')[1] ?? '11113', 10),
    httpPort: parseInt(args.find((a) => a.startsWith('--http-port='))?.split('=')[1] ?? '11112', 10),
  };
}

async function main(): Promise<void> {
  const cliArgs = parseArgs();

  // Load and validate configuration
  let config;
  try {
    config = loadConfig(cliArgs.configPath);
  } catch (error) {
    // Configuration load failed - log and exit
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('[启动] MCP server failed to start due to configuration errors', { error: errorMessage });
    process.exit(1);
  }

  // Initialize cache
  if (config.cache) {
    initCache(config.cache);
  }

  // Set log level
  if (config.logging?.level) {
    setLogLevel(config.logging.level);
  }

  logger.info('MCP HTTP Gateway starting...');
  logger.info(`Loaded ${Object.keys(config.tools).length} tools`);

  // Start HTTP server for health checks and dashboard
  if (config.metrics?.enabled || config.healthCheck?.enabled || cliArgs.httpEnabled) {
    startHttpServer({ config });
    logger.info(`Dashboard available at http://localhost:${cliArgs.httpPort}/dashboard`);
  }

  // Start STDIO server for MCP protocol
  try {
    await startStdioServer(config);
  } catch (error) {
    logger.error('Failed to start STDIO server', { error });
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('[ERROR] Unexpected error:', error);
  process.exit(1);
});
