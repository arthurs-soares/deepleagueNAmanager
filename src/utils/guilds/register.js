const mongoose = require('mongoose');
const Guild = require('../../models/guild/Guild');
const { normalizeRoleToPortuguese } = require('../core/roleMapping');

function isMongoConnected() {
  return mongoose.connection.readyState === 1;
}

/**
 * Register a new guild
 * @param {{name:string, leader:string, leaderId?:string, registeredBy:string, discordGuildId:string}} guildData
 */
async function registerGuild(guildData) {
  if (!isMongoConnected()) {
    return { success: false, message: 'Database is not connected. Cannot register guilds at the moment.', guild: null };
  }
  const { name, leader, leaderId, registeredBy, discordGuildId } = guildData;
  const existingGuild = await Guild.findByName(name, discordGuildId);
  if (existingGuild) {
    return { success: false, message: `A guild with the name "${name}" already exists on this server.`, guild: null };
  }
  const newGuild = new Guild({
    name: String(name).trim(),
    leader: String(leader).trim(),
    registeredBy,
    discordGuildId,
    members: [{ userId: leaderId || registeredBy, username: String(leader).trim(), role: normalizeRoleToPortuguese('leader'), joinedAt: new Date() }]
  });
  const savedGuild = await newGuild.save();
  return { success: true, message: `Guild "${name}" registered successfully!`, guild: savedGuild };
}

module.exports = { registerGuild };

