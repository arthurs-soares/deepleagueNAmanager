const GuildTransitionCooldown = require('../../models/cooldowns/GuildTransitionCooldown');

/**
 * Set manual cooldown expiry for a user (absolute overrideUntil)
 * @param {string} discordGuildId
 * @param {string} userId
 * @param {Date} until - when cooldown should expire
 */
async function setManualCooldown(discordGuildId, userId, until) {
  const safeUntil = until instanceof Date ? until : new Date(until);
  if (isNaN(safeUntil.getTime())) throw new Error('Invalid date for override');
  const doc = await GuildTransitionCooldown.findOneAndUpdate(
    { discordGuildId, userId },
    { $set: { overrideUntil: safeUntil } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return doc;
}

/**
 * Increase manual cooldown expiry by a delta (ms). Creates override if missing.
 */
async function increaseManualCooldown(discordGuildId, userId, deltaMs) {
  if (!Number.isFinite(deltaMs) || deltaMs <= 0) throw new Error('deltaMs must be > 0');
  const doc = await GuildTransitionCooldown.findOne({ discordGuildId, userId });
  const base = doc?.overrideUntil ? new Date(doc.overrideUntil).getTime() : Date.now();
  const next = new Date(base + deltaMs);
  return setManualCooldown(discordGuildId, userId, next);
}

/**
 * Decrease manual cooldown expiry by a delta (ms). If below now, clears override.
 */
async function decreaseManualCooldown(discordGuildId, userId, deltaMs) {
  if (!Number.isFinite(deltaMs) || deltaMs <= 0) throw new Error('deltaMs must be > 0');
  const doc = await GuildTransitionCooldown.findOne({ discordGuildId, userId });
  if (!doc?.overrideUntil) return doc; // nothing to decrease
  const base = new Date(doc.overrideUntil).getTime();
  const nextTs = base - deltaMs;
  if (nextTs <= Date.now()) {
    // Clear override (no manual restriction)
    return clearManualCooldown(discordGuildId, userId);
  }
  return setManualCooldown(discordGuildId, userId, new Date(nextTs));
}

/**
 * Clear manual override (reset manual control, base 3-day rule still applies)
 */
async function clearManualCooldown(discordGuildId, userId) {
  const doc = await GuildTransitionCooldown.findOneAndUpdate(
    { discordGuildId, userId },
    { $unset: { overrideUntil: 1 } },
    { new: true }
  );
  return doc;
}

/**
 * Fully clear a user's guild transition cooldown (override + base record)
 * After this, getGuildTransitionStatus will return inactive (no cooldown)
 */
async function clearAllCooldown(discordGuildId, userId) {
  await GuildTransitionCooldown.deleteOne({ discordGuildId, userId });
  return { ok: true };
}

/**
 * Read status (active/remaining) using the unified util that honors overrides
 */
async function checkStatus(discordGuildId, userId) {
  const { getGuildTransitionStatus } = require('./guildTransitionCooldown');
  return getGuildTransitionStatus(discordGuildId, userId);
}

module.exports = {
  setManualCooldown,
  increaseManualCooldown,
  decreaseManualCooldown,
  clearManualCooldown,
  clearAllCooldown,
  checkStatus,
};

