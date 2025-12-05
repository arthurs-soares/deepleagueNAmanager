/**
 * Guild schema database indices for optimal performance
 */

/**
 * Apply all database indices to guild schema
 * @param {mongoose.Schema} schema - Guild schema
 */
function applyGuildIndices(schema) {
  // Unique constraint: guild name within Discord server
  schema.index({ discordGuildId: 1, name: 1 }, { unique: true });

  // Common filters
  schema.index({ discordGuildId: 1 });
  schema.index({ registeredBy: 1 });

  // Member queries and ranking
  schema.index({ discordGuildId: 1, 'members.userId': 1 });

  // Multi-region indices
  schema.index({ discordGuildId: 1, 'regions.region': 1 });
  schema.index({ discordGuildId: 1, 'regions.region': 1, 'regions.elo': -1 });
  schema.index({ discordGuildId: 1, 'regions.region': 1, 'regions.wins': -1 });
  schema.index({ discordGuildId: 1, 'regions.region': 1, 'regions.status': 1 });

  // Status and activity queries
  schema.index({ discordGuildId: 1, status: 1 });
  schema.index({ createdAt: -1 });
  schema.index({ updatedAt: -1 });
}

/**
 * Get all guild indices configuration
 * @returns {Array} Array of index configurations
 */
function getGuildIndices() {
  return [
    { fields: { discordGuildId: 1, name: 1 }, options: { unique: true } },
    { fields: { discordGuildId: 1 } },
    { fields: { registeredBy: 1 } },
    { fields: { discordGuildId: 1, 'members.userId': 1 } },
    { fields: { discordGuildId: 1, 'regions.region': 1 } },
    { fields: { discordGuildId: 1, 'regions.region': 1, 'regions.elo': -1 } },
    { fields: { discordGuildId: 1, 'regions.region': 1, 'regions.wins': -1 } },
    { fields: { discordGuildId: 1, 'regions.region': 1, 'regions.status': 1 } },
    { fields: { discordGuildId: 1, status: 1 } },
    { fields: { createdAt: -1 } },
    { fields: { updatedAt: -1 } }
  ];
}

module.exports = {
  applyGuildIndices,
  getGuildIndices
};
