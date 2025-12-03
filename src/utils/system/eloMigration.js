/**
 * ELO migration script
 * - Sets elo=1000 for guilds missing the field
 */

const Guild = require('../../models/guild/Guild');

/**
 * Run migration for a Discord server
 * @param {string} discordGuildId
 * @returns {Promise<{updated:number}>}
 */
async function runEloMigration(discordGuildId) {
  const q = discordGuildId ? { discordGuildId } : {};
  const guilds = await Guild.find(q).select('_id elo');
  let updated = 0;
  for (const g of guilds) {
    if (!Number.isFinite(g.elo)) {
      g.elo = 1000;
      await g.save();
      updated++;
    }
  }
  return { updated };
}

module.exports = { runEloMigration };

