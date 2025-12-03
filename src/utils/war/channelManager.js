// War channel management utilities
const { ChannelType, PermissionFlagsBits } = require('discord.js');

/**
 * Generate war channel name
 * @param {Object} guildA - Guild A document
 * @param {Object} guildB - Guild B document
 * @returns {string} Channel name
 */
function generateChannelName(guildA, guildB) {
  return `war-${guildA.name.replace(/\\s+/g, '-')}-vs-${guildB.name.replace(/\\s+/g, '-')}`
    .toLowerCase()
    .slice(0, 90);
}

/**
 * Collect allowed user IDs from guild leadership and managers
 * @param {Object} guildA - Guild A document
 * @param {Object} guildB - Guild B document
 * @param {string} initiatorId - User who initiated the war
 * @returns {Set} Set of user IDs
 */
function collectAllowedUsers(guildA, guildB, initiatorId) {
  const allowUserIds = new Set([initiatorId]);

  const pushLeadersAndManagers = (doc) => {
    // Add leaders and co-leaders
    (doc.members || []).forEach(m => {
      if (m.role === 'lider' || m.role === 'vice-lider') {
        allowUserIds.add(m.userId);
      }
    });
    // Add managers
    (doc.managers || []).forEach(managerId => {
      if (managerId) allowUserIds.add(managerId);
    });
  };

  pushLeadersAndManagers(guildA);
  pushLeadersAndManagers(guildB);

  return allowUserIds;
}

/**
 * Add user permissions to overwrites array
 * @param {Object} guild - Discord guild
 * @param {Set} allowUserIds - Set of allowed user IDs
 * @param {Array} overwrites - Overwrites array to modify
 */
async function addUserPermissions(guild, allowUserIds, overwrites) {
  for (const uid of allowUserIds) {
    try {
      const member = await guild.members.fetch(uid);
      if (member) {
        overwrites.push({
          id: uid,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.AttachFiles,
          ],
        });
      }
    } catch (_) {
      console.warn(`User ${uid} not found in server`);
    }
  }
}

/**
 * Add role permissions to overwrites array
 * @param {Object} guild - Discord guild
 * @param {Array} roleIdsHosters - Array of hoster role IDs
 * @param {Array} overwrites - Overwrites array to modify
 */
function addRolePermissions(guild, roleIdsHosters, overwrites) {
  for (const rid of roleIdsHosters) {
    const role = guild.roles.cache.get(rid);
    if (role) {
      overwrites.push({
        id: rid,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.AttachFiles,
        ],
      });
    }
  }
}

/**
 * Create permission overwrites for war channel
 * @param {Object} guild - Discord guild
 * @param {Set} allowUserIds - Set of allowed user IDs
 * @param {Array} roleIdsHosters - Array of hoster role IDs
 * @returns {Array} Permission overwrites
 */
async function createPermissionOverwrites(guild, allowUserIds, roleIdsHosters) {
  const overwrites = [
    {
      id: guild.roles.everyone.id,
      deny: [PermissionFlagsBits.ViewChannel]
    }
  ];

  await addUserPermissions(guild, allowUserIds, overwrites);
  addRolePermissions(guild, roleIdsHosters, overwrites);

  return overwrites;
}

/**
 * Create war channel with proper permissions
 * @param {Object} guild - Discord guild
 * @param {Object} category - Channel category
 * @param {Object} guildA - Guild A document
 * @param {Object} guildB - Guild B document
 * @param {Set} allowUserIds - Allowed user IDs
 * @param {Array} roleIdsHosters - Hoster role IDs
 * @returns {Object} Created channel
 */
async function createWarChannel(guild, category, guildA, guildB, allowUserIds, roleIdsHosters) {
  const channelName = generateChannelName(guildA, guildB);
  const overwrites = await createPermissionOverwrites(guild, allowUserIds, roleIdsHosters);

  return guild.channels.create({
    name: channelName,
    type: ChannelType.GuildText,
    parent: category.id,
    permissionOverwrites: overwrites,
    reason: `War channel: ${guildA.name} vs ${guildB.name}`,
  });
}

module.exports = {
  generateChannelName,
  collectAllowedUsers,
  createPermissionOverwrites,
  createWarChannel
};
