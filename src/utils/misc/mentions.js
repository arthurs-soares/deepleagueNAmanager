const { PermissionFlagsBits } = require('discord.js');
const { getOrCreateRoleConfig } = require('./roleConfig');

/**
 * Build a mention string for configured Moderators roles in this guild
 * @param {import('discord.js').Guild} guild
 * @returns {Promise<string>} e.g. "<@&roleId1> <@&roleId2>" or empty string
 */
async function buildModeratorsRoleMentions(guild) {
  try {
    if (!guild) return '';
    const cfg = await getOrCreateRoleConfig(guild.id);
    const ids = Array.isArray(cfg?.moderatorsRoleIds) ? cfg.moderatorsRoleIds : [];
    if (!ids.length) return '';
    return ids.map(id => `<@&${id}>`).join(' ');
  } catch (_) {
    return '';
  }
}

/**
 * Build a mention string for configured Support roles in this guild
 * @param {import('discord.js').Guild} guild
 * @returns {Promise<string>} e.g. "<@&roleId1> <@&roleId2>" or empty string
 */
async function buildSupportRoleMentions(guild) {
  try {
    if (!guild) return '';
    const cfg = await getOrCreateRoleConfig(guild.id);
    const ids = Array.isArray(cfg?.supportRoleIds) ? cfg.supportRoleIds : [];
    if (!ids.length) return '';
    return ids.map(id => `<@&${id}>`).join(' ');
  } catch (_) {
    return '';
  }
}

/**
 * Build a mention string for current Administrators (permission-based)
 * Limits to first 10 to avoid flooding
 * @param {import('discord.js').Guild} guild
 */
async function buildAdminMentions(guild) {
  try {
    if (!guild) return '';
    const admins = [];
    for (const [, member] of guild.members.cache) {
      if (member?.permissions?.has(PermissionFlagsBits.Administrator)) admins.push(member.id);
      if (admins.length >= 10) break;
    }
    return admins.length ? admins.map(id => `<@${id}>`).join(' ') : '';
  } catch (_) {
    return '';
  }
}

module.exports = { buildModeratorsRoleMentions, buildSupportRoleMentions, buildAdminMentions };

