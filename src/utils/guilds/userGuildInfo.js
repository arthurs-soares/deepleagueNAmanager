const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder } = require('@discordjs/builders');
const { colors, emojis } = require('../../config/botConfig');
const { isDatabaseConnected } = require('../../config/database');
const Guild = require('../../models/guild/Guild');

/**
 * Return user's guild information, if any
 * - Search for member (lider/vice/membro) and presence in main/sub rosters
 * - Also checks region-specific rosters
 * @param {string} discordGuildId - Discord server ID
 * @param {string} userId - User ID
 * @returns {Promise<{ guild: any|null, role: string|null, joinedAt: Date|null }>}
 */
async function getUserGuildInfo(discordGuildId, userId) {
  if (!discordGuildId || !userId) return { guild: null, role: null, joinedAt: null };

  if (!isDatabaseConnected()) {
    console.warn('[getUserGuildInfo] Database not connected');
    return { guild: null, role: null, joinedAt: null };
  }

  try {
    // Search for guilds where user is in members, legacy rosters, or region rosters
    const candidates = await Guild.find({
      discordGuildId,
      $or: [
        { members: { $elemMatch: { userId } } },
        { mainRoster: userId },
        { subRoster: userId },
        { 'regions.mainRoster': userId },
        { 'regions.subRoster': userId }
      ]
    }).sort({ createdAt: -1 });

    if (!candidates?.length) return { guild: null, role: null, joinedAt: null };

    const guild = candidates[0];
    const members = Array.isArray(guild.members) ? guild.members : [];
    const member = members.find(m => m.userId === userId) || null;

    if (member?.role === 'lider') {
      return { guild, role: 'lider', joinedAt: member.joinedAt || null };
    }
    if (member?.role === 'vice-lider') {
      return { guild, role: 'vice-lider', joinedAt: member.joinedAt || null };
    }
    if (member) {
      return { guild, role: 'membro', joinedAt: member.joinedAt || null };
    }

    // Check legacy global rosters
    if (Array.isArray(guild.mainRoster) && guild.mainRoster.includes(userId)) {
      return { guild, role: 'main', joinedAt: null };
    }
    if (Array.isArray(guild.subRoster) && guild.subRoster.includes(userId)) {
      return { guild, role: 'sub', joinedAt: null };
    }

    // Check region-specific rosters
    if (Array.isArray(guild.regions)) {
      for (const r of guild.regions) {
        const main = Array.isArray(r.mainRoster) ? r.mainRoster : [];
        const sub = Array.isArray(r.subRoster) ? r.subRoster : [];
        if (main.includes(userId)) return { guild, role: 'main', joinedAt: null };
        if (sub.includes(userId)) return { guild, role: 'sub', joinedAt: null };
      }
    }

    return { guild: null, role: null, joinedAt: null };
  } catch (error) {
    console.error('[getUserGuildInfo] Error querying guild:', error);
    return { guild: null, role: null, joinedAt: null };
  }
}

/**
 * Constrói um container com informações de guildas relacionadas ao usuário
 * - Usado em testes e em fluxos simples sem dependência de DB
 * @param {{ id:string, tag?:string }} user
 * @param {Array} guilds - lista de guildas simples
 */
function buildUserGuildInfoEmbed(user, guilds = []) {
  const container = new ContainerBuilder();
  const primaryColor = typeof colors.primary === 'string'
    ? parseInt(colors.primary.replace('#', ''), 16)
    : colors.primary;
  container.setAccentColor(primaryColor);

  const titleText = new TextDisplayBuilder()
    .setContent(`# ${emojis.info} Informações de Guilda do Usuário`);

  const descText = new TextDisplayBuilder()
    .setContent(`Usuário: <@${user?.id || '—'}> ${user?.tag ? `(${user.tag})` : ''}`.trim());

  container.addTextDisplayComponents(titleText, descText);
  container.addSeparatorComponents(new SeparatorBuilder());

  if (Array.isArray(guilds) && guilds.length) {
    guilds.forEach((g, i) => {
      const guildText = new TextDisplayBuilder()
        .setContent(
          `**${i + 1}. ${g.name || 'Guild'}**\n` +
          `Leader: ${g.leader || '—'} • Members: ${(g.members || []).length}`
        );
      container.addTextDisplayComponents(guildText);
    });
  } else {
    const footerText = new TextDisplayBuilder()
      .setContent('*No related guilds found.*');
    container.addTextDisplayComponents(footerText);
  }

  const timestampText = new TextDisplayBuilder()
    .setContent(`*<t:${Math.floor(Date.now() / 1000)}:F>*`);
  container.addTextDisplayComponents(timestampText);

  return container;
}

module.exports = { getUserGuildInfo, buildUserGuildInfoEmbed };

