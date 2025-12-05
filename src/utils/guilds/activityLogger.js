const GuildActivityLog = require('../../models/activity/GuildActivityLog');
const { withDatabase } = require('../../config/database');

/**
 * Parse roster string to extract roster type and region
 * Handles both new format 'main (Europe)' and legacy 'main'
 * @param {string} rosterInput - Roster string
 * @returns {{roster: string|null, region: string|null}}
 */
function parseRosterInput(rosterInput) {
  if (!rosterInput) return { roster: null, region: null };
  const match = rosterInput.match(/^(main|sub)(?:\s*\(([^)]+)\))?$/i);
  if (match) {
    return {
      roster: match[1].toLowerCase(),
      region: match[2] || null
    };
  }
  if (rosterInput === 'main' || rosterInput === 'sub') {
    return { roster: rosterInput, region: null };
  }
  return { roster: null, region: null };
}

/**
 * Log when a member joins an in-game guild
 * @param {string} discordGuildId - Discord server ID
 * @param {string} guildId - In-game guild Mongo ID
 * @param {string} guildName - Guild name
 * @param {string} userId - Discord user ID
 * @param {string} username - User display name
 * @param {string} rosterInput - Roster type (e.g., 'main' or 'main (Europe)')
 * @param {object} [metadata] - Additional data
 */
async function logGuildMemberJoin(
  discordGuildId,
  guildId,
  guildName,
  userId,
  username,
  rosterInput,
  metadata = null
) {
  try {
    const { roster, region } = parseRosterInput(rosterInput);
    await withDatabase(async () => {
      await GuildActivityLog.create({
        discordGuildId,
        guildId,
        guildName,
        activityType: 'join',
        userId,
        username,
        roster,
        region,
        metadata
      });
    });
  } catch (error) {
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
 * @param {string} rosterInput - Roster type (e.g., 'sub' or 'sub (Europe)')
 * @param {object} [metadata] - Additional data
 */
async function logGuildMemberLeave(
  discordGuildId,
  guildId,
  guildName,
  userId,
  username,
  rosterInput,
  metadata = null
) {
  try {
    const { roster, region } = parseRosterInput(rosterInput);
    await withDatabase(async () => {
      await GuildActivityLog.create({
        discordGuildId,
        guildId,
        guildName,
        activityType: 'leave',
        userId,
        username,
        roster,
        region,
        metadata
      });
    });
  } catch (error) {
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
 * @param {string} rosterInput - Roster type (e.g., 'main' or 'main (Europe)')
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
  rosterInput,
  metadata = null
) {
  try {
    const { roster, region } = parseRosterInput(rosterInput);
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
        region,
        metadata
      });
    });
  } catch (error) {
    console.error('Error logging guild invite:', error.message);
  }
}

module.exports = {
  logGuildMemberJoin,
  logGuildMemberLeave,
  logGuildInvite
};

