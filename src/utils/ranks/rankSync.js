const { getOrCreateRankConfig } = require('../misc/rankConfig');
const UserProfile = require('../../models/user/UserProfile');
const LoggerService = require('../../services/LoggerService');
const {
  getRankForWins,
  getAllRankRoleIds,
  updateTop10Ranks
} = require('../../services/rankService');

/**
 * Sync all rank roles for all members in a guild
 * @param {import('discord.js').Guild} discordGuild - Discord guild
 * @returns {Promise<{updated: number, errors: number}>}
 */
async function syncAllRanks(discordGuild) {
  try {
    const rankConfig = await getOrCreateRankConfig(discordGuild.id);
    const allRankRoles = getAllRankRoleIds(rankConfig);

    if (allRankRoles.length === 0) {
      return { updated: 0, errors: 0 };
    }

    // Fetch all guild members
    try {
      await discordGuild.members.fetch();
    } catch (_) {}

    const memberIds = [...discordGuild.members.cache
      .filter(m => !m.user?.bot)
      .keys()];

    // Get all user profiles for this guild's members
    const userProfiles = await UserProfile.find({
      discordUserId: { $in: memberIds }
    }).lean();

    const profileMap = new Map(
      userProfiles.map(p => [p.discordUserId, p.wagerWins || 0])
    );

    const result = await syncMemberRanks(
      discordGuild,
      rankConfig,
      allRankRoles,
      profileMap
    );

    // Also sync Top 10 roles
    await updateTop10Ranks(discordGuild);

    if (result.updated > 0 || result.errors > 0) {
      LoggerService.info('Rank roles synced:', {
        guildId: discordGuild.id,
        ...result
      });
    }

    return result;
  } catch (error) {
    LoggerService.error('Error syncing all ranks:', {
      guildId: discordGuild.id,
      error: error.message
    });
    return { updated: 0, errors: 1 };
  }
}

/**
 * Sync rank roles for all non-bot members
 * @param {import('discord.js').Guild} guild
 * @param {Object} rankConfig
 * @param {string[]} allRankRoles
 * @param {Map<string, number>} profileMap
 * @returns {Promise<{updated: number, errors: number}>}
 */
async function syncMemberRanks(guild, rankConfig, allRankRoles, profileMap) {
  let updated = 0;
  let errors = 0;

  for (const [memberId, member] of guild.members.cache) {
    if (member.user?.bot) continue;

    try {
      const wagerWins = profileMap.get(memberId) || 0;
      const newRankKey = getRankForWins(wagerWins);
      const newRankRoleId = newRankKey
        ? rankConfig[`${newRankKey}RoleId`]
        : null;

      // Remove incorrect rank roles
      const rolesToRemove = allRankRoles.filter(roleId =>
        member.roles.cache.has(roleId) && roleId !== newRankRoleId
      );

      for (const roleId of rolesToRemove) {
        await member.roles.remove(roleId);
        updated++;
      }

      // Add correct rank role if needed
      if (newRankRoleId && !member.roles.cache.has(newRankRoleId)) {
        await member.roles.add(newRankRoleId);
        updated++;
      }
    } catch (err) {
      errors++;
      LoggerService.warn('Failed to sync rank for member:', {
        memberId,
        error: err.message
      });
    }
  }

  return { updated, errors };
}

module.exports = { syncAllRanks };
