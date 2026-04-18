/**
 * MCP HTTP Gateway - Entry point
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
}

function parseArgs(): CliArgs {
  const args = process.argv.slice(2);

  return {
    configPath: args.find((a) => !a.startsWith('--')) ?? './tools.json',
    httpEnabled: args.includes('--http') || args.includes('--all'),
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
    const port = config.metrics?.port ?? config.healthCheck?.port ?? 11112;
    startHttpServer({ config });
    logger.info(`Dashboard available at http://localhost:${port}/dashboard`);
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
  // Catch unhandled errors during startup
  const errorMessage = error instanceof Error ? error.message : String(error);
  logger.error('[启动] Unexpected error during startup', { error: errorMessage });
  process.exit(1);
});
