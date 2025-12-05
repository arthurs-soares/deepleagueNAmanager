const mongoose = require('mongoose');
const Guild = require('../../models/guild/Guild');
const { normalizeRoleToPortuguese } = require('../core/roleMapping');

function isMongoConnected() {
  return mongoose.connection.readyState === 1;
}

/**
 * Register a new guild (supports multiple regions)
 * Allows same guild name in different regions
 * @param {{name:string, leader:string, leaderId?:string, registeredBy:string, discordGuildId:string, region:string, regions?:string[], iconUrl?:string}} guildData
 */
async function registerGuild(guildData) {
  if (!isMongoConnected()) {
    return {
      success: false,
      message: 'Database is not connected.',
      guild: null
    };
  }

  const {
    name,
    leader,
    leaderId,
    registeredBy,
    discordGuildId,
    region,
    regions,
    iconUrl
  } = guildData;

  // Use regions array if provided, otherwise fallback to single region
  const allRegions = regions && regions.length > 0 ? regions : [region];

  // Check if guild with same name exists in ANY of the requested regions
  for (const r of allRegions) {
    const existingGuild = await Guild.findByNameAndRegion(
      name,
      discordGuildId,
      r
    );
    if (existingGuild) {
      return {
        success: false,
        message: `A guild "${name}" already exists in ${r}.`,
        guild: null
      };
    }
  }

  // Build regions array with stats for each region
  const regionsData = allRegions.map(r => ({
    region: r,
    wins: 0,
    losses: 0,
    elo: 1000,
    registeredAt: new Date(),
    status: 'active'
  }));

  const newGuild = new Guild({
    name: String(name).trim(),
    leader: String(leader).trim(),
    registeredBy,
    discordGuildId,
    iconUrl: iconUrl || null,
    regions: regionsData,
    members: [{
      userId: leaderId || registeredBy,
      username: String(leader).trim(),
      role: normalizeRoleToPortuguese('leader'),
      joinedAt: new Date()
    }]
  });

  const savedGuild = await newGuild.save();

  // Build success message with all regions
  const regionsText = allRegions.join(', ');
  return {
    success: true,
    message: `Guild "${name}" registered in: ${regionsText}`,
    guild: savedGuild
  };
}

/**
 * Add existing guild to a new region
 * @param {string} guildId - Guild document ID
 * @param {string} region - Region to add
 * @param {string} _addedBy - User ID who added the region (for audit)
 * @returns {Promise<{success:boolean, message:string, guild:any}>}
 */
async function addGuildToRegion(guildId, region, _addedBy) {
  if (!isMongoConnected()) {
    return {
      success: false,
      message: 'Database is not connected.',
      guild: null
    };
  }

  const guild = await Guild.findById(guildId);
  if (!guild) {
    return { success: false, message: 'Guild not found.', guild: null };
  }

  // Check if already registered in this region
  const existingRegion = guild.regions.find(r => r.region === region);
  if (existingRegion) {
    if (existingRegion.status === 'active') {
      return {
        success: false,
        message: `Guild is already registered in ${region}.`,
        guild: null
      };
    }
    // Reactivate inactive region
    existingRegion.status = 'active';
    await guild.save();
    return {
      success: true,
      message: `Guild reactivated in ${region}.`,
      guild
    };
  }

  guild.regions.push({
    region,
    wins: 0,
    losses: 0,
    elo: 1000,
    registeredAt: new Date(),
    status: 'active'
  });

  await guild.save();
  return {
    success: true,
    message: `Guild registered in ${region}.`,
    guild
  };
}

/**
 * Remove guild from a region (set status to inactive)
 * @param {string} guildId - Guild document ID
 * @param {string} region - Region to remove
 * @returns {Promise<{success:boolean, message:string, guild:any}>}
 */
async function removeGuildFromRegion(guildId, region) {
  if (!isMongoConnected()) {
    return {
      success: false,
      message: 'Database is not connected.',
      guild: null
    };
  }

  const guild = await Guild.findById(guildId);
  if (!guild) {
    return { success: false, message: 'Guild not found.', guild: null };
  }

  const regionData = guild.regions.find(r => r.region === region);
  if (!regionData) {
    return {
      success: false,
      message: `Guild is not registered in ${region}.`,
      guild: null
    };
  }

  // Check if it's the only active region
  const activeRegions = guild.regions.filter(r => r.status === 'active');
  if (activeRegions.length <= 1 && regionData.status === 'active') {
    return {
      success: false,
      message: 'Cannot remove the only active region.',
      guild: null
    };
  }

  regionData.status = 'inactive';
  await guild.save();

  return {
    success: true,
    message: `Guild removed from ${region}.`,
    guild
  };
}

module.exports = { registerGuild, addGuildToRegion, removeGuildFromRegion };

