const mongoose = require('mongoose');

/**
 * Stores when a user left a guild in the game to apply a cooldown
 * only for transitions between guilds (NOT the Discord server).
 */
const guildTransitionCooldownSchema = new mongoose.Schema({
  // Discord server ID
  discordGuildId: { type: String, required: true, index: true },
  // Discord user ID
  userId: { type: String, required: true, index: true },
  // Last guild (Mongo _id) the user left
  lastLeftGuildId: { type: String, required: true },
  // When they left
  leftAt: { type: Date, required: true },
  // Optional manual override expiry; when set and in the future, it replaces the default 3-day rule
  overrideUntil: { type: Date, default: null },
}, { timestamps: true });

// One record per user per server
guildTransitionCooldownSchema.index({ discordGuildId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.models.GuildTransitionCooldown || mongoose.model('GuildTransitionCooldown', guildTransitionCooldownSchema);

