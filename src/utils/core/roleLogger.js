const { sendLog } = require('./logger');
const LoggerService = require('../../services/LoggerService');

/**
 * Log role assignment operations
 * @param {import('discord.js').Guild} guild - Discord guild
 * @param {string} userId - User ID who received the role
 * @param {string} roleId - Role ID that was assigned
 * @param {string} roleName - Role name for logging
 * @param {string} assignedBy - User ID who assigned the role
 * @param {string} reason - Reason for role assignment
 */
async function logRoleAssignment(
  guild, userId, roleId, roleName, assignedBy, reason
) {
  try {
    const logMessage = '**Role Assigned**\n' +
      `User: <@${userId}>\n` +
      `Role: <@&${roleId}> (${roleName})\n` +
      `Assigned by: <@${assignedBy}>\n` +
      `Reason: ${reason}\n` +
      `Time: <t:${Math.floor(Date.now() / 1000)}:f>`;

    await sendLog(guild, 'Role Assignment', logMessage);

    LoggerService.debug('[ROLE ASSIGNMENT]', {
      guildId: guild.id,
      userId,
      roleId,
      roleName,
      assignedBy,
      reason
    });
  } catch (error) {
    LoggerService.error('Error logging role assignment:', {
      error: error.message
    });
  }
}

/**
 * Log role removal operations
 * @param {import('discord.js').Guild} guild - Discord guild
 * @param {string} userId - User ID who lost the role
 * @param {string} roleId - Role ID that was removed
 * @param {string} roleName - Role name for logging
 * @param {string} removedBy - User ID who removed the role
 * @param {string} reason - Reason for role removal
 */
async function logRoleRemoval(
  guild, userId, roleId, roleName, removedBy, reason
) {
  try {
    const logMessage = '**Role Removed**\n' +
      `User: <@${userId}>\n` +
      `Role: ~~<@&${roleId}>~~ (${roleName})\n` +
      `Removed by: <@${removedBy}>\n` +
      `Reason: ${reason}\n` +
      `Time: <t:${Math.floor(Date.now() / 1000)}:f>`;

    await sendLog(guild, 'Role Removal', logMessage);

    LoggerService.debug('[ROLE REMOVAL]', {
      guildId: guild.id,
      userId,
      roleId,
      roleName,
      removedBy,
      reason
    });
  } catch (error) {
    LoggerService.error('Error logging role removal:', {
      error: error.message
    });
  }
}

/**
 * Log role mentions (not assignments)
 * @param {import('discord.js').Guild} guild - Discord guild
 * @param {string[]} roleIds - Role IDs that were mentioned
 * @param {string} context - Context where roles were mentioned
 * @param {string} triggeredBy - User ID who triggered the mention
 */
async function logRoleMention(guild, roleIds, context, triggeredBy) {
  try {
    if (!roleIds || roleIds.length === 0) return;

    LoggerService.debug('[ROLE MENTION]', {
      guildId: guild.id,
      roleIds,
      context,
      triggeredBy
    });
  } catch (error) {
    LoggerService.error('Error logging role mention:', {
      error: error.message
    });
  }
}

module.exports = {
  logRoleAssignment,
  logRoleRemoval,
  logRoleMention
};
