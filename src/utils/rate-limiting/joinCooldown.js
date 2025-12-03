const JoinCooldown = require('../../models/cooldowns/JoinCooldown');

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

/**
 * Registra saída/remoção de membro
 */
async function setJoinCooldown(discordGuildId, userId, when = new Date()) {
  const upsert = await JoinCooldown.findOneAndUpdate(
    { discordGuildId, userId },
    { leftAt: when },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return upsert;
}

/**
 * Verifica se usuário está em cooldown (true/false) e tempo restante em ms
 */
async function checkJoinCooldown(discordGuildId, userId, now = Date.now()) {
  const doc = await JoinCooldown.findOne({ discordGuildId, userId });
  if (!doc) return false;
  const diff = now - new Date(doc.leftAt).getTime();
  const remaining = THREE_DAYS_MS - diff;
  return remaining > 0;
}

/**
 * Utilitários adicionais usados em produção
 */
async function getCooldownStatus(discordGuildId, userId, now = Date.now()) {
  const doc = await JoinCooldown.findOne({ discordGuildId, userId });
  if (!doc) return { active: false, remainingMs: 0 };
  const diff = now - new Date(doc.leftAt).getTime();
  const remaining = THREE_DAYS_MS - diff;
  return { active: remaining > 0, remainingMs: Math.max(0, remaining) };
}

async function recordLeave(discordGuildId, userId, when = new Date()) {
  return setJoinCooldown(discordGuildId, userId, when);
}

/**
 * Limpa registros expirados
 */
async function clearExpired(now = Date.now()) {
  const threshold = new Date(now - THREE_DAYS_MS);
  await JoinCooldown.deleteMany({ leftAt: { $lt: threshold } });
}

/**
 * Formata o tempo restante em texto amigável
 */
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

module.exports = { setJoinCooldown, checkJoinCooldown, getCooldownStatus, recordLeave, clearExpired, formatRemaining };

