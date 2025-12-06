/**
 * /wager command - Wager management commands
 * Consolidates: stats, leaderboard
 */
const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { ContainerBuilder, TextDisplayBuilder } = require('@discordjs/builders');
const { colors } = require('../../config/botConfig');
const { getOrCreateUserProfile } = require('../../utils/user/userProfile');
const { buildWagerLeaderboardEmbed } = require('../../utils/wager/wagerLeaderboard');
const LoggerService = require('../../services/LoggerService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('wager')
    .setDescription('Wager management commands')
    // Stats subcommand
    .addSubcommand(sub =>
      sub.setName('stats')
        .setDescription('Show detailed wager statistics for a user')
        .addUserOption(opt =>
          opt.setName('user')
            .setDescription('User to inspect')
            .setRequired(false)
        )
    )
    // Leaderboard subcommand
    .addSubcommand(sub =>
      sub.setName('leaderboard')
        .setDescription('Show the Wager leaderboard (server members)')
    ),

  category: 'Wager',
  cooldown: 5,

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    switch (subcommand) {
      case 'stats':
        return this.handleStats(interaction);
      case 'leaderboard':
        return this.handleLeaderboard(interaction);
      default:
        return interaction.reply({
          content: '❌ Unknown subcommand.',
          flags: MessageFlags.Ephemeral
        });
    }
  },

  /**
   * Handle /wager stats
   */
  async handleStats(interaction) {
    try {
      const target = interaction.options.getUser('user') || interaction.user;
      const p = await getOrCreateUserProfile(target.id);

      const games = (p.wagerGamesPlayed || 0);
      const wins = (p.wagerWins || 0);
      const losses = (p.wagerLosses || 0);
      const wr = games > 0 ? ((wins / games) * 100).toFixed(1) + '%' : '—';

      const currentStreak = (p.wagerWinStreak && p.wagerWinStreak > 0)
        ? `🔥 ${p.wagerWinStreak} win streak`
        : (p.wagerLossStreak && p.wagerLossStreak > 0)
          ? `❄️ ${p.wagerLossStreak} loss streak`
          : '—';

      const bestStreak = Math.max(0, p.wagerMaxWinStreak || 0);

      const container = new ContainerBuilder();
      const primaryColor = typeof colors.primary === 'string'
        ? parseInt(colors.primary.replace('#', ''), 16)
        : colors.primary;
      container.setAccentColor(primaryColor);

      const titleText = new TextDisplayBuilder()
        .setContent(`# ${target.username}'s Wager Stats`);

      const recordStats = new TextDisplayBuilder()
        .setContent(
          `**Games Played:** ${games}\n` +
          `**Wins:** ${wins}\n` +
          `**Losses:** ${losses}\n` +
          `**Win Rate:** ${wr}`
        );

      const streakStats = new TextDisplayBuilder()
        .setContent(
          `**Current Streak:** ${currentStreak}\n` +
          `**Best Streak:** ${bestStreak}`
        );

      const timestampText = new TextDisplayBuilder()
        .setContent(`*<t:${Math.floor(Date.now() / 1000)}:F>*`);

      container.addTextDisplayComponents(
        titleText,
        recordStats,
        streakStats,
        timestampText
      );

      return interaction.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2
      });
    } catch (error) {
      LoggerService.error('Error in /wager stats:', { error: error.message });
      return interaction.reply({
        content: '❌ An error occurred.',
        flags: MessageFlags.Ephemeral
      });
    }
  },

  /**
   * Handle /wager leaderboard
   */
  async handleLeaderboard(interaction) {
    try {
      const container = await buildWagerLeaderboardEmbed(interaction.guild);
      return interaction.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [] }
      });
    } catch (error) {
      LoggerService.error('Error in /wager leaderboard:', {
        error: error.message
      });
      return interaction.reply({
        content: '❌ An error occurred.',
        flags: MessageFlags.Ephemeral
      });
    }
  }
};
