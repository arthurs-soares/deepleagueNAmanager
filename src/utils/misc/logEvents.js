const { sendLog } = require('../core/logger');

/**
 * Logging utilities without repeating formatting in handlers
 * Each function attempts to log to the configured channel; failures are silent
 */

function fmtTs(date = new Date()) {
  return `<t:${Math.floor(date.getTime() / 1000)}:F>`;
}

/**
 * Log member join event
 * @param {import('discord.js').GuildMember} member
 */
async function logMemberJoin(member) {
  try {
    await sendLog(
      member.guild,
      'Member Joined',
      `User: <@${member.id}> (${member.user.tag})\nID: ${member.id}\nWhen: ${fmtTs()}`
    );
  } catch (_) {}
}

/**
 * Log member leave/removal event
 * @param {import('discord.js').GuildMember} member
 */
async function logMemberLeave(member) {
  try {
    await sendLog(
      member.guild,
      'Member Left',
      `User: <@${member.id}> (${member.user.tag})\nID: ${member.id}\nWhen: ${fmtTs()}`
    );
  } catch (_) {}
}

/**
 * Log new guild registration (internal entity)
 * @param {import('../../models/guild/Guild')} guildDoc
 * @param {import('discord.js').Guild} discordGuild
 * @param {string} byUserId
 */
async function logGuildRegistered(guildDoc, discordGuild, byUserId) {
  try {
    await sendLog(
      discordGuild,
      'Guild Registered',
      `Name: ${guildDoc.name}\nLeader: ${guildDoc.leader}\nRegistered by: <@${byUserId}>\nWhen: ${fmtTs(guildDoc.createdAt || new Date())}`
    );
  } catch (_) {}
}

/**
 * Log war creation
 * @param {import('../../models/war/War')} warDoc
 * @param {string} guildAName
 * @param {string} guildBName
 * @param {import('discord.js').Guild} discordGuild
 */
async function logWarCreated(warDoc, guildAName, guildBName, discordGuild) {
  try {
    await sendLog(
      discordGuild,
      'New war created',
      `War ${warDoc._id}\n${guildAName} vs ${guildBName}\nScheduled: ${fmtTs(new Date(warDoc.scheduledAt))}\nChannel: ${warDoc.channelId ? `<#${warDoc.channelId}>` : (warDoc.threadId ? `<#${warDoc.threadId}>` : '—')}`
    );
  } catch (_) {}
}

/**
 * Log war finalization
 * @param {import('../../models/war/War')} warDoc
 * @param {string} winnerName
 * @param {string} guildAName
 * @param {string} guildBName
 * @param {import('discord.js').Guild} discordGuild
 */
async function logWarFinished(warDoc, winnerName, guildAName, guildBName, discordGuild) {
  try {
    await sendLog(
      discordGuild,
      'War Finished',
      `War ${warDoc._id}\nWinner: ${winnerName}\nParticipants: ${guildAName} vs ${guildBName}`
    );
  } catch (_) {}
}

/**
 * Log manual score adjustment
 * @param {import('../../models/guild/Guild')} guildDoc
 * @param {number} wins
 * @param {number} losses
 * @param {import('discord.js').Guild} discordGuild
 * @param {string} byUserId
 */
async function logGuildScoreUpdated(guildDoc, wins, losses, discordGuild, byUserId) {
  try {
    await sendLog(
      discordGuild,
      'Score Updated (Manual)',
      `Guild: ${guildDoc.name}\nNew Score: ${wins}W/${losses}L\nBy: <@${byUserId}>\nWhen: ${fmtTs()}`
    );
  } catch (_) {}
}

/**
 * Log DM sent successfully
 * @param {import('discord.js').Guild} guild
 * @param {string} targetUserId
 * @param {string} reason
 */
async function logDmSent(guild, targetUserId, reason = '') {
  try {
    await sendLog(
      guild,
      'DM Sent',
      `Recipient: <@${targetUserId}>\n${reason ? `Reason: ${reason}\n` : ''}When: ${fmtTs()}`
    );
  } catch (_) {}
}

/**
 * Log DM send failure
 * @param {import('discord.js').Guild} guild
 * @param {string} targetUserId
 * @param {string} reason
 * @param {string} [fallbackAction] - Fallback action taken (e.g., "Thread created")
 */
async function logDmFailed(guild, targetUserId, reason = '', fallbackAction = '') {
  try {
    await sendLog(
      guild,
      'Failed to Send DM',
      `Recipient: <@${targetUserId}>\n${reason ? `Reason: ${reason}\n` : ''}${fallbackAction ? `Action: ${fallbackAction}\n` : ''}When: ${fmtTs()}`
    );
  } catch (_) {}
}

/**
 * Log command error
 * @param {import('discord.js').Guild} guild
 * @param {string} commandName
 * @param {string} userId
 * @param {Error | string} error
 */
async function logCommandError(guild, commandName, userId, error) {
  try {
    const errorMsg = typeof error === 'string'
      ? error : (error?.message || 'Unknown error');
    await sendLog(
      guild,
      `Command Error: /${commandName}`,
      `User: <@${userId}>\nError: ${errorMsg}\nWhen: ${fmtTs()}`
    );
  } catch (_) {}
}

/**
 * Log guild association problems
 * @param {import('discord.js').Guild} guild
 * @param {string} userId
 * @param {string} guildName
 * @param {string} action - 'join' or 'leave'
 * @param {string} problem
 */
async function logGuildAssociationProblem(
  guild, userId, guildName, action, problem
) {
  try {
    await sendLog(
      guild,
      `Guild ${action} Problem`,
      `User: <@${userId}>\nGuild: ${guildName}\nProblem: ${problem}\nWhen: ${fmtTs()}`
    );
  } catch (_) {}
}

/**
 * Log general system error
 * @param {import('discord.js').Guild} guild
 * @param {string} context
 * @param {Error | string} error
 */
async function logSystemError(guild, context, error) {
  try {
    const errorMsg = typeof error === 'string'
      ? error : (error?.message || 'Unknown error');
    await sendLog(
      guild,
      'System Error',
      `Context: ${context}\nError: ${errorMsg}\nWhen: ${fmtTs()}`
    );
  } catch (_) {}
}

module.exports = {
  logMemberJoin,
  logMemberLeave,
  logGuildRegistered,
  logWarCreated,
  logWarFinished,
  logGuildScoreUpdated,
  logDmSent,
  logDmFailed,
  logCommandError,
  logGuildAssociationProblem,
  logSystemError,
};

