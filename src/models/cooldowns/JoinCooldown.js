const mongoose = require('mongoose');

const joinCooldownSchema = new mongoose.Schema({
  discordGuildId: { type: String, required: true, index: true },
  userId: { type: String, required: true, index: true },
  leftAt: { type: Date, required: true },
}, { timestamps: true });

joinCooldownSchema.index({ discordGuildId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.models.JoinCooldown || mongoose.model('JoinCooldown', joinCooldownSchema);

