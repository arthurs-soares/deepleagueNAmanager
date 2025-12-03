const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder } = require('@discordjs/builders');
const { colors, emojis } = require('../../config/botConfig');
const War = require('../../models/war/War');

/**
 * Fetch guild war history (most recent first)
 * NOTE: Used in production; unit tests use only the builder below.
 * @param {string} discordGuildId - Discord server ID
 * @param {string} guildId - Guild ObjectId
 */
async function fetchGuildWars(discordGuildId, guildId, limit = 10) {
  const wars = await War.find({
    discordGuildId,
    $or: [{ guildAId: guildId }, { guildBId: guildId }]
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
  return wars;
}

/**
 * Build a container with guild history using Components v2
 * Kept synchronous to allow use in tests without MongoDB connection.
 * @param {Object} guild - Guild document/object (can be mock)
 * @param {Array} wars - List of wars (can be mock)
 * @param {Object} [idToName] - Optional map of GuildId -> Guild Name
 * @returns {ContainerBuilder}
 */
function buildGuildHistoryEmbed(guild, wars, idToName = {}) {
  const safeWars = Array.isArray(wars) ? wars : [];

  const container = new ContainerBuilder();

  // Set accent color from guild or default
  const guildColor = guild && guild.color
    ? (typeof guild.color === 'string' ? parseInt(guild.color.replace('#', ''), 16) : guild.color)
    : (typeof colors.primary === 'string' ? parseInt(colors.primary.replace('#', ''), 16) : colors.primary);
  container.setAccentColor(guildColor);

  // Header
  const titleText = new TextDisplayBuilder()
    .setContent(`# ${emojis.history} War History — ${guild?.name || '—'}`);
  const descText = new TextDisplayBuilder()
    .setContent(
      safeWars.length
        ? `${emojis.info} Recent matches:`
        : `${emojis.warning} No matches recorded.`
    );

  container.addTextDisplayComponents(titleText, descText);

  if (safeWars.length) {
    container.addSeparatorComponents(new SeparatorBuilder());

    safeWars.slice(0, 10).forEach((w) => {
      const when = w.scheduledAt
        ? `<t:${Math.floor(new Date(w.scheduledAt).getTime() / 1000)}:f>`
        : '—';
      const status = w.status || 'open';
      let result = '—';
      if (w.status === 'finalizada') {
        result =
          String(w.winnerGuildId) === String(guild?._id)
            ? 'Victory 🟢'
            : 'Defeat 🔴';
      }
      const opponentId =
        String(w.guildAId) === String(guild?._id)
          ? String(w.guildBId)
          : String(w.guildAId);
      const opponentName =
        (opponentId && idToName[String(opponentId)]) || 'Unknown guild';

      const warText = new TextDisplayBuilder()
        .setContent(
          `**${result} • vs ${opponentName} • ${status}**\n` +
          `${emojis.schedule} When: ${when}\n` +
          `${emojis.channel} Channel: ` +
          (w.channelId
            ? `<#${w.channelId}>`
            : (w.threadId ? `<#${w.threadId}>` : '—'))
        );

      container.addTextDisplayComponents(warText);
    });
  }

  return container;
}

module.exports = { fetchGuildWars, buildGuildHistoryEmbed };

