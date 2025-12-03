const AwardedBadge = require('../../models/badge/AwardedBadge');
const { getBadgeById } = require('./badgeService');

async function awardBadgeToUser({ discordGuildId, badgeId, userId, reason = '', awardedByUserId }) {
  try {
    const badge = await getBadgeById(badgeId);
    if (!badge || badge.discordGuildId !== discordGuildId) {
      return { ok: false, message: 'Badge not found.' };
    }
    if (badge.category !== 'user') {
      return { ok: false, message: 'This badge is not a user badge.' };
    }

    const doc = await AwardedBadge.findOneAndUpdate(
      { discordGuildId, badgeId, category: 'user', targetUserId: userId },
      { $setOnInsert: { reason, awardedByUserId } },
      { upsert: true, new: true }
    );

    return { ok: true, awarded: doc };
  } catch (e) {
    return { ok: false, message: 'Could not award badge.' };
  }
}

async function awardBadgeToGuild({ discordGuildId, badgeId, guildModelId, reason = '', awardedByUserId }) {
  try {
    const badge = await getBadgeById(badgeId);
    if (!badge || badge.discordGuildId !== discordGuildId) {
      return { ok: false, message: 'Badge not found.' };
    }
    if (badge.category !== 'guild') {
      return { ok: false, message: 'This badge is not a guild badge.' };
    }

    const doc = await AwardedBadge.findOneAndUpdate(
      { discordGuildId, badgeId, category: 'guild', targetGuildId: guildModelId },
      { $setOnInsert: { reason, awardedByUserId } },
      { upsert: true, new: true }
    );

    return { ok: true, awarded: doc };
  } catch (e) {
    return { ok: false, message: 'Could not award badge.' };
  }
}

async function listAwards(discordGuildId, { category = 'all', sort = 'desc', limit = 200 } = {}) {
  const query = { discordGuildId };
  if (category === 'user' || category === 'guild') query.category = category;
  const sortOpt = sort === 'asc' ? { createdAt: 1 } : { createdAt: -1 };
  const docs = await AwardedBadge.find(query)
    .sort(sortOpt)
    .limit(Math.min(limit, 500))
    .populate('badgeId')
    .lean();
  return docs.filter(d => d.badgeId); // filter out orphaned
}

async function revokeAward(awardId, discordGuildId) {
  const doc = await AwardedBadge.findOne({ _id: awardId, discordGuildId });
  if (!doc) return { ok: false, message: 'Award not found.' };
  await AwardedBadge.deleteOne({ _id: awardId });
  return { ok: true, award: doc };
}

module.exports = { awardBadgeToUser, awardBadgeToGuild, listAwards, revokeAward };

