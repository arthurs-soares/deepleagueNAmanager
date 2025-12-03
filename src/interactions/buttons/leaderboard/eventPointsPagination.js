const { MessageFlags } = require('discord.js');
const {
  buildEventPointsLeaderboardEmbed
} = require('../../utils/leaderboard/eventPointsLeaderboard');

/**
 * Handle event points leaderboard pagination buttons
 * CustomId: eventpoints_lb:prev:<page> or eventpoints_lb:next:<page>
 */
async function handle(interaction) {
  try {
    await interaction.deferUpdate();

    const [, action, currentPageStr] = interaction.customId.split(':');
    const currentPage = parseInt(currentPageStr, 10) || 1;

    const newPage = action === 'next' ? currentPage + 1 : currentPage - 1;

    const container = await buildEventPointsLeaderboardEmbed(
      interaction.guild,
      newPage,
      20
    );

    await interaction.editReply({
      components: [container],
      flags: MessageFlags.IsComponentsV2
    });
  } catch (error) {
    // Silent fail for pagination
  }
}

module.exports = { handle };
