const mongoose = require('mongoose');

const awardedBadgeSchema = new mongoose.Schema({
  discordGuildId: { type: String, required: true, index: true },
  badgeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Badge', required: true, index: true },
  category: { type: String, enum: ['user', 'guild'], required: true },
  targetUserId: { type: String, default: null, index: true },
  targetGuildId: { type: mongoose.Schema.Types.ObjectId, ref: 'Guild', default: null, index: true },
  reason: { type: String, default: '', maxlength: 500 },
  awardedByUserId: { type: String, required: true },
}, { timestamps: true });

awardedBadgeSchema.index({ discordGuildId: 1, badgeId: 1, targetUserId: 1, targetGuildId: 1 }, { unique: true });

module.exports = mongoose.models.AwardedBadge || mongoose.model('AwardedBadge', awardedBadgeSchema);

