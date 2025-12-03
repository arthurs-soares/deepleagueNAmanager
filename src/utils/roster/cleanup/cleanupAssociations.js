const Guild = require('../../../models/guild/Guild');
const { recordGuildLeave } = require('../../rate-limiting/guildTransitionCooldown');
const { notifyLeaderOnMemberLeave } = require('../notifyLeaderOnMemberLeave');
const { logGuildMemberLeave } = require('../../guilds/activityLogger');
const { getLeaderUserId } = require('./leaderUtils');
const { removeUserFromGuildRosters } = require('./rosterOps');

/**
 * Remove a user from rosters and optionally from members across all guilds.
 * @param {import('discord.js').Client} client - Discord client instance.
 * @param {string} discordGuildId - Discord server ID.
 * @param {string} userId - User to remove.
 * @param {Object} [options] - Behavior flags and metadata.
 * @param {boolean} [options.removeFromMembers=true] - Remove from members.
 * @param {boolean} [options.forceRemoveLeader=false] - Remove leaders too.
 * @param {boolean} [options.notifyLeaders=true] - Notify guild leaders.
 * @param {boolean} [options.recordCooldown=true] - Record leave cooldown.
 * @param {Date} [options.when=new Date()] - Event timestamp.
 * @param {string} [options.leaverUsername] - Name to show in logs/DMs.
 * @returns {Promise<{affected:number,changed:number,error?:boolean}>}
 */
async function cleanupUserFromAllGuildAssociations(client, discordGuildId, userId, options = {}) {
  const removeFromMembers = options.removeFromMembers !== false; // default true
  const forceRemoveLeader = options.forceRemoveLeader === true;
  const notifyLeaders = options.notifyLeaders !== false; // default true
  const recordCooldown = options.recordCooldown !== false; // default true
  const when = options.when || new Date();
  const leaverUsername = options.leaverUsername;

  try {
    const impacted = await Guild.find({
      discordGuildId,
      $or: [
        { members: { $elemMatch: { userId } } },
        { mainRoster: userId },
        { subRoster: userId },
      ],
    });

    let changedCount = 0;
    for (const doc of impacted) {
      let changed = false;
      const res = await removeUserFromGuildRosters(doc, userId);
      if (res.changed) changed = true;

      try {
        if (removeFromMembers) {
          const members = Array.isArray(doc.members) ? doc.members : [];
          const before = members.length;
          doc.members = members.filter(m => {
            if (!m || m.userId !== userId) return true;
            if (m.role === 'lider' && !forceRemoveLeader) return true; // keep leader unless forced
            return false; // remove membro/vice-lider, and leader if forced
          });
          if (doc.members.length !== before) changed = true;
        }
      } catch (e) {
        console.warn('Cleanup: error adjusting members', String(doc?._id || ''), e?.message);
      }

      if (changed) {
        try { await doc.save(); changedCount += 1; } catch (e) {}
        if (recordCooldown) { try { await recordGuildLeave(discordGuildId, userId, String(doc._id), when); } catch (_) {} }
        try {
          if (res.removedMain) {
            await logGuildMemberLeave(discordGuildId, String(doc._id), doc.name, userId, leaverUsername || userId, 'main');
          }
          if (res.removedSub) {
            await logGuildMemberLeave(discordGuildId, String(doc._id), doc.name, userId, leaverUsername || userId, 'sub');
          }
        } catch (_) {}
        if (notifyLeaders) {
          const leaderId = getLeaderUserId(doc);
          if (leaderId) {
            try {
              if (res.removedMain) {
                await notifyLeaderOnMemberLeave(client, leaderId, { leaverUserId: userId, leaverUsername, guildName: doc.name, roster: 'main', when, discordGuildId });
              }
              if (res.removedSub) {
                await notifyLeaderOnMemberLeave(client, leaderId, { leaverUserId: userId, leaverUsername, guildName: doc.name, roster: 'sub', when, discordGuildId });
              }
            } catch (_) {}
          }
        }
      }
    }

    return { affected: impacted.length, changed: changedCount };
  } catch (error) {
    console.error('cleanupUserFromAllGuildAssociations: query error', error);
    return { affected: 0, changed: 0, error: true };
  }
}

module.exports = { cleanupUserFromAllGuildAssociations };

