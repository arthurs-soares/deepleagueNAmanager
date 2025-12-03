const Guild = require('../../models/guild/Guild');

/**
 * Get mentions for wager participants (initiator and opponent)
 * @param {import('../../models/wager/WagerTicket')} ticket
 * @returns {string[]} Array of <@id> mentions
 */
async function getWagerMentions(ticket) {
  if (!ticket) return [];
  const ids = [ticket.initiatorUserId, ticket.opponentUserId].filter(Boolean);
  return Array.from(new Set(ids)).map(id => `<@${id}>`);
}

/**
 * From a guild document, collect leadership and manager userIds
 * @param {object} guildDoc
 * @returns {string[]} userIds
 */
function collectLeadershipIds(guildDoc) {
  if (!guildDoc) return [];
  const ids = [];
  // Add leaders and co-leaders
  const members = Array.isArray(guildDoc.members) ? guildDoc.members : [];
  members
    .filter(m => m && (m.role === 'lider' || m.role === 'vice-lider') && m.userId)
    .forEach(m => ids.push(m.userId));
  // Add managers
  const managers = Array.isArray(guildDoc.managers) ? guildDoc.managers : [];
  managers.filter(Boolean).forEach(managerId => ids.push(managerId));
  return ids;
}

/**
 * Get mentions for war participants (leaders of both guilds)
 * @param {import('../../models/war/War')} warDoc
 * @returns {Promise<string[]>} Array of <@id> mentions (may be empty if not found)
 */
async function getWarMentions(warDoc) {
  try {
    if (!warDoc) return [];
    const [guildA, guildB] = await Promise.all([
      Guild.findById(warDoc.guildAId).lean(),
      Guild.findById(warDoc.guildBId).lean(),
    ]);
    const ids = [...collectLeadershipIds(guildA), ...collectLeadershipIds(guildB)];
    return Array.from(new Set(ids)).map(id => `<@${id}>`);
  } catch (_) {
    return [];
  }
}

module.exports = { getWagerMentions, getWarMentions };

