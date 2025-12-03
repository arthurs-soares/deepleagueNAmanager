const Badge = require('../../models/badge/Badge');
const AwardedBadge = require('../../models/badge/AwardedBadge');
const { sanitizeText } = require('../validation/textValidation');

function validateBadgeName(name) {
  const sanitized = sanitizeText(name, 32);
  if (!sanitized || sanitized.length < 2) {
    return { ok: false, message: 'Name must be at least 2 characters.' };
  }
  if (!/^[A-Za-z0-9 _.-]+$/.test(sanitized)) {
    return { ok: false, message: 'Name contains invalid characters.' };
  }
  return { ok: true, value: sanitized };
}

function parseGuildEmoji(emojiStr, guild) {
  const s = String(emojiStr || '').trim();
  const m = s.match(/^<(?:(a)?):([A-Za-z0-9_]{2,32}):(\d{17,20})>$/);
  if (!m) return { ok: false, message: 'Emoji must be a server emoji code like <:name:id> or <a:name:id>.' };
  const animated = !!m[1];
  const emojiName = m[2];
  const emojiId = m[3];
  const exists = guild?.emojis?.cache?.has?.(emojiId);
  if (!exists) return { ok: false, message: 'Emoji not found in this server.' };
  return { ok: true, value: { animated, emojiName, emojiId } };
}

async function listBadges(discordGuildId) {
  try {
    const docs = await Badge.find({ discordGuildId }).sort({ category: 1, name: 1 }).lean();
    return {
      user: docs.filter(d => d.category === 'user'),
      guild: docs.filter(d => d.category === 'guild')
    };
  } catch (_) {
    return { user: [], guild: [] };
  }
}

async function createBadge({ discordGuildId, createdByUserId, category, nameInput, emojiInput, guild }) {
  try {
    if (!['user', 'guild'].includes(category)) return { ok: false, message: 'Invalid category.' };

    const nameRes = validateBadgeName(nameInput);
    if (!nameRes.ok) return { ok: false, message: nameRes.message };

    const emojiRes = parseGuildEmoji(emojiInput, guild);
    if (!emojiRes.ok) return { ok: false, message: emojiRes.message };

    const { animated, emojiName, emojiId } = emojiRes.value;

    // Prevent duplicates by name in same category
    const exists = await Badge.findOne({ discordGuildId, category, name: nameRes.value });
    if (exists) return { ok: false, message: 'A badge with this name already exists.' };

    const doc = await Badge.create({
      discordGuildId,
      category,
      name: nameRes.value,
      emojiId,
      emojiName,
      animated,
      createdByUserId
    });

    return { ok: true, badge: doc };
  } catch (e) {
    if (e?.code === 11000) return { ok: false, message: 'A badge with this name already exists.' };
    return { ok: false, message: 'Unexpected error while saving badge.' };
  }
}

async function getBadgeById(id) {
  try { return await Badge.findById(id); } catch { return null; }
}

function emojiCodeFor(b) {
  if (!b) return '';
  return b.animated ? `<a:${b.emojiName}:${b.emojiId}>` : `<:${b.emojiName}:${b.emojiId}>`;
}

async function updateBadge({ id, discordGuildId, nameInput, emojiInput, guild }) {
  try {
    const badge = await Badge.findById(id);
    if (!badge || badge.discordGuildId !== discordGuildId) {
      return { ok: false, message: 'Badge not found.' };
    }

    const nameRes = validateBadgeName(nameInput);
    if (!nameRes.ok) return { ok: false, message: nameRes.message };

    const emojiRes = parseGuildEmoji(emojiInput, guild);
    if (!emojiRes.ok) return { ok: false, message: emojiRes.message };

    const dupe = await Badge.findOne({
      _id: { $ne: badge._id },
      discordGuildId,
      category: badge.category,
      name: nameRes.value
    });
    if (dupe) return { ok: false, message: 'A badge with this name already exists.' };

    badge.name = nameRes.value;
    badge.emojiId = emojiRes.value.emojiId;
    badge.emojiName = emojiRes.value.emojiName;
    badge.animated = emojiRes.value.animated;
    await badge.save();
    return { ok: true, badge };
  } catch (e) {
    return { ok: false, message: 'Unexpected error while updating badge.' };
  }
}

async function deleteBadge({ id, discordGuildId }) {
  try {
    const badge = await Badge.findById(id);
    if (!badge || badge.discordGuildId !== discordGuildId) {
      return { ok: false, message: 'Badge not found.' };
    }
    await Badge.deleteOne({ _id: id });
    await AwardedBadge.deleteMany({ badgeId: id, discordGuildId });
    return { ok: true };
  } catch (e) {
    return { ok: false, message: 'Unexpected error while deleting badge.' };
  }
}

module.exports = { listBadges, createBadge, getBadgeById, emojiCodeFor, updateBadge, deleteBadge };

