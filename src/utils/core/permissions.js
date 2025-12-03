const { PermissionFlagsBits } = require('discord.js');
const { getOrCreateRoleConfig } = require('../misc/roleConfig');

/**
 * Check if member has full panel access:
 * - Has Administrator permission on Discord OR
 * - Has one of the roles configured as Moderators (moderatorsRoleIds)
 *
 * Used for: full admin panel access and highly-privileged actions.
 */
async function isGuildAdmin(member, discordGuildId) {
  try {
    if (!member || !discordGuildId) return false;
    if (member.permissions?.has(PermissionFlagsBits.Administrator)) return true;
    const cfg = await getOrCreateRoleConfig(discordGuildId);
    const modIds = new Set(cfg?.moderatorsRoleIds || []);
    if (!modIds.size) return false;
    return member.roles.cache.some(r => modIds.has(r.id));
  } catch (_) {
    return false;
  }
}

/**
 * Check if member is Moderator OR Hoster (or Administrator)
 *
 * Use this for ELO-related commands where hosters also have permissions.
 * @param {import('discord.js').GuildMember} member
 * @param {string} discordGuildId
 */
async function isModeratorOrHoster(member, discordGuildId) {
  try {
    if (!member || !discordGuildId) return false;
    if (member.permissions?.has(PermissionFlagsBits.Administrator)) return true;
    const cfg = await getOrCreateRoleConfig(discordGuildId);
    const allowed = new Set([...(cfg?.moderatorsRoleIds || []), ...(cfg?.hostersRoleIds || [])]);
    if (!allowed.size) return false;
    return member.roles.cache.some(r => allowed.has(r.id));
  } catch (_) {
    return false;
  }
}

/**
 * Check if member is Moderator OR Admin Support (or Administrator)
 *
 * Use this for deposit approval and general ticket management actions.
 * @param {import('discord.js').GuildMember} member
 * @param {string} discordGuildId
 */
async function isModeratorOrAdminSupport(member, discordGuildId) {
  try {
    if (!member || !discordGuildId) return false;
    if (member.permissions?.has(PermissionFlagsBits.Administrator)) return true;
    const cfg = await getOrCreateRoleConfig(discordGuildId);
    const allowed = new Set([...(cfg?.moderatorsRoleIds || []), ...(cfg?.adminSupportRoleIds || [])]);
    if (!allowed.size) return false;
    return member.roles.cache.some(r => allowed.has(r.id));
  } catch (_) {
    return false;
  }
}

module.exports = { isGuildAdmin, isModeratorOrHoster, isModeratorOrAdminSupport };
