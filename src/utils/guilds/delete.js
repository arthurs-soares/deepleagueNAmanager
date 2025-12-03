const Guild = require('../../models/guild/Guild');

async function deleteGuild(guildId, client) {
  const deletedGuild = await Guild.findByIdAndDelete(guildId);
  if (!deletedGuild) return { success: false, message: 'Guild not found.' };
  try {
    const discordGuild = client?.guilds?.cache?.get?.(deletedGuild.discordGuildId) || null;
    if (discordGuild) {
      const { removeGuildRosterThread } = require('../roster/rosterForumSync');
      await removeGuildRosterThread(discordGuild, deletedGuild.name);
    }
  } catch (err) {
    console.warn('Could not remove roster topic for deleted guild:', err?.message);
  }
  return { success: true, message: `Guild "${deletedGuild.name}" deleted successfully!` };
}

module.exports = { deleteGuild };

