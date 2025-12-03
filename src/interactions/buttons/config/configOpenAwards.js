const { buildAwardsViewer } = require('../../../utils/badges/awardsViewer');
const { MessageFlags } = require('discord.js');


/**
 * Opens Manage Awards viewer
 * CustomId: config:badges:awards
 */
async function handle(interaction) {
  try {
    const { embed, rows } = await buildAwardsViewer(interaction.guild, { category: 'all', sort: 'desc', page: 1 });
    return interaction.reply({ components: [embed, ...rows], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
  } catch (error) {
    console.error('Error opening awards viewer:', error);
    const msg = { content: '❌ Could not open the awards viewer.', flags: MessageFlags.Ephemeral };
    if (interaction.deferred || interaction.replied) return interaction.followUp(msg);
    return interaction.reply(msg);
  }
}

module.exports = { handle };

