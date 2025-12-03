const GuildTransitionCooldown = require('../../models/cooldowns/GuildTransitionCooldown');

// 3 days in ms
const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

/**
 * Records that the user left a game guild.
 * NOT related to joining/leaving the Discord server.
 * @param {string} discordGuildId
 * @param {string} userId
 * @param {string} lastLeftGuildId - _id of the guild the user just left
 * @param {Date} when
 */
async function recordGuildLeave(discordGuildId, userId, lastLeftGuildId, when = new Date()) {
  const upsert = await GuildTransitionCooldown.findOneAndUpdate(
    { discordGuildId, userId },
    { lastLeftGuildId, leftAt: when },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return upsert;
}

/**
 * Verifica se há cooldown ativo para o usuário trocar de guilda.
 * Retorna se está ativo e o tempo restante em ms.
 * @param {string} discordGuildId
 * @param {string} userId
 * @param {number|Date} now
 */
async function getGuildTransitionStatus(discordGuildId, userId, now = Date.now()) {
  const doc = await GuildTransitionCooldown.findOne({ discordGuildId, userId });
  if (!doc) return { active: false, remainingMs: 0, lastLeftGuildId: null };

  const nowMs = typeof now === 'number' ? now : now.getTime();
  const leftAtMs = new Date(doc.leftAt).getTime();
  const baseExpiry = leftAtMs + THREE_DAYS_MS;
  const overrideUntilMs = doc.overrideUntil ? new Date(doc.overrideUntil).getTime() : null;
  const effectiveExpiry = overrideUntilMs != null ? overrideUntilMs : baseExpiry;
  const remaining = effectiveExpiry - nowMs;

  return {
    active: remaining > 0,
    remainingMs: Math.max(0, remaining),
    lastLeftGuildId: doc.lastLeftGuildId,
  };
}

/**
 * Limpa registros expirados.
 */
async function clearExpired(now = Date.now()) {
  const threshold = new Date(now - THREE_DAYS_MS);
  await GuildTransitionCooldown.deleteMany({ leftAt: { $lt: threshold } });
}

function formatRemaining(ms) {
  const totalSec = Math.ceil(ms / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const parts = [];
  if (days) parts.push(`${days}d`);
  if (hours) parts.push(`${hours}h`);
  if (minutes) parts.push(`${minutes}m`);
  if (!parts.length) parts.push(`${totalSec % 60}s`);
  return parts.join(' ');
}

module.exports = {
  recordGuildLeave,
  getGuildTransitionStatus,
  clearExpired,
  formatRemaining,
};

