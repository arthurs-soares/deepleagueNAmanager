require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

const commands = [];
// Ajuste de caminho: os comandos ficam em src/commands
const commandsPath = path.join(__dirname, '../../commands');

// Verifica flag --clear
const shouldClear = process.argv.includes('--clear');

/**
 * Load all commands for deployment
 */
function loadCommandsForDeployment() {
  if (!fs.existsSync(commandsPath)) {
    console.log('Commands directory not found');
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
      const command = require(filePath);

      if (command.data) {
        commands.push(command.data.toJSON());
        console.log(`Command loaded for deployment: ${command.data.name}`);
      }
    }
  }
}

/**
 * Clear all existing commands
 */
async function clearCommands() {
  const rest = new REST().setToken(process.env.DISCORD_TOKEN);

  try {
    console.log('🗑️ Clearing existing commands...');

    // If GUILD_ID is defined, clear both server and global commands to avoid duplications
    if (process.env.GUILD_ID) {
      await rest.put(
        Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
        { body: [] }
      );
      console.log('✅ Server commands cleared successfully.');

      await rest.put(
        Routes.applicationCommands(process.env.CLIENT_ID),
        { body: [] }
      );
      console.log('✅ Global commands cleared successfully.');
    } else {
      // Without GUILD_ID, we can only clear global commands
      await rest.put(
        Routes.applicationCommands(process.env.CLIENT_ID),
        { body: [] }
      );
      console.log('✅ Global commands cleared successfully.');
    }
  } catch (error) {
    console.error('❌ Error clearing commands:', error);
  }
}

/**
 * Clear global commands to avoid duplications when using GUILD_ID
 * @param {import('discord.js').REST} rest
 */
async function clearGlobalCommands(rest) {
  try {
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: [] }
    );
    console.log('🧹 Global commands cleared to avoid duplications.');
  } catch (error) {
    console.warn('⚠️ Warning: failed to clear global commands:', error?.message || error);
  }
}


/**
 * Deploy commands to Discord
 */
async function deployCommands() {
  // In tests, skip real network calls to avoid side effects
  const isTest = process.env.NODE_ENV === 'test';

  // Clear commands first if --clear flag is provided
  if (shouldClear && !isTest) {
    await clearCommands();
    console.log(''); // Empty line for better readability
  }

  loadCommandsForDeployment();

  if (commands.length === 0) {
    console.log('No commands to deploy');
    return;
  }

  if (isTest) {
    console.log(`🚀 [TEST MODE] Would refresh ${commands.length} application (/) commands (skipped).`);
    return;
  }

  const rest = new REST().setToken(process.env.DISCORD_TOKEN);

  try {
    console.log(`🚀 Starting refresh of ${commands.length} application (/) commands.`);

    // Deploy to specific server (faster for development)
    if (process.env.GUILD_ID) {
      const data = await rest.put(
        Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
        { body: commands }
      );
      console.log(`✅ ${data.length} server commands updated successfully.`);
    } else {
      // Global deploy (takes up to 1 hour)
      const data = await rest.put(
        Routes.applicationCommands(process.env.CLIENT_ID),
        { body: commands }
      );
      console.log(`✅ ${data.length} global commands updated successfully.`);
    }
  } catch (error) {
    console.error('❌ Error deploying commands:', error);
  }
}

deployCommands();
