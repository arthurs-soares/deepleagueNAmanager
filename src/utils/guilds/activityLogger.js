const GuildActivityLog = require('../../models/activity/GuildActivityLog');
const { withDatabase } = require('../../config/database');

/**
 * Log when a member joins an in-game guild
 * @param {string} discordGuildId - Discord server ID
 * @param {string} guildId - In-game guild Mongo ID
 * @param {string} guildName - Guild name
 * @param {string} userId - Discord user ID
 * @param {string} username - User display name
 * @param {'main'|'sub'} roster - Roster type
 * @param {object} [metadata] - Additional data
 */
async function logGuildMemberJoin(
  discordGuildId,
  guildId,
  guildName,
  userId,
  username,
  roster,
  metadata = null
) {
  try {
    await withDatabase(async () => {
      await GuildActivityLog.create({
        discordGuildId,
        guildId,
        guildName,
        activityType: 'join',
        userId,
        username,
        roster,
        metadata
      });
    });
  } catch (error) {
    // Silent failure - logging should not break functionality
    console.error('Error logging guild member join:', error.message);
  }
}

/**
 * Log when a member leaves an in-game guild
 * @param {string} discordGuildId - Discord server ID
 * @param {string} guildId - In-game guild Mongo ID
 * @param {string} guildName - Guild name
 * @param {string} userId - Discord user ID
 * @param {string} username - User display name
 * @param {'main'|'sub'} roster - Roster type
 * @param {object} [metadata] - Additional data
 */
async function logGuildMemberLeave(
  discordGuildId,
  guildId,
  guildName,
  userId,
  username,
  roster,
  metadata = null
) {
  try {
    await withDatabase(async () => {
      await GuildActivityLog.create({
        discordGuildId,
        guildId,
        guildName,
        activityType: 'leave',
        userId,
        username,
        roster,
        metadata
      });
    });
  } catch (error) {
    // Silent failure - logging should not break functionality
    console.error('Error logging guild member leave:', error.message);
  }
}

/**
 * Log when a guild invite is sent
 * @param {string} discordGuildId - Discord server ID
 * @param {string} guildId - In-game guild Mongo ID
 * @param {string} guildName - Guild name
 * @param {string} inviterId - Discord user ID of inviter
 * @param {string} inviterUsername - Inviter display name
 * @param {string} inviteeId - Discord user ID of invitee
 * @param {string} inviteeUsername - Invitee display name
 * @param {'main'|'sub'} roster - Roster type
 * @param {object} [metadata] - Additional data
 */
async function logGuildInvite(
  discordGuildId,
  guildId,
  guildName,
  inviterId,
  inviterUsername,
  inviteeId,
  inviteeUsername,
  roster,
  metadata = null
) {
  try {
    await withDatabase(async () => {
      await GuildActivityLog.create({
        discordGuildId,
        guildId,
        guildName,
        activityType: 'invite',
        userId: inviteeId,
        username: inviteeUsername,
        inviterId,
        inviterUsername,
        roster,
        metadata
      });
    });
  } catch (error) {
    // Silent failure - logging should not break functionality
    console.error('Error logging guild invite:', error.message);
  }
}

module.exports = {
  logGuildMemberJoin,
  logGuildMemberLeave,
  logGuildInvite
};

