const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  MessageFlags
} = require('discord.js');
const { upsertLeaderboardMessage } = require('../../utils/user/leaderboard');
const { ContainerBuilder, TextDisplayBuilder } = require('@discordjs/builders');
const { colors } = require('../../config/botConfig');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('refreshleaderboards')
    .setDescription('Force refresh all configured leaderboards')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  category: 'Admin',
  cooldown: 10,

  async execute(interaction) {
    try {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });

      const results = [];

      // Update guild war leaderboard
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
      console.error('Error refreshing leaderboards:', error);
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

