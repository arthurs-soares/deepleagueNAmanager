const Guild = require('../../models/guild/Guild');
const LoggerService = require('../../services/LoggerService');

/**
 * Delete a guild and remove its roster thread from all forums
 * @param {string} guildId - MongoDB guild ID
 * @param {import('discord.js').Client} client - Discord client
 * @returns {Promise<{success: boolean, message: string}>}
 */
async function deleteGuild(guildId, client) {
  const deletedGuild = await Guild.findByIdAndDelete(guildId);
  if (!deletedGuild) return { success: false, message: 'Guild not found.' };
  try {
    const discordGuild = client?.guilds?.cache?.get?.(
      deletedGuild.discordGuildId
    ) || null;
    if (discordGuild) {
      const { removeGuildRosterThread } = require('../roster/rosterForumSync');
      await removeGuildRosterThread(discordGuild, deletedGuild.name);
    }
  } catch (err) {
    LoggerService.warn('Could not remove roster topic for deleted guild', {
      guildId,
      guildName: deletedGuild.name,
      error: err?.message
    });
  }
  return {
    success: true,
    message: `Guild "${deletedGuild.name}" deleted successfully!`
  };
}

module.exports = { deleteGuild };

