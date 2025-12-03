const { parseDurationToMs } = require('../time/parseDuration');
const { findGuildsByUser } = require('../guilds/find');
const { formatRemaining, getGuildTransitionStatus } = require('../rate-limiting/guildTransitionCooldown');
const {
  setManualCooldown,
  increaseManualCooldown,
  decreaseManualCooldown,
  clearManualCooldown,
  clearAllCooldown,
} = require('../rate-limiting/guildTransitionOverride');

/**
 * Check if a user is leader or co-leader of any guild in the server
 */
async function isLeaderOrCoLeader(discordGuildId, userId) {
  const guilds = await findGuildsByUser(userId, discordGuildId);
  return Array.isArray(guilds) && guilds.length > 0;
}

async function handleCheck(discordGuildId, targetUserId) {
  const status = await getGuildTransitionStatus(discordGuildId, targetUserId);
  if (!status.active) return { success: true, message: 'No active cooldown.' };
  return { success: true, message: `Cooldown active — remaining ${formatRemaining(status.remainingMs)}`, remainingMs: status.remainingMs };
}

async function handleReset(discordGuildId, targetUserId) {
  // Clear manual override and base record to fully reset the user's cooldown
  await clearManualCooldown(discordGuildId, targetUserId);
  await clearAllCooldown(discordGuildId, targetUserId);
  return { success: true, message: 'Cooldown fully cleared for this user.' };
}

async function handleSet(discordGuildId, targetUserId, durationStr) {
  const ms = parseDurationToMs(durationStr);
  if (!ms) return { success: false, message: 'Invalid time. Use formats like 1d 2h 30m, 45m, 120s.' };
  const until = new Date(Date.now() + ms);
  await setManualCooldown(discordGuildId, targetUserId, until);
  return { success: true, message: `Cooldown set until <t:${Math.floor(until.getTime()/1000)}:F>.`, until };
}

async function handleIncrease(discordGuildId, targetUserId, durationStr) {
  const ms = parseDurationToMs(durationStr);
  if (!ms) return { success: false, message: 'Invalid time. Use formats like 1d 2h 30m, 45m, 120s.' };
  await increaseManualCooldown(discordGuildId, targetUserId, ms);
  const status = await getGuildTransitionStatus(discordGuildId, targetUserId);
  return { success: true, message: `Cooldown increased. Remaining ${formatRemaining(status.remainingMs)}.` };
}

async function handleDecrease(discordGuildId, targetUserId, durationStr) {
  const ms = parseDurationToMs(durationStr);
  if (!ms) return { success: false, message: 'Invalid time. Use formats like 1d 2h 30m, 45m, 120s.' };
  await decreaseManualCooldown(discordGuildId, targetUserId, ms);
  const status = await getGuildTransitionStatus(discordGuildId, targetUserId);
  if (!status.active) return { success: true, message: 'Cooldown is no longer active.' };
  return { success: true, message: `Cooldown decreased. Remaining ${formatRemaining(status.remainingMs)}.` };
}

module.exports = {
  isLeaderOrCoLeader,
  handleCheck,
  handleReset,
  handleSet,
  handleIncrease,
  handleDecrease,
};

