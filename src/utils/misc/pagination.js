const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const DEFAULT_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutos

/**
 * Calculates pagination metadata and slices items
 * @param {Array} items - Lista completa
 * @param {number} page - Página atual (1-indexed)
 * @param {number} pageSize - Itens por página
 */
function paginate(items, page = 1, pageSize = 15) {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  const end = start + pageSize;
  const slice = items.slice(start, end);
  return { slice, page: safePage, total, totalPages };
}

/**
 * Cria componentes de navegação (Anterior/Próxima) com estado correto
 * @param {string} baseCustomId - CustomId prefix (e.g., 'guildas_page')
 * @param {number} page - Página atual (1-indexed)
 * @param {number} totalPages - Total de páginas
 * @param {object} [opts]
 * @param {string} [opts.state] - Estado adicional para serializar (ex: guildId)
 * @returns {ActionRowBuilder[]}
 */
function buildPaginationComponents(baseCustomId, page, totalPages, opts = {}) {
  const state = opts.state ? `:${opts.state}` : '';
  const prevId = `${baseCustomId}:prev:${page}${state}`;
  const nextId = `${baseCustomId}:next:${page}${state}`;

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(prevId)
      .setLabel('Previous')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page <= 1),
    new ButtonBuilder()
      .setCustomId(nextId)
      .setLabel('Next')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page >= totalPages)
  );

  return [row];
}

module.exports = {
  DEFAULT_TIMEOUT_MS,
  paginate,
  buildPaginationComponents,
};

