const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { ContainerBuilder, TextDisplayBuilder } = require('@discordjs/builders');
const mongoose = require('mongoose');
const { isDatabaseConnected, resetConnectionState } = require('../../config/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('database-status')
    .setDescription('Check database connection status and manage connection')
    .addSubcommand(subcommand =>
      subcommand
        .setName('status')
        .setDescription('Show current database connection status')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('reset')
        .setDescription('Reset database connection state (admin only)')
    ),

  async execute(interaction) {
    // Check if user has admin permissions
    if (!interaction.member.permissions.has('Administrator')) {
      return interaction.reply({
        content: '❌ You need Administrator permissions to use this command.',
        flags: MessageFlags.Ephemeral
      });
    }

    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'status') {
      const container = new ContainerBuilder();
      const color = isDatabaseConnected() ? 0x00ff00 : 0xff0000;
      container.setAccentColor(color);

      // Connection status
      const connectionState = mongoose.connection.readyState;
      const stateNames = {
        0: 'Disconnected',
        1: 'Connected',
        2: 'Connecting',
        3: 'Disconnecting'
      };

      const titleText = new TextDisplayBuilder()
        .setContent('# 🗄️ Database Connection Status');

      let statusContent = `**🔌 Connection State:** ${stateNames[connectionState]} (${connectionState})\n`;
      statusContent += `**✅ Is Connected:** ${isDatabaseConnected() ? 'Yes' : 'No'}\n`;
      statusContent += `**🏷️ Database Name:** ${mongoose.connection.name || 'N/A'}`;

      if (mongoose.connection.host) {
        statusContent += `\n**🌐 Host:** ${mongoose.connection.host}`;
      }

      if (connectionState === 1) {
        statusContent += `\n**📊 Collections:** ${Object.keys(mongoose.connection.collections).length} collections`;
      }

      const statusText = new TextDisplayBuilder()
        .setContent(statusContent);

      const timestampText = new TextDisplayBuilder()
        .setContent(`*<t:${Math.floor(Date.now() / 1000)}:F>*`);

      container.addTextDisplayComponents(titleText, statusText, timestampText);

      await interaction.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
      });

    } else if (subcommand === 'reset') {
      try {
        resetConnectionState();

        const container = new ContainerBuilder();
        container.setAccentColor(0xffaa00);

        const titleText = new TextDisplayBuilder()
          .setContent('# 🔄 Database Connection Reset');

        const descText = new TextDisplayBuilder()
          .setContent('Database connection state has been reset. The bot will attempt to reconnect automatically.');

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
  }
};
