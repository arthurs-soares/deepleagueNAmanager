const mongoose = require('mongoose');

const badgeSchema = new mongoose.Schema({
  discordGuildId: { type: String, required: true, index: true },
  category: { type: String, enum: ['user', 'guild'], required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 32 },
  emojiId: { type: String, required: true },
  emojiName: { type: String, required: true, maxlength: 32 },
  animated: { type: Boolean, default: false },
  createdByUserId: { type: String, required: true },
}, { timestamps: true });

badgeSchema.index({ discordGuildId: 1, category: 1, name: 1 }, { unique: true });

module.exports = mongoose.models.Badge || mongoose.model('Badge', badgeSchema);

