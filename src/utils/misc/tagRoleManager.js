const { PermissionFlagsBits } = require('discord.js');
const { getOrCreateRoleConfig } = require('./roleConfig');
const LoggerService = require('../../services/LoggerService');

/**
 * Tag-based role management utilities for primary guild tags
 */

/**
 * Check if bot has permission to manage roles
 * @param {import('discord.js').Guild} guild - Discord guild
 * @returns {boolean} True if bot can manage roles
 */
function canManageRoles(guild) {
  try {
    const botMember = guild?.members?.me;
    if (!botMember) return false;
    return botMember.permissions.has(PermissionFlagsBits.ManageRoles);
  } catch (_) {
    return false;
  }
}

/**
 * Assign tag role to a member
 * @param {import('discord.js').GuildMember} member - Guild member
 * @param {string} roleId - Role ID to assign
 * @returns {Promise<boolean>} True if successful
 */
async function assignTagRole(member, roleId) {
  try {
    if (!member || !roleId) return false;
    if (!canManageRoles(member.guild)) return false;
    if (member.roles.cache.has(roleId)) return true;

    await member.roles.add(roleId, 'Primary guild tag detected');
    LoggerService.debug('[TagRole] Assigned role', {
      roleId,
      user: member.user.tag
    });
    return true;
  } catch (error) {
    LoggerService.error('[TagRole] Failed to assign role:', {
      error: error.message
    });
    return false;
  }
}

/**
 * Remove tag role from a member
 * @param {import('discord.js').GuildMember} member - Guild member
 * @param {string} roleId - Role ID to remove
 * @returns {Promise<boolean>} True if successful
 */
async function removeTagRole(member, roleId) {
  try {
    if (!member || !roleId) return false;
    if (!canManageRoles(member.guild)) return false;
    if (!member.roles.cache.has(roleId)) return true;

    await member.roles.remove(roleId, 'Primary guild tag removed');
    LoggerService.debug('[TagRole] Removed role', {
      roleId,
      user: member.user.tag
    });
    return true;
  } catch (error) {
    LoggerService.error('[TagRole] Failed to remove role:', {
      error: error.message
    });
    return false;
  }
}

/**
 * Process tag role for a user across all guilds
 * @param {import('discord.js').Client} client - Discord client
 * @param {string} userId - User ID to process
 * @param {boolean} shouldHaveRole - Whether user should have the role
 */
async function processUserTagRole(client, userId, shouldHaveRole) {
  try {
    LoggerService.debug('[TagRole] Processing user across guilds', {
      userId,
      guildCount: client.guilds.cache.size,
      shouldHaveRole
    });

    for (const [guildId, guild] of client.guilds.cache) {
      try {
        const member = await guild.members.fetch(userId).catch(() => null);
        if (!member) continue;

        const roleConfig = await getOrCreateRoleConfig(guildId);
        const tagRoleId = roleConfig?.tagRoleId;

        if (!tagRoleId) continue;

        if (shouldHaveRole) {
          await assignTagRole(member, tagRoleId);
        } else {
          await removeTagRole(member, tagRoleId);
        }
      } catch (error) {
        LoggerService.error(`[TagRole] Error processing guild ${guildId}:`, {
          error: error.message
        });
      }
    }

    LoggerService.debug('[TagRole] Finished processing user', { userId });
  } catch (error) {
    LoggerService.error('[TagRole] Error processing user:', {
      error: error.message
    });
  }
}

module.exports = {
  canManageRoles,
  assignTagRole,
  removeTagRole,
  processUserTagRole
};

module.exports = {
  canManageRoles,
  assignTagRole,
  removeTagRole,
  processUserTagRole
};

