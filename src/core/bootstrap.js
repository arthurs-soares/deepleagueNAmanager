const { loadCommands } = require('../handlers/commandHandler');
const { loadEvents } = require('../handlers/eventHandler');
const { connectDatabase } = require('../config/database');
const { ErrorHandler } = require('./ErrorHandler');
const { gracefulShutdown } = require('./shutdown');
const LoggerService = require('../services/LoggerService');

/**
 * Initialize the bot: connect DB, load commands/events, login
 * @param {import('discord.js').Client} client
 */
async function initializeBot(client) {
  return ErrorHandler.safeExecute(async () => {
    LoggerService.info('Starting bot...');

    LoggerService.info('Connecting to database...');
    const dbResult = await connectDatabase();
    if (dbResult && !dbResult.success) {
      LoggerService.warn('Bot starting in limited mode without database');
    }

    LoggerService.info('Loading commands...');
    await loadCommands(client);

    LoggerService.info('Loading events...');
    await loadEvents(client);

    LoggerService.info('Logging into Discord...');
    await client.login(process.env.DISCORD_TOKEN);

    LoggerService.info('Bot initialized successfully!');
  }, {
    module: 'Main',
    operation: 'initialize'
  }, async (error) => {
    LoggerService.error('Critical error during bot initialization:', {
      error: error.message
    });
    await gracefulShutdown(client, 1);
  });
}

module.exports = { initializeBot };

