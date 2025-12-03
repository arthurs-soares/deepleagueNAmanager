const { MessageFlags } = require('discord.js');
const { paginate, buildPaginationComponents } = require('../../../utils/misc/pagination');
const { listGuilds } = require('../../../utils/guilds/guildManager');
const { buildGuildsEmbed } = require('../../../utils/embeds/guildsEmbed');

/**
 * Atualiza a embed das guildas para a página selecionada
 * Expected CustomId: guildas_page:<action>:<currentPage>[:state]
 * - action: prev|next
 * - currentPage: página exibida antes do clique (1-indexed)
 */
async function handle(interaction) {
  const { customId, guild } = interaction;

  // Acknowledge early to avoid Unknown interaction (10062) on slow DB calls
  try { await interaction.deferUpdate(); } catch (_) {}

  const parts = customId.split(':');
  const action = parts[1];
  const currentPage = parseInt(parts[2], 10) || 1;

  const allGuilds = await listGuilds(guild.id);
  const pageSize = 15;
  const { totalPages } = paginate(allGuilds, 1, pageSize);

  let targetPage = currentPage;
  if (action === 'next') targetPage = Math.min(currentPage + 1, totalPages);
  if (action === 'prev') targetPage = Math.max(currentPage - 1, 1);

  const container = buildGuildsEmbed(allGuilds, targetPage, pageSize);
  const components = buildPaginationComponents('guildas_page', container.page, container.totalPages);

  // After deferring, edit the original message instead of calling update()
  await interaction.message?.edit({
    components: [container, ...components],
    flags: MessageFlags.IsComponentsV2
  });
}

module.exports = { handle };

