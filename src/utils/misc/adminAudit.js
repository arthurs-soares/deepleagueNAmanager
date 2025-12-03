const { sendLog } = require('../core/logger');

/**
 * Log administrative actions performed via guild panel.
 * Always silent if no channel is configured.
 * @param {import('discord.js').Guild} discordGuild
 * @param {string} actorId - ID of the user who performed the action
 * @param {string} action - Action name (e.g., "Edit Roster", "Transfer Leadership")
 * @param {object} details - Relevant details (guildName, targetUserId, etc.)
 */
async function auditAdminAction(discordGuild, actorId, action, details = {}) {
  try {
    const lines = [];
    if (details.guildName) lines.push(`Guild: ${details.guildName}`);
    if (details.guildId) lines.push(`GuildId: ${details.guildId}`);
    if (details.targetUserId) lines.push(`Target: <@${details.targetUserId}>`);
    if (details.extra) lines.push(String(details.extra));

    const description = `Administrator: <@${actorId}>
Action: ${action}
${lines.join('\n')}`.trim();

    await sendLog(discordGuild, 'Audit (Admin)', description);
  } catch (_) {}
}

module.exports = { auditAdminAction };

