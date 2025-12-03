const mongoose = require('mongoose');
const Guild = require('../../models/guild/Guild');

function isMongoConnected() {
  return mongoose.connection.readyState === 1;
}

async function findGuildByName(name, discordGuildId) {
  try {
    return await Guild.findByName(name, discordGuildId);
  } catch (e) {
    return null;
  }
}

async function findGuildsByUser(userId, discordGuildId) {
  if (!isMongoConnected()) return [];
  return Guild.find({
    discordGuildId,
    members: { $elemMatch: { userId, role: { $in: ['lider', 'vice-lider'] } } },
  }).sort({ createdAt: -1 });
}

module.exports = { findGuildByName, findGuildsByUser };

