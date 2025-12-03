const { ChannelType, PermissionFlagsBits } = require('discord.js');

/**
 * Generate channel name based on ticket type and user
 * @param {string} ticketType - Type of ticket
 * @param {string} username - Username of the ticket creator
 * @returns {string} Channel name
 */
function generateChannelName(ticketType, username) {
  const sanitized = username.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 20);
  const typePrefix = {
    admin: 'admin-ticket',
    blacklist_appeal: 'blacklist-appeal',
    general: 'general-ticket',
    roster: 'roster-ticket'
  };
  return `${typePrefix[ticketType] || 'ticket'}-${sanitized}`;
}

/**
 * Create permission overwrites for ticket channel
 * @param {import('discord.js').Guild} guild - Discord guild
 * @param {string} userId - User ID who opened the ticket
 * @param {string} ticketType - Type of ticket (admin, blacklist_appeal, general, roster)
 * @param {Array<string>} adminSupportRoleIds - Admin support role IDs
 * @param {Array<string>} supportRoleIds - Regular support role IDs
 * @param {Array<string>} moderatorRoleIds - Moderator role IDs
 * @returns {Array} Permission overwrites
 */
async function createPermissionOverwrites(guild, userId, ticketType, adminSupportRoleIds, supportRoleIds, moderatorRoleIds) {
  const overwrites = [
    {
      id: guild.id,
      deny: [PermissionFlagsBits.ViewChannel]
    },
    {
      id: userId,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.AttachFiles,
        PermissionFlagsBits.EmbedLinks
      ]
    }
  ];

  // Add admin support roles (always have access)
  for (const roleId of adminSupportRoleIds || []) {
    const role = guild.roles.cache.get(roleId);
    if (role) {
      overwrites.push({
        id: roleId,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.ManageMessages,
          PermissionFlagsBits.AttachFiles,
          PermissionFlagsBits.EmbedLinks
        ]
      });
    }
  }

  // For admin tickets, ONLY admin support roles have access
  // For other ticket types, support and moderators also have access
  if (ticketType !== 'admin') {
    // Add support roles
    for (const roleId of supportRoleIds || []) {
      const role = guild.roles.cache.get(roleId);
      if (role) {
        overwrites.push({
          id: roleId,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.ManageMessages,
            PermissionFlagsBits.AttachFiles,
            PermissionFlagsBits.EmbedLinks
          ]
        });
      }
    }

    // Add moderator roles
    for (const roleId of moderatorRoleIds || []) {
      const role = guild.roles.cache.get(roleId);
      if (role) {
        overwrites.push({
          id: roleId,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.ManageMessages,
            PermissionFlagsBits.AttachFiles,
            PermissionFlagsBits.EmbedLinks
          ]
        });
      }
    }
  }

  return overwrites;
}

/**
 * Create general ticket channel with proper permissions
 * @param {import('discord.js').Guild} guild - Discord guild
 * @param {import('discord.js').CategoryChannel} category - Channel category
 * @param {import('discord.js').User} user - User opening the ticket
 * @param {string} ticketType - Type of ticket
 * @param {Array<string>} adminSupportRoleIds - Admin support role IDs
 * @param {Array<string>} supportRoleIds - Regular support role IDs
 * @param {Array<string>} moderatorRoleIds - Moderator role IDs
 * @returns {Promise<import('discord.js').TextChannel>} Created channel
 */
async function createGeneralTicketChannel(guild, category, user, ticketType, adminSupportRoleIds, supportRoleIds, moderatorRoleIds) {
  const channelName = generateChannelName(ticketType, user.username || user.tag || user.id);
  const overwrites = await createPermissionOverwrites(guild, user.id, ticketType, adminSupportRoleIds, supportRoleIds, moderatorRoleIds);

  return guild.channels.create({
    name: channelName,
    type: ChannelType.GuildText,
    parent: category.id,
    permissionOverwrites: overwrites,
    reason: `General ticket (${ticketType}) opened by ${user.tag || user.id}`,
  });
}

module.exports = {
  generateChannelName,
  createPermissionOverwrites,
  createGeneralTicketChannel
};

