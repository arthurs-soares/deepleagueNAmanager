const fs = require('fs');
const path = require('path');
const LoggerService = require('../services/LoggerService');

/**
 * Load all events from the events directory
 * @param {Client} client - Discord client instance
 */
async function loadEvents(client) {
  const eventsPath = path.join(__dirname, '../events');

  if (!fs.existsSync(eventsPath)) {
    LoggerService.info('Events directory not found, creating...');
    fs.mkdirSync(eventsPath, { recursive: true });
    return;
  }

  const eventFiles = fs.readdirSync(eventsPath)
    .filter(file => file.endsWith('.js'));

  for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);

    try {
      const event = require(filePath);

      if (!event.name || !event.execute) {
        LoggerService.warn(`Event ${file} is missing required properties`);
        continue;
      }

      if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
      } else {
        client.on(event.name, (...args) => event.execute(...args));
      }

      LoggerService.debug(`Loaded event: ${event.name}`);
    } catch (error) {
      LoggerService.error(`Error loading event ${file}:`, {
        error: error?.message
      });
    }
  }

  LoggerService.info('Events loaded successfully');
}

module.exports = { loadEvents };
