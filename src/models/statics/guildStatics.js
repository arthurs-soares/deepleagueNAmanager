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
 * Find guild by name AND region (case-insensitive)
 * Allows same name in different regions
 * @param {string} name - Guild name
 * @param {string} discordGuildId - Discord server ID
 * @param {string} region - Region name
 * @returns {Promise} Promise with found guild
 */
function findByNameAndRegion(name, discordGuildId, region) {
  const safe = escapeRegex(String(name || ''));
  return this.findOne({
    name: new RegExp(`^${safe}$`, 'i'),
    discordGuildId,
    'regions.region': region
  });
}

/**
 * Find guilds by region
 * @param {string} discordGuildId - Discord server ID
 * @param {string} region - Region name
 * @returns {Promise} Guilds active in that region
 */
function findByRegion(discordGuildId, region) {
  return this.find({
    discordGuildId,
    'regions.region': region,
    'regions.status': 'active'
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
 * Get guild's stats for a specific region
 * @param {Object} guildDoc - Guild document
 * @param {string} region - Region name
 * @returns {Object|null} Region stats or null
 */
function getRegionStats(guildDoc, region) {
  if (!guildDoc?.regions) return null;
  return guildDoc.regions.find(r => r.region === region) || null;
}

/**
 * Check if guild is registered in a region
 * @param {Object} guildDoc - Guild document
 * @param {string} region - Region name
 * @returns {boolean}
 */
function isRegisteredInRegion(guildDoc, region) {
  return guildDoc?.regions?.some(r => r.region === region) || false;
}

/**
 * Get first active region for a guild
 * @param {Object} guildDoc - Guild document
 * @returns {Object|null} First active region stats
 */
function getFirstActiveRegion(guildDoc) {
  if (!guildDoc?.regions?.length) return null;
  return guildDoc.regions.find(r => r.status === 'active') || guildDoc.regions[0];
}

/**
 * Add guild to a new region
 * @param {string} guildId - Guild document ID
 * @param {string} region - Region to add
 * @returns {Promise} Updated guild document
 */
function addRegion(guildId, region) {
  return this.findByIdAndUpdate(
    guildId,
    {
      $push: {
        regions: {
          region,
          wins: 0,
          losses: 0,
          elo: 1000,
          registeredAt: new Date(),
          status: 'active'
        }
      }
    },
    { new: true }
  );
}

/**
 * Remove guild from a region (set status to inactive)
 * @param {string} guildId - Guild document ID
 * @param {string} region - Region to remove
 * @returns {Promise} Updated guild document
 */
function removeRegion(guildId, region) {
  return this.findOneAndUpdate(
    { _id: guildId, 'regions.region': region },
    { $set: { 'regions.$.status': 'inactive' } },
    { new: true }
  );
}

/**
 * Update region-specific stats
 * @param {string} guildId - Guild document ID
 * @param {string} region - Region name
 * @param {Object} updates - Fields to update
 * @returns {Promise} Updated guild document
 */
function updateRegionStats(guildId, region, updates) {
  const setFields = {};
  for (const [key, value] of Object.entries(updates)) {
    setFields[`regions.$.${key}`] = value;
  }
  return this.findOneAndUpdate(
    { _id: guildId, 'regions.region': region },
    { $set: setFields },
    { new: true }
  );
}

/**
 * Increment wins/losses for a specific region
 * @param {string} guildId - Guild document ID
 * @param {string} region - Region name
 * @param {string} field - Field to increment (wins/losses)
 * @param {number} amount - Amount to increment
 * @returns {Promise} Updated guild document
 */
function incrementRegionStat(guildId, region, field, amount = 1) {
  return this.findOneAndUpdate(
    { _id: guildId, 'regions.region': region },
    { $inc: { [`regions.$.${field}`]: amount } },
    { new: true }
  );
}

/**
 * Apply all static methods to guild schema
 * @param {mongoose.Schema} schema - Guild schema
 */
function applyGuildStatics(schema) {
  schema.statics.findByName = findByName;
  schema.statics.findByNameAndRegion = findByNameAndRegion;
  schema.statics.findByRegion = findByRegion;
  schema.statics.findByDiscordGuild = findByDiscordGuild;
  schema.statics.countByDiscordGuild = countByDiscordGuild;
  schema.statics.getPaginatedGuilds = getPaginatedGuilds;
  schema.statics.addRegion = addRegion;
  schema.statics.removeRegion = removeRegion;
  schema.statics.updateRegionStats = updateRegionStats;
  schema.statics.incrementRegionStat = incrementRegionStat;
}

module.exports = {
  findByName,
  findByNameAndRegion,
  findByRegion,
  findByDiscordGuild,
  countByDiscordGuild,
  getPaginatedGuilds,
  getRegionStats,
  isRegisteredInRegion,
  getFirstActiveRegion,
  addRegion,
  removeRegion,
  updateRegionStats,
  incrementRegionStat,
  applyGuildStatics
};
