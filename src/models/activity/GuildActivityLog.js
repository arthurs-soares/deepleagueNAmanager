const mongoose = require('mongoose');

/**
 * Guild Activity Log
 * Tracks in-game guild member joins, leaves, and invites
 */
const guildActivityLogSchema = new mongoose.Schema({
  // Discord server ID
  discordGuildId: {
    type: String,
    required: true,
    index: true
  },

  // In-game guild reference
  guildId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Guild',
    required: true,
    index: true
  },

  // Guild name (denormalized for easier querying)
  guildName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },

  // Activity type
  activityType: {
    type: String,
    required: true,
    enum: ['join', 'leave', 'invite'],
    index: true
  },

  // Member who joined/left or was invited
  userId: {
    type: String,
    required: true,
    index: true
  },

  // Member username (for display)
  username: {
    type: String,
    trim: true,
    maxlength: 100
  },

  // For invite activities: who sent the invite
  inviterId: {
    type: String,
    default: null
  },

  // Inviter username (for display)
  inviterUsername: {
    type: String,
    trim: true,
    maxlength: 100,
    default: null
  },

  // Which roster (main or sub)
  roster: {
    type: String,
    enum: ['main', 'sub'],
    default: null
  },

  // Additional metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  }
}, {
  timestamps: true // Auto createdAt and updatedAt
});

// Compound indices for efficient querying
guildActivityLogSchema.index({ discordGuildId: 1, guildId: 1, createdAt: -1 });
guildActivityLogSchema.index({ discordGuildId: 1, userId: 1, createdAt: -1 });
guildActivityLogSchema.index({
  discordGuildId: 1,
  activityType: 1,
  createdAt: -1
});

module.exports = mongoose.models.GuildActivityLog ||
  mongoose.model('GuildActivityLog', guildActivityLogSchema);

