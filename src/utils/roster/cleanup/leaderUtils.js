/**
 * Determine the leader userId from a guild document.
 * Only considers member with role 'lider'.
 * @param {Object} guildDoc - Guild document with members.
 * @returns {string|null} Leader userId or null if not found.
 */
function getLeaderUserId(guildDoc) {
  const members = Array.isArray(guildDoc?.members) ? guildDoc.members : [];
  const leader = members.find(m => m && m.userId && m.role === 'lider');
  return leader?.userId || null;
}

module.exports = { getLeaderUserId };

