// Wager channel management utilities (mirrors war/channelManager with users)
const { ChannelType, PermissionFlagsBits } = require('discord.js');

function generateChannelName(initiatorTag, opponentTag) {
  return `wager-${initiatorTag.replace(/\s+/g, '-')}-vs-${opponentTag.replace(/\s+/g, '-')}`.toLowerCase().slice(0, 90);
}

async function createPermissionOverwritesForUsers(guild, userIds, roleIdsHosters) {
  const overwrites = [
    { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] }
  ];

  for (const uid of userIds) {
    try {
      const member = await guild.members.fetch(uid);
      if (member) {
        overwrites.push({
          id: uid,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.AttachFiles
          ]
        });
      }
    } catch (_) {}
  }

  for (const rid of roleIdsHosters || []) {
    const role = guild.roles.cache.get(rid);
    if (role) {
      overwrites.push({
        id: rid,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.AttachFiles
        ]
      });
    }
  }

  return overwrites;
}

async function createWagerChannel(guild, category, initiator, opponent, userIds, roleIdsHosters) {
  const name = generateChannelName(initiator.tag || initiator.username || initiator.id, opponent.tag || opponent.username || opponent.id);
  const permissionOverwrites = await createPermissionOverwritesForUsers(guild, userIds, roleIdsHosters);
  return guild.channels.create({
    name,
    type: ChannelType.GuildText,
    parent: category.id,
    permissionOverwrites,
    reason: `Wager channel: ${initiator.tag || initiator.id} vs ${opponent.tag || opponent.id}`,
  });
}

module.exports = { createWagerChannel };

