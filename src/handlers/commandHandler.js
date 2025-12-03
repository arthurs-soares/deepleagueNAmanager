const fs = require('fs');
const path = require('path');
const LoggerService = require('../services/LoggerService');

/**
 * Load all slash commands from commands directory
 * @param {Client} client - Discord client instance
 */
async function loadCommands(client) {
  const commandsPath = path.join(__dirname, '../commands');

  if (!fs.existsSync(commandsPath)) {
    LoggerService.info('Commands directory not found, creating...');
    fs.mkdirSync(commandsPath, { recursive: true });
    return;
  }

  const commandFolders = fs.readdirSync(commandsPath);

  for (const folder of commandFolders) {
    const folderPath = path.join(commandsPath, folder);

    if (!fs.statSync(folderPath).isDirectory()) continue;

    const commandFiles = fs.readdirSync(folderPath)
      .filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
      const filePath = path.join(folderPath, file);

      try {
        const command = require(filePath);

        if (!command.data || !command.execute) {
          LoggerService.warn(`Command ${file} is missing required properties`);
          continue;
        }

        // Automatically define category by folder name, if absent
        if (!command.category) {
          command.category = folder;
        }

        client.commands.set(command.data.name, command);
        LoggerService.debug(`Command loaded: ${command.data.name}`);
      } catch (error) {
        LoggerService.error(`Error loading command ${file}:`, {
          error: error?.message
        });
      }
    }
  }

  LoggerService.info(`Loaded ${client.commands.size} commands`);
}

module.exports = { loadCommands };
