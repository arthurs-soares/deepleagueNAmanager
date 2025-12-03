const { escapeRegex } = require('../../utils/core/validation');

/**
 * Guild static methods for database operations
 */

/**
 * Find guild by name (case-insensitive)
 * @param {string} name - Guild name
 * @param {string} discordGuildId - Discord server ID
 * @returns {Promise} Promise with found guild
 */
function findByName(name, discordGuildId) {
  const safe = escapeRegex(String(name || ''));
  return this.findOne({
    name: new RegExp(`^${safe}$`, 'i'),
    discordGuildId
  });
}

/**
 * List guilds from a server with pagination
 * @param {string} discordGuildId - Discord server ID
 * @param {Object} options - Pagination options
 * @returns {Promise} Promise with found guilds
 */
function findByDiscordGuild(discordGuildId, options = {}) {
  const { page = 1, limit = 50, sort = { createdAt: -1 } } = options;
  const skip = (page - 1) * limit;

  return this.find({ discordGuildId })
    .sort(sort)
    .skip(skip)
    .limit(Math.min(limit, 100)); // Cap at 100 to prevent abuse
}

/**
 * Get total count of guilds for a Discord server
 * @param {string} discordGuildId - Discord server ID
 * @returns {Promise<number>} Total count
 */
function countByDiscordGuild(discordGuildId) {
  return this.countDocuments({ discordGuildId });
}

/**
 * Get paginated guilds with metadata
 * @param {string} discordGuildId - Discord server ID
 * @param {Object} options - Pagination options
 * @returns {Promise<Object>} Guilds with pagination info
 */
async function getPaginatedGuilds(discordGuildId, options = {}) {
  const { page = 1, limit = 50 } = options;
  const actualLimit = Math.min(limit, 100);

  const [guilds, total] = await Promise.all([
    this.findByDiscordGuild(discordGuildId, options),
    this.countByDiscordGuild(discordGuildId)
  ]);

  return {
    guilds,
    pagination: {
      page,
      limit: actualLimit,
      total,
      pages: Math.ceil(total / actualLimit),
      hasNext: page * actualLimit < total,
      hasPrev: page > 1
    }
  };
}

/**
 * Apply all static methods to guild schema
 * @param {mongoose.Schema} schema - Guild schema
 */
function applyGuildStatics(schema) {
  schema.statics.findByName = findByName;
  schema.statics.findByDiscordGuild = findByDiscordGuild;
  schema.statics.countByDiscordGuild = countByDiscordGuild;
  schema.statics.getPaginatedGuilds = getPaginatedGuilds;
}

module.exports = {
  findByName,
  findByDiscordGuild,
  countByDiscordGuild,
  getPaginatedGuilds,
  applyGuildStatics
};
