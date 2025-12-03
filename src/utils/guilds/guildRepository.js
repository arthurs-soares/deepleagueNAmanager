/**
 * Guild repository helpers for DB access
 */
const Guild = require('../../models/guild/Guild');

/**
 * Count guilds by Discord guild (server) ID
 * @param {string} discordGuildId
 * @returns {Promise<number>}
 */
async function countGuildsByDiscordGuildId(discordGuildId) {
  return Guild.countDocuments({ discordGuildId });
}

module.exports = {
  countGuildsByDiscordGuildId,
};

