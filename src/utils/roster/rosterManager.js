const Guild = require('../../models/guild/Guild');
const { isDatabaseConnected } = require('../../config/database');
const { getGuildTransitionStatus, formatRemaining } = require('../rate-limiting/guildTransitionCooldown');
const { getUserGuildInfo } = require('../guilds/userGuildInfo');
const { logGuildMemberJoin, logGuildMemberLeave } = require('../guilds/activityLogger');

/**
 * Get a guild by its MongoDB ID
 * @param {string} guildId - Guild document ID (Mongo)
 * @returns {Promise<import('../../models/guild/Guild')|null>}
 */
async function getGuildById(guildId) {
  try {
    return await Guild.findById(guildId);
  } catch (error) {
    console.error('Error fetching guild by ID:', error);
    return null;
  }
}

/**
 * Add a user to the specified roster, respecting the limit of 5.
 * Applies cooldown only for TRANSITIONS BETWEEN GUILDS:
 * if the user recently left another guild on this Discord server,
 * block joining a DIFFERENT guild until it expires.
 * Re-joining the SAME guild is allowed.
 * @param {string} guildId - Guild ID (Mongo)
 * @param {('main'|'sub')} roster - Roster type
 * @param {string} userId - Discord user ID
 * @param {import('discord.js').Client} [client] - Optional Discord client for logging
 * @returns {Promise<{success:boolean, message:string, guild?:object}>}
 */
async function addToRoster(guildId, roster, userId, client = null) {
  try {
    // Check database connection first
    if (!isDatabaseConnected()) {
      return { success: false, message: 'Database is currently unavailable. Please try again later.' };
    }

    const doc = await Guild.findById(guildId);
    if (!doc) return { success: false, message: 'Guild not found.' };

    // Check if user is already a member of any guild (prevent cross-guild membership)
    if (doc?.discordGuildId) {
      const { guild: existingGuild } = await getUserGuildInfo(doc.discordGuildId, userId);
      if (existingGuild && String(existingGuild._id) !== String(guildId)) {
        // Log problema de entrada: já está em outra guilda
        try {
          const { logGuildAssociationProblem } = require('../misc/logEvents');
          if (client) {
            const guild = await client.guilds.fetch(doc.discordGuildId).catch(() => null);
            if (guild) {
              await logGuildAssociationProblem(
                guild,
                userId,
                doc.name,
                'entrada',
                `Usuário já é membro de "${existingGuild.name}"`
              );
            }
          }
        } catch (_) {}
        return { success: false, message: `User is already a member of guild "${existingGuild.name}". Users can only be in one guild at a time.` };
      }
    }

    // Transition cooldown: only block when trying to join a DIFFERENT guild
    try {
      const { active, remainingMs, lastLeftGuildId } = await getGuildTransitionStatus(doc.discordGuildId, userId);
      if (active && String(guildId) !== String(lastLeftGuildId)) {
        const remaining = formatRemaining(remainingMs);
        // Log problema de entrada: cooldown ativo
        try {
          const { logGuildAssociationProblem } = require('../misc/logEvents');
          if (client) {
            const guild = await client.guilds.fetch(doc.discordGuildId).catch(() => null);
            if (guild) {
              await logGuildAssociationProblem(
                guild,
                userId,
                doc.name,
                'entrada',
                `Cooldown de transição ativo (${remaining} restantes)`
              );
            }
          }
        } catch (_) {}
        return { success: false, message: `Guild transition cooldown is active. Please wait ${remaining} before joining another guild.` };
      }
    } catch (_) { /* silent */ }

    const field = roster === 'main' ? 'mainRoster' : 'subRoster';
    const list = Array.isArray(doc[field]) ? doc[field] : [];

    if (list.includes(userId)) {
      return { success: false, message: 'User is already in this roster.' };
    }

    if (list.length >= 5) {
      // Log problema de entrada: roster cheio
      try {
        const { logGuildAssociationProblem } = require('../misc/logEvents');
        if (client) {
          const guild = await client.guilds.fetch(doc.discordGuildId).catch(() => null);
          if (guild) {
            await logGuildAssociationProblem(
              guild,
              userId,
              doc.name,
              'entrada',
              `Roster ${roster} cheio (limite de 5 usuários atingido)`
            );
          }
        }
      } catch (_) {}
      return { success: false, message: 'Limit of 5 users per roster reached.' };
    }

    doc[field] = [...list, userId];
    await doc.save();

    // Log guild member join activity
    try {
      let username = userId;
      if (client) {
        try {
          const user = await client.users.fetch(userId);
          username = user?.username || user?.tag || userId;
        } catch (_) {}
      }
      await logGuildMemberJoin(
        doc.discordGuildId,
        String(doc._id),
        doc.name,
        userId,
        username,
        roster
      );
    } catch (_) {}

    return { success: true, message: 'User added to roster successfully.', guild: doc };
  } catch (error) {
    console.error('Error adding to roster:', error);
    // Log general error when adding
    try {
      const { logSystemError } = require('../misc/logEvents');
      const doc = await Guild.findById(guildId).catch(() => null);
      if (doc?.discordGuildId && client) {
        const guild = await client.guilds.fetch(doc.discordGuildId).catch(() => null);
        if (guild) {
          await logSystemError(guild, `Error adding user ${userId} to guild ${doc.name}`, error);
        }
      }
    } catch (_) {}
    return { success: false, message: 'Internal error adding to roster.' };
  }
}

/**
 * Remove a user from the specified roster
 * @param {string} guildId - Guild ID (Mongo)
 * @param {('main'|'sub')} roster - Roster type
 * @param {string} userId - Discord user ID
 * @returns {Promise<{success:boolean, message:string, guild?:object}>}
 */
async function removeFromRoster(guildId, roster, userId) {
  try {
    const doc = await Guild.findById(guildId);
    if (!doc) return { success: false, message: 'Guild not found.' };

    const field = roster === 'main' ? 'mainRoster' : 'subRoster';
    const list = Array.isArray(doc[field]) ? doc[field] : [];

    if (!list.includes(userId)) {
      return { success: false, message: 'User is not in this roster.' };
    }

    doc[field] = list.filter(id => id !== userId);
    await doc.save();

    // Log guild member leave activity
    try {
      await logGuildMemberLeave(
        doc.discordGuildId,
        String(doc._id),
        doc.name,
        userId,
        userId, // Username not available in this context
        roster
      );
    } catch (_) {}

    return { success: true, message: 'User removed from roster successfully.', guild: doc };
  } catch (error) {
    console.error('Error removing from roster:', error);
    return { success: false, message: 'Internal error removing from roster.' };
  }
}

module.exports = {
  getGuildById,
  addToRoster,
  removeFromRoster,
};

