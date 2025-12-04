const mongoose = require('mongoose');

/**
 * Event Points Model
 * Tracks event points for users in a Discord server
 * Used for event leaderboards and point-based rewards
 */
const eventPointsSchema = new mongoose.Schema({
  // Discord server ID
  discordGuildId: {
    type: String,
    required: true,
    index: true
  },

  // Discord user ID
  userId: {
    type: String,
    required: true,
    index: true
  },

  // Current event points balance (can be negative)
  points: {
    type: Number,
    default: 0
  },

  // Total points earned (lifetime)
  totalEarned: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true
});

// Compound unique index for one record per user per server
eventPointsSchema.index(
  { discordGuildId: 1, userId: 1 },
  { unique: true }
);

// Index for leaderboard queries (sorted by points)
eventPointsSchema.index(
  { discordGuildId: 1, points: -1 }
);

module.exports = mongoose.models.EventPoints ||
  mongoose.model('EventPoints', eventPointsSchema);
