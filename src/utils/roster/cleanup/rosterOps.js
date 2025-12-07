const Guild = require('../../../models/guild/Guild');

/**
 * Remove a user from both main and sub rosters and persist the change.
 * Also removes from region-specific rosters.
 * @param {Object} guildDoc - Guild document to mutate and save.
 * @param {string} userId - User to remove from rosters.
 * @returns {Promise<{changed:boolean,removedMain:boolean,removedSub:boolean,regionRemovals:Array}>}
 */
async function removeUserFromGuildRosters(guildDoc, userId) {
  const res = {
    changed: false,
    removedMain: false,
    removedSub: false,
    regionRemovals: []
  };
  try {
    // Legacy global rosters
    const main = Array.isArray(guildDoc.mainRoster) ? guildDoc.mainRoster : [];
    const sub = Array.isArray(guildDoc.subRoster) ? guildDoc.subRoster : [];

    if (main.includes(userId)) {
      guildDoc.mainRoster = main.filter(id => id !== userId);
      res.removedMain = true;
      res.changed = true;
    }
    if (sub.includes(userId)) {
      guildDoc.subRoster = sub.filter(id => id !== userId);
      res.removedSub = true;
      res.changed = true;
    }

    // Region-specific rosters
    if (Array.isArray(guildDoc.regions)) {
      for (const r of guildDoc.regions) {
        const regionMain = Array.isArray(r.mainRoster) ? r.mainRoster : [];
        const regionSub = Array.isArray(r.subRoster) ? r.subRoster : [];
        let regionChanged = false;

        if (regionMain.includes(userId)) {
          r.mainRoster = regionMain.filter(id => id !== userId);
          res.regionRemovals.push({ region: r.region, roster: 'main' });
          regionChanged = true;
        }
        if (regionSub.includes(userId)) {
          r.subRoster = regionSub.filter(id => id !== userId);
          res.regionRemovals.push({ region: r.region, roster: 'sub' });
          regionChanged = true;
        }
        if (regionChanged) res.changed = true;
      }
    }

    if (res.changed) await guildDoc.save();
  } catch (err) {
    console.error(
      'Roster cleanup: error updating guild',
      String(guildDoc?._id || ''),
      err
    );
  }
  return res;
}

/**
 * Find guild docs in a server that reference a user in any roster/members.
 * Also checks region-specific rosters.
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
        { 'regions.mainRoster': userId },
        { 'regions.subRoster': userId },
      ],
    }).select({
      name: 1,
      members: 1,
      mainRoster: 1,
      subRoster: 1,
      regions: 1
    });

    return (docs || []).map(d => {
      const members = Array.isArray(d.members) ? d.members : [];
      const m = members.find(x => x.userId === userId) || null;
      const role = m?.role || null;

      // Check region-specific rosters
      const regionRefs = [];
      if (Array.isArray(d.regions)) {
        for (const r of d.regions) {
          const main = Array.isArray(r.mainRoster) ? r.mainRoster : [];
          const sub = Array.isArray(r.subRoster) ? r.subRoster : [];
          if (main.includes(userId) || sub.includes(userId)) {
            regionRefs.push({
              region: r.region,
              main: main.includes(userId),
              sub: sub.includes(userId)
            });
          }
        }
      }

      return {
        _id: String(d._id),
        name: d.name,
        refs: {
          member: !!m,
          leader: role === 'lider',
          coLeader: role === 'vice-lider',
          main: Array.isArray(d.mainRoster) && d.mainRoster.includes(userId),
          sub: Array.isArray(d.subRoster) && d.subRoster.includes(userId),
          regionRefs
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

