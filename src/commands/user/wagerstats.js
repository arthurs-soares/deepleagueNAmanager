const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { ContainerBuilder, TextDisplayBuilder } = require('@discordjs/builders');
const { colors } = require('../../config/botConfig');
const { getOrCreateUserProfile } = require('../../utils/user/userProfile');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('wagerstats')
    .setDescription('Show detailed wager statistics for a user')
    .addUserOption(opt =>
      opt.setName('user').setDescription('User to inspect').setRequired(false)
    ),

  category: 'User',
  cooldown: 5,

  /**
   * Execute /wagerstats
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
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
  }
};

