const { escapeRegex } = require('../../utils/core/validation');

/**
 * Guild query utilities for advanced search operations
 */

/**
 * Search guilds by name with fuzzy matching
 * @param {string} searchTerm - Search term
 * @param {string} discordGuildId - Discord server ID
 * @param {Object} options - Search options
 * @returns {Promise<Array>} Matching guilds
 */
function searchByName(searchTerm, discordGuildId, options = {}) {
  const { limit = 10 } = options;
  const escaped = escapeRegex(String(searchTerm || ''));

  return this.find({
    discordGuildId,
    name: new RegExp(escaped, 'i')
  })
    .sort({ createdAt: -1 })
    .limit(Math.min(limit, 50));
}

/**
 * Get guild leaderboard with ranking
 * @param {string} discordGuildId - Discord server ID
 * @param {Object} options - Options
 * @returns {Promise<Array>} Ranked guilds
 */
function getLeaderboard(discordGuildId, options = {}) {
  const { limit = 20 } = options;

  return this.find({ discordGuildId, status: 'ativa' })
    .sort({ wins: -1, losses: 1, createdAt: 1 })
    .limit(Math.min(limit, 50))
    .select('name leader wins losses createdAt');
}

/**
 * Find guilds by member user ID
 * @param {string} userId - Discord user ID
 * @param {string} discordGuildId - Discord server ID
 * @returns {Promise<Array>} Guilds where user is a member
 */
function findByMember(userId, discordGuildId) {
  return this.find({
    discordGuildId,
    'members.userId': userId
  });
}

/**
 * Find guilds by status
 * @param {string} status - Guild status
 * @param {string} discordGuildId - Discord server ID
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Guilds with specified status
 */
function findByStatus(status, discordGuildId, options = {}) {
  const { limit = 50, sort = { createdAt: -1 } } = options;

  return this.find({ discordGuildId, status })
    .sort(sort)
    .limit(Math.min(limit, 100));
}

/**
 * Apply query methods to guild schema
 * @param {mongoose.Schema} schema - Guild schema
 */
function applyGuildQueries(schema) {
  schema.statics.searchByName = searchByName;
  schema.statics.getLeaderboard = getLeaderboard;
  schema.statics.findByMember = findByMember;
  schema.statics.findByStatus = findByStatus;
}

module.exports = {
  searchByName,
  getLeaderboard,
  findByMember,
  findByStatus,
  applyGuildQueries
};
