const { ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');
const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder } = require('@discordjs/builders');
const { colors, emojis } = require('../../config/botConfig');
const { paginate, buildPaginationComponents } = require('../misc/pagination');
const { listAwards } = require('./awardService');
const GuildModel = require('../../models/guild/Guild');

function fmtEmoji(badge) {
  return badge.animated ? `<a:${badge.emojiName}:${badge.emojiId}>` : `<:${badge.emojiName}:${badge.emojiId}>`;
}

function discordTime(d) {
  try { return `<t:${Math.floor(new Date(d).getTime() / 1000)}:R>`; } catch (_) { return ''; }
}

async function buildAwardsViewer(guild, opts = {}) {
  const category = opts.category || 'all'; // 'all' | 'user' | 'guild'
  const sort = opts.sort || 'desc'; // 'desc' | 'asc'
  const page = Math.max(1, parseInt(opts.page || 1, 10));
  const pageSize = 10;

  const docs = await listAwards(guild.id, { category, sort, limit: 500 });

  // Map guild names
  const guildIds = Array.from(new Set(docs.filter(d => d.category === 'guild' && d.targetGuildId).map(d => String(d.targetGuildId))));
  const guilds = guildIds.length ? await GuildModel.find({ _id: { $in: guildIds } }).select('_id name').lean() : [];
  const guildMap = new Map(guilds.map(g => [String(g._id), g.name]));

  const { slice, page: safePage, totalPages } = paginate(docs, page, pageSize);

  const lines = slice.map(d => {
    const badge = d.badgeId;
    const e = fmtEmoji(badge);
    const target = d.category === 'user' ? `<@${d.targetUserId}>` : (guildMap.get(String(d.targetGuildId)) || 'Unknown Guild');
    const reason = d.reason ? ` — ${d.reason}` : '';
    const by = `by <@${d.awardedByUserId}>`;
    const when = discordTime(d.createdAt);
    return `${e} ${badge.name} — ${target} — ${by} — ${when}${reason}`;
  });

  const container = new ContainerBuilder();

  // Convert color to integer if it's a hex string
  const primaryColor = typeof colors.primary === 'string'
    ? parseInt(colors.primary.replace('#', ''), 16)
    : colors.primary;
  container.setAccentColor(primaryColor);

  const titleText = new TextDisplayBuilder()
    .setContent(`# ${emojis.leaderboard} Manage Awards`);

  const contentText = new TextDisplayBuilder()
    .setContent(lines.length ? lines.join('\n') : 'No awards yet.');

  const footerText = new TextDisplayBuilder()
    .setContent(`*Page ${safePage}/${totalPages} • Filter: ${category} • Sort: ${sort}*`);

  container.addTextDisplayComponents(titleText);
  container.addSeparatorComponents(new SeparatorBuilder());
  container.addTextDisplayComponents(contentText);
  container.addTextDisplayComponents(footerText);

  // Filters row
  const typeSelect = new StringSelectMenuBuilder()
    .setCustomId('badges_awards:filter')
    .setPlaceholder('Filter by type')
    .setMinValues(1).setMaxValues(1)
    .setOptions([
      new StringSelectMenuOptionBuilder().setLabel('All').setValue('all').setDefault(category === 'all'),
      new StringSelectMenuOptionBuilder().setLabel('User').setValue('user').setDefault(category === 'user'),
      new StringSelectMenuOptionBuilder().setLabel('Guild').setValue('guild').setDefault(category === 'guild'),
    ]);

  const sortSelect = new StringSelectMenuBuilder()
    .setCustomId('badges_awards:sort')
    .setPlaceholder('Sort by date')
    .setMinValues(1).setMaxValues(1)
    .addOptions(
      new StringSelectMenuOptionBuilder().setLabel('Newest first').setValue('desc').setDefault(sort === 'desc'),
      new StringSelectMenuOptionBuilder().setLabel('Oldest first').setValue('asc').setDefault(sort === 'asc'),
    );

  // Separate the select menus into different rows to avoid component width exceeded error
  const typeFilterRow = new ActionRowBuilder().addComponents(typeSelect);
  const sortFilterRow = new ActionRowBuilder().addComponents(sortSelect);

  // Remove select for current page items
  const removeOptions = slice.map(d => new StringSelectMenuOptionBuilder()
    .setLabel(`${d.badgeId?.name || 'Badge'} — ${d.category === 'user' ? `User ${d.targetUserId}` : (guildMap.get(String(d.targetGuildId)) || 'Guild')}`.slice(0, 100))
    .setValue(String(d._id))
  );

  let removeRow = null;
  if (removeOptions.length) {
    const removeSelect = new StringSelectMenuBuilder()
      .setCustomId(`badges_awards:removeSelect:${category}:${sort}:${safePage}`)
      .setPlaceholder('Select an award to remove')
      .setMinValues(1).setMaxValues(1)
      .setOptions(removeOptions);
    removeRow = new ActionRowBuilder().addComponents(removeSelect);
  }

  const state = `${category}:${sort}`;
  const paginateRows = docs.length > pageSize
    ? buildPaginationComponents('badges_awards', safePage, totalPages, { state })
    : [];

  return { container, rows: [typeFilterRow, sortFilterRow, ...(removeRow ? [removeRow] : []), ...paginateRows] };
}

module.exports = { buildAwardsViewer };

