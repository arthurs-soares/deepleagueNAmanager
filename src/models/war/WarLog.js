const mongoose = require('mongoose');

/**
 * Stores war log entries with unique ID for editing
 */
const roundSchema = new mongoose.Schema({
  deathsA: { type: Number, required: true, min: 0 },
  deathsB: { type: Number, required: true, min: 0 },
  clip: { type: String, default: null }
}, { _id: false });

const warLogSchema = new mongoose.Schema({
  discordGuildId: { type: String, required: true, index: true },
  messageId: { type: String, required: true, index: true },
  channelId: { type: String, required: true },
  guildA: { type: String, required: true },
  guildB: { type: String, required: true },
  format: { type: String, required: true },
  mvpId: { type: String, required: true },
  honorableId: { type: String, default: null },
  rounds: [roundSchema],
  createdByUserId: { type: String, required: true },
  updatedByUserId: { type: String, default: null }
}, { timestamps: true });

warLogSchema.index({ discordGuildId: 1, messageId: 1 }, { unique: true });

module.exports =
  mongoose.models.WarLog || mongoose.model('WarLog', warLogSchema);
