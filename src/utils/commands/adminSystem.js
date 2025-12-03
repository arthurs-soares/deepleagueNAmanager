/**
 * Admin system handlers
 * Extracted from admin.js to comply with max-lines rule
 */
const mongoose = require('mongoose');
const { ContainerBuilder, TextDisplayBuilder } = require('@discordjs/builders');
const { MessageFlags } = require('discord.js');
const { isDatabaseConnected, resetConnectionState } = require('../../config/database');
const { syncRosterForum } = require('../../utils/roster/rosterForumSync');
const { countGuildsByDiscordGuildId } = require('../../utils/guilds/guildRepository');
const LoggerService = require('../../services/LoggerService');

/**
 * Handle /admin system sync
 * @param {ChatInputCommandInteraction} interaction - Interaction
 * @returns {Promise<void>}
 */
async function sync(interaction) {
  try {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    await syncRosterForum(interaction.guild);
    const count = await countGuildsByDiscordGuildId(interaction.guild.id);
    return interaction.editReply({
      content: `✅ Synchronization completed. Guilds processed: ${count}.`
    });
  } catch (error) {
    LoggerService.error('Error in /admin system sync:', {
      error: error?.message
    });
    return interaction.editReply({
      content: '❌ An error occurred during synchronization.'
    });
  }
}

/**
 * Handle /admin system db-status
 * @param {ChatInputCommandInteraction} interaction - Interaction
 * @returns {Promise<void>}
 */
async function dbStatus(interaction) {
  const container = new ContainerBuilder();
  const color = isDatabaseConnected() ? 0x00ff00 : 0xff0000;
  container.setAccentColor(color);

  const connectionState = mongoose.connection.readyState;
  const stateNames = {
    0: 'Disconnected',
    1: 'Connected',
    2: 'Connecting',
    3: 'Disconnecting'
  };

  const titleText = new TextDisplayBuilder()
    .setContent('# 🗄️ Database Connection Status');

  let statusContent = `**🔌 State:** ${stateNames[connectionState]}\n`;
  statusContent += `**✅ Connected:** ${isDatabaseConnected() ? 'Yes' : 'No'}\n`;
  statusContent += `**🏷️ Database:** ${mongoose.connection.name || 'N/A'}`;

  if (mongoose.connection.host) {
    statusContent += `\n**🌐 Host:** ${mongoose.connection.host}`;
  }
  if (connectionState === 1) {
    const collCount = Object.keys(mongoose.connection.collections).length;
    statusContent += `\n**📊 Collections:** ${collCount}`;
  }

  const statusText = new TextDisplayBuilder().setContent(statusContent);
  const timestampText = new TextDisplayBuilder()
    .setContent(`*<t:${Math.floor(Date.now() / 1000)}:F>*`);

  container.addTextDisplayComponents(titleText, statusText, timestampText);

  await interaction.reply({
    components: [container],
    flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
  });
}

/**
 * Handle /admin system db-reset
 * @param {ChatInputCommandInteraction} interaction - Interaction
 * @returns {Promise<void>}
 */
async function dbReset(interaction) {
  try {
    resetConnectionState();

    const container = new ContainerBuilder();
    container.setAccentColor(0xffaa00);

    const titleText = new TextDisplayBuilder()
      .setContent('# 🔄 Database Connection Reset');

    const descText = new TextDisplayBuilder()
      .setContent('Database connection state has been reset.');

    const timestampText = new TextDisplayBuilder()
      .setContent(`*<t:${Math.floor(Date.now() / 1000)}:F>*`);

    container.addTextDisplayComponents(titleText, descText, timestampText);

    await interaction.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
    });
  } catch (error) {
    await interaction.reply({
      content: `❌ Error resetting connection: ${error.message}`,
      flags: MessageFlags.Ephemeral
    });
  }
}

module.exports = {
  sync,
  dbStatus,
  dbReset
};
