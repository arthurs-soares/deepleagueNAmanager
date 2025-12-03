const { MessageFlags } = require('discord.js');
const { buildAwardsViewer } = require('../../utils/badges/awardsViewer');
const LoggerService = require('../../services/LoggerService');

/**
 * Update awards viewer sort by date
 * CustomId: badges_awards:sort
 */
async function handle(interaction) {
  try {
    const sort = interaction.values?.[0] || 'desc';
    const currentFooter = interaction.message?.embeds?.[0]?.data?.footer?.text || '';
    const catMatch = currentFooter.match(/Filter:\s+(all|user|guild)/i);
    const category = catMatch ? catMatch[1].toLowerCase() : 'all';
    const { embed, rows } = await buildAwardsViewer(interaction.guild, { category, sort, page: 1 });
    return interaction.update({ components: [embed, ...rows], flags: MessageFlags.IsComponentsV2 });
  } catch (error) {
    LoggerService.error('Error updating awards sort:', error);
    const msg = { content: '\u274c Could not apply sort.', ephemeral: true };
    if (interaction.deferred || interaction.replied) return interaction.followUp(msg);
    return interaction.reply(msg);
  }
}

module.exports = { handle };

