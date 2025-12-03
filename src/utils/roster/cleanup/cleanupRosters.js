const Guild = require('../../../models/guild/Guild');
const { recordGuildLeave } = require('../../rate-limiting/guildTransitionCooldown');
const { notifyLeaderOnMemberLeave } = require('../notifyLeaderOnMemberLeave');
const { logGuildMemberLeave } = require('../../guilds/activityLogger');
const { getLeaderUserId } = require('./leaderUtils');
const { removeUserFromGuildRosters } = require('./rosterOps');

/**
 * Clean up a departing user's presence from all rosters in a server.
 * @param {import('discord.js').Client} client - Discord client used for API calls.
 * @param {string} discordGuildId - Discord server ID.
 * @param {string} userId - User leaving the server or guild.
 * @param {Object} [options] - Optional behavior flags.
 * @param {boolean} [options.notifyLeaders=true] - DM guild leaders about removal.
 * @param {boolean} [options.recordCooldown=true] - Record guild leave cooldown.
 * @param {Date} [options.when=new Date()] - Timestamp of the event.
 * @param {string} [options.leaverUsername] - Display name to log/notify.
 * @returns {Promise<{affected:number,error?:boolean}>} Summary of work done.
 */
async function cleanupUserFromAllRosters(client, discordGuildId, userId, options = {}) {
  const notifyLeaders = options.notifyLeaders !== false; // default true
  const recordCooldown = options.recordCooldown !== false; // default true
  const when = options.when || new Date();
  const leaverUsername = options.leaverUsername;

  try {
    const impacted = await Guild.find({ discordGuildId, $or: [{ mainRoster: userId }, { subRoster: userId }] });
    if (!impacted || impacted.length === 0) return { affected: 0 };

    for (const doc of impacted) {
      try {
        const result = await removeUserFromGuildRosters(doc, userId);
        if (!result.changed) continue;

        if (recordCooldown) {
          try { await recordGuildLeave(discordGuildId, userId, String(doc._id), when); } catch (_) {}
        }

        try {
          if (result.removedMain) {
            await logGuildMemberLeave(discordGuildId, String(doc._id), doc.name, userId, leaverUsername || userId, 'main');
          }
          if (result.removedSub) {
            await logGuildMemberLeave(discordGuildId, String(doc._id), doc.name, userId, leaverUsername || userId, 'sub');
          }
        } catch (_) {}

        // Co-leader demotion if removed from main roster
        try {
          const members = Array.isArray(doc.members) ? doc.members : [];
          const co = members.find(m => m.userId === userId && m.role === 'vice-lider');
          if (co && result.removedMain) {
            co.role = 'membro';
            try { await doc.save(); } catch (_) {}
            try {
              const { getOrCreateRoleConfig } = require('../../misc/roleConfig');
              const cfg = await getOrCreateRoleConfig(discordGuildId);
              const coRoleId = cfg?.coLeadersRoleId;
              if (coRoleId) {
                try {
                  const g = await client.guilds.fetch(discordGuildId).catch(() => null);
                  const m = g ? await g.members.fetch(userId).catch(() => null) : null;
                  if (m && m.roles?.cache?.has(coRoleId)) await m.roles.remove(coRoleId).catch(() => {});
                } catch (_) {}
              }
            } catch (_) {}
          }
        } catch (e) { console.warn('Roster cleanup co-leader demotion failed:', e?.message); }

        if (notifyLeaders) {
          const leaderId = getLeaderUserId(doc);
          if (leaderId) {
            try {
              if (result.removedMain) {
                await notifyLeaderOnMemberLeave(client, leaderId, { leaverUserId: userId, leaverUsername, guildName: doc.name, roster: 'main', when, discordGuildId });
              }
              if (result.removedSub) {
                await notifyLeaderOnMemberLeave(client, leaderId, { leaverUserId: userId, leaverUsername, guildName: doc.name, roster: 'sub', when, discordGuildId });
              }
            } catch (_) {}
          }
        }
      } catch (err) {
        console.error('Roster cleanup: per-guild error', String(doc?._id || ''), err);
      }
    }

    return { affected: impacted.length };
  } catch (error) {
    console.error('Roster cleanup: query error', error);
    return { affected: 0, error: true };
  }
}

module.exports = { cleanupUserFromAllRosters };

