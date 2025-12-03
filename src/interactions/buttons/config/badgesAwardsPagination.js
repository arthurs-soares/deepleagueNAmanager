const { MessageFlags } = require('discord.js');
const { buildAwardsViewer } = require('../../../utils/badges/awardsViewer');
const LoggerService = require('../../../services/LoggerService');

/**
 * Paginate awards viewer
 * CustomId: badges_awards:<action>:<currentPage>[:category:sort]
 */
async function handle(interaction) {
  try {
    const parts = interaction.customId.split(':');
    const action = parts[1];
    const currentPage = parseInt(parts[2], 10) || 1;
    const category = parts[3] || 'all';
    const sort = parts[4] || 'desc';

    // eslint-disable-next-line no-unused-vars
    const pageSizeCalc = (all, pageSize) => Math.max(1, Math.ceil(all / pageSize));

    // Rebuild viewer for target page after computing bounds
    let target = currentPage;
    // Build once to know total pages
    const initial = await buildAwardsViewer(interaction.guild, { category, sort, page: currentPage });
    const footer = initial.embed?.data?.footer?.text || '';
    const match = footer.match(/Page\s+(\d+)\/(\d+)/i);
    const totalPages = match ? parseInt(match[2], 10) : 1;
    if (action === 'next') target = Math.min(currentPage + 1, totalPages);
    if (action === 'prev') target = Math.max(currentPage - 1, 1);

    const { embed, rows } = await buildAwardsViewer(interaction.guild, { category, sort, page: target });
    return interaction.update({ components: [embed, ...rows], flags: MessageFlags.IsComponentsV2 });
  } catch (error) {
    LoggerService.error('Error paginating awards viewer:', error);
    try { return interaction.deferUpdate(); } catch (_) { return; }
  }
}

module.exports = { handle };

