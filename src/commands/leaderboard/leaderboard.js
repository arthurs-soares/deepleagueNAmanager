/**
 * /leaderboard command - Leaderboard management commands
 * Consolidates: refresh
 */
const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  MessageFlags
} = require('discord.js');
const { ContainerBuilder, TextDisplayBuilder } = require('@discordjs/builders');
const { upsertLeaderboardMessage } = require('../../utils/user/leaderboard');
const { colors } = require('../../config/botConfig');
const LoggerService = require('../../services/LoggerService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Leaderboard management commands')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    // Refresh subcommand
    .addSubcommand(sub =>
      sub.setName('refresh')
        .setDescription('Force refresh all configured leaderboards')
    ),

  category: 'Leaderboard',
  cooldown: 10,

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    switch (subcommand) {
      case 'refresh':
        return this.handleRefresh(interaction);
      default:
        return interaction.reply({
          content: '❌ Unknown subcommand.',
          flags: MessageFlags.Ephemeral
        });
    }
  },

  /**
   * Handle /leaderboard refresh
   */
  async handleRefresh(interaction) {
    try {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });

      const results = [];

      try {
        const guildLbResult = await upsertLeaderboardMessage(interaction.guild);
        if (guildLbResult.ok) {
          results.push('✅ Guild War Leaderboard updated');
        } else {
          results.push(
            `⚠️ Guild War Leaderboard: ${guildLbResult.reason || 'not configured'}`
          );
        }
      } catch (err) {
        results.push(`❌ Guild War Leaderboard: ${err.message}`);
      }

      const container = new ContainerBuilder();
      const primaryColor = typeof colors.primary === 'string'
        ? parseInt(colors.primary.replace('#', ''), 16)
        : colors.primary;
      container.setAccentColor(primaryColor);

      const titleText = new TextDisplayBuilder()
        .setContent('# 🔄 Leaderboards Refresh');

      const resultsText = new TextDisplayBuilder()
        .setContent(results.join('\n'));

      container.addTextDisplayComponents(titleText, resultsText);

      return interaction.editReply({
        components: [container],
        flags: MessageFlags.IsComponentsV2
      });
    } catch (error) {
      LoggerService.error('Error in /leaderboard refresh:', {
        error: error.message
      });
      const msg = {
        content: '❌ Could not refresh leaderboards.',
        flags: MessageFlags.Ephemeral
      };
      if (interaction.deferred || interaction.replied) {
        return interaction.editReply(msg);
      }
      return interaction.reply(msg);
    }
  }
};
