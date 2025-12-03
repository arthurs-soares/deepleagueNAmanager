const { buildBadgePanel } = require('../../../utils/badges/badgePanel');
const { replyEphemeral } = require('../../../utils/core/reply');

/**
 * Opens Badges management panel
 * CustomId: config:badges
 */
async function handle(interaction) {
  try {
    const { embed, rows } = await buildBadgePanel(interaction.guild);
    return replyEphemeral(interaction, { components: [embed, ...rows] });
  } catch (error) {
    console.error('Error opening badges panel:', error);
    return replyEphemeral(interaction, { content: '❌ Could not open the badges panel.' });
  }
}

module.exports = { handle };

