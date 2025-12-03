const mongoose = require('mongoose');
const Guild = require('../../models/guild/Guild');

function isMongoConnected() {
  return mongoose.connection.readyState === 1;
}

async function listGuilds(discordGuildId) {
  if (!isMongoConnected()) return [];
  return Guild.findByDiscordGuild(discordGuildId);
}

module.exports = { listGuilds };

