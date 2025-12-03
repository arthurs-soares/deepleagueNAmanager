const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder } = require('@discordjs/builders');
const { colors, emojis } = require('../../config/botConfig');
const { paginate } = require('../misc/pagination');

/**
 * Build the paginated guild list using Components v2
 * Returns the ContainerBuilder and attaches metadata (page, totalPages, slice) to it
 * to make it compatible with existing use cases and unit tests.
 * @param {Array} allGuilds - Complete list of guilds
 * @param {number} page - Desired page (1-indexed)
 * @param {number} pageSize - Items per page (default 15)
 * @returns {ContainerBuilder & { page:number, totalPages:number, slice:Array }}
 */
function buildGuildsEmbed(allGuilds, page = 1, pageSize = 15) {
  const { slice, page: safePage, totalPages } = paginate(allGuilds, page, pageSize);

  const container = new ContainerBuilder();

  // Set accent color
  const primaryColor = typeof colors.primary === 'string'
    ? parseInt(colors.primary.replace('#', ''), 16)
    : colors.primary;
  container.setAccentColor(primaryColor);

  // Header
  const titleText = new TextDisplayBuilder()
    .setContent(`# ${emojis.guild} Registered Guilds`);
  const descText = new TextDisplayBuilder()
    .setContent(`Total guilds: **${allGuilds.length}**`);

  container.addTextDisplayComponents(titleText, descText);
  container.addSeparatorComponents(new SeparatorBuilder());

  // Base index to display correct numbering according to page
  const baseIndex = (safePage - 1) * pageSize;

  // Handle case when there are no guilds to display
  if (!slice || slice.length === 0) {
    const noGuildsText = new TextDisplayBuilder()
      .setContent('**No Guilds Found**\nThere are no guilds to display on this page.');
    container.addTextDisplayComponents(noGuildsText);
  } else {
    // List each guild with a clear line
    slice.forEach((g, idx) => {
      // Validate guild object
      if (!g || typeof g !== 'object') {
        return; // Skip invalid guild objects
      }

      const statusEmoji = g.status === 'ativa' ? '🟢' : g.status === 'inativa' ? '🟡' : '🔴';
      const wins = g.wins || 0;
      const losses = g.losses || 0;
      const leaderMember = (Array.isArray(g.members) ? g.members : []).find(m => m.role === 'lider');
      const leaderDisplay = leaderMember?.userId ? `<@${leaderMember.userId}>` : (g.leader || '—');

      // Guild name and info
      const guildName = g.name || 'Unknown Guild';
      const createdAtTs = g.createdAt ? Math.floor(new Date(g.createdAt).getTime() / 1000) : null;
      const createdTxt = createdAtTs ? `<t:${createdAtTs}:R>` : '—';

      const guildText = new TextDisplayBuilder()
        .setContent(
          `**${baseIndex + idx + 1}. ${statusEmoji} ${guildName}**\n` +
          `Leader: ${leaderDisplay} • W/L: ${wins}/${losses} • Status: ${g.status || '—'} • Created: ${createdTxt}`
        );

      container.addTextDisplayComponents(guildText);
    });
  }

  // Footer with pagination info
  if (totalPages > 1) {
    const footerText = new TextDisplayBuilder()
      .setContent(`*Page ${safePage} of ${totalPages}*`);
    container.addTextDisplayComponents(footerText);
  }

  // Attach metadata to the container itself to serve both uses
  container.page = safePage;
  container.totalPages = totalPages;
  container.slice = slice;

  return container;
}

module.exports = { buildGuildsEmbed };
