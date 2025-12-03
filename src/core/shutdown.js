const serviceContainer = require('./ServiceContainer');
const { disconnectDatabase } = require('../config/database');
const LoggerService = require('../services/LoggerService');

/**
 * Enhanced graceful shutdown procedure
 * @param {import('discord.js').Client} client
 * @param {number} exitCode
 */
async function gracefulShutdown(client, exitCode = 0) {
  LoggerService.info('Starting graceful shutdown...');

  try {
    // Clean up rate limiting service
    if (serviceContainer.has('rateLimitService')) {
      const rateLimitService = serviceContainer.get('rateLimitService');
      rateLimitService.stopCleanup();
    }

    // Clear service container
    serviceContainer.clear();

    // Disconnect from database
    await disconnectDatabase();

    // Destroy Discord client
    if (client) {
      client.destroy();
    }

    LoggerService.info('Shutdown completed');
  } catch (error) {
    LoggerService.error('Error during shutdown:', { error: error.message });
  } finally {
    process.exit(exitCode);
  }
}

module.exports = { gracefulShutdown };

