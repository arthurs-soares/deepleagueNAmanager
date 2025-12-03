const { MessageFlags } = require('discord.js');
const { buildAwardsViewer } = require('../../utils/badges/awardsViewer');
const LoggerService = require('../../services/LoggerService');

/**
 * Update awards viewer filter by type
 * CustomId: badges_awards:filter
 */
async function handle(interaction) {
  try {
    const category = interaction.values?.[0] || 'all';
    const currentFooter = interaction.message?.embeds?.[0]?.data?.footer?.text || '';
    const sortMatch = currentFooter.match(/Sort:\s+(asc|desc)/i);
    const sort = sortMatch ? sortMatch[1].toLowerCase() : 'desc';
    const { embed, rows } = await buildAwardsViewer(interaction.guild, { category, sort, page: 1 });
    return interaction.update({ components: [embed, ...rows], flags: MessageFlags.IsComponentsV2 });
  } catch (error) {
    LoggerService.error('Error updating awards filter:', error);
    const msg = { content: '\u274c Could not apply filter.', ephemeral: true };
    if (interaction.deferred || interaction.replied) return interaction.followUp(msg);
    return interaction.reply(msg);
  }
}

module.exports = { handle };

