const Guild = require('../../../models/guild/Guild');

/**
 * Remove a user from both main and sub rosters and persist the change.
 * @param {Object} guildDoc - Guild document to mutate and save.
 * @param {string} userId - User to remove from rosters.
 * @returns {Promise<{changed:boolean,removedMain:boolean,removedSub:boolean}>}
 */
async function removeUserFromGuildRosters(guildDoc, userId) {
  const res = { changed: false, removedMain: false, removedSub: false };
  try {
    const main = Array.isArray(guildDoc.mainRoster) ? guildDoc.mainRoster : [];
    const sub = Array.isArray(guildDoc.subRoster) ? guildDoc.subRoster : [];

    if (main.includes(userId)) {
      guildDoc.mainRoster = main.filter(id => id !== userId);
      res.removedMain = true; res.changed = true;
    }
    if (sub.includes(userId)) {
      guildDoc.subRoster = sub.filter(id => id !== userId);
      res.removedSub = true; res.changed = true;
    }
    if (res.changed) await guildDoc.save();
  } catch (err) {
    console.error('Roster cleanup: error updating guild', String(guildDoc?._id || ''), err);
  }
  return res;
}

/**
 * Find guild docs in a server that reference a user in any roster/members.
 * @param {string} discordGuildId - Discord server ID.
 * @param {string} userId - User to search for.
 * @returns {Promise<Array<Object>>} Summaries of references per guild.
 */
async function findUserGuildRefs(discordGuildId, userId) {
  try {
    const docs = await Guild.find({
      discordGuildId,
      $or: [
        { members: { $elemMatch: { userId } } },
        { mainRoster: userId },
        { subRoster: userId },
      ],
    }).select({ name: 1, members: 1, mainRoster: 1, subRoster: 1 });

    return (docs || []).map(d => {
      const members = Array.isArray(d.members) ? d.members : [];
      const m = members.find(x => x.userId === userId) || null;
      const role = m?.role || null;
      return {
        _id: String(d._id),
        name: d.name,
        refs: {
          member: !!m,
          leader: role === 'lider',
          coLeader: role === 'vice-lider',
          main: Array.isArray(d.mainRoster) && d.mainRoster.includes(userId),
          sub: Array.isArray(d.subRoster) && d.subRoster.includes(userId),
        },
      };
    });
  } catch (err) {
    console.error('findUserGuildRefs error:', err);
    return [];
  }
}

module.exports = {
  removeUserFromGuildRosters,
  findUserGuildRefs,
};

