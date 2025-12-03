const { MessageFlags } = require('discord.js');
const {
  setEventPointsLeaderboardChannel
} = require('../../utils/system/serverSettings');
const {
  upsertEventPointsLeaderboard
} = require('../../utils/leaderboard/eventPointsLeaderboard');
const LoggerService = require('../../services/LoggerService');

/**
 * Receive channel selection for event points leaderboard
 * CustomId: config:channels:selectEventPointsLeaderboard
 */
async function handle(interaction) {
  try {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const channelId = interaction.values?.[0];
    if (!channelId) {
      return interaction.editReply({ content: 'Action cancelled.' });
    }

    await setEventPointsLeaderboardChannel(interaction.guild.id, channelId);

    // Try to publish/update now (not critical if it fails)
    try {
      await upsertEventPointsLeaderboard(interaction.guild);
    } catch (err) {
      LoggerService.warn('Failed to publish event points leaderboard', {
        error: err?.message
      });
    }

    return interaction.editReply({
      content: `✅ Event points leaderboard channel set to <#${channelId}>.`
    });
  } catch (error) {
    LoggerService.error('Error setting event points leaderboard channel', {
      error: error?.message
    });
    const msg = {
      content: '❌ Could not set the event points leaderboard channel.',
      flags: MessageFlags.Ephemeral
    };
    if (interaction.deferred || interaction.replied) {
      return interaction.editReply(msg);
    }
    return interaction.reply(msg);
  }
}

module.exports = { handle };
