const { createErrorEmbed, createSuccessEmbed } = require('../../utils/embeds/embedBuilder');
const Guild = require('../../models/guild/Guild');
const { isGuildLeader, transferLeadership, findMember } = require('../../utils/guilds/guildMemberManager');
const { isGuildAdmin } = require('../../utils/core/permissions');
const { auditAdminAction } = require('../../utils/misc/adminAudit');

/**
 * User Select handler to choose new leader
 * CustomId: transfer_leader_user_select:<guildId>
 * @param {UserSelectMenuInteraction} interaction
 */
async function handle(interaction) {
  try {
    const parts = interaction.customId.split(':');
    const guildId = parts[1];
    if (!guildId) {
      const embed = createErrorEmbed('Invalid data', 'GuildId not provided.');
      const { MessageFlags } = require('discord.js');
      return interaction.reply({ components: [embed], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
    }

    const newLeaderId = interaction.values?.[0];
    if (!newLeaderId) return interaction.deferUpdate();

    const guildDoc = await Guild.findById(guildId);
    if (!guildDoc) {
      const embed = createErrorEmbed('Not found', 'Guild not found.');
      const { MessageFlags } = require('discord.js');
      return interaction.reply({ components: [embed], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
    }

    const member = await interaction.guild.members.fetch(interaction.user.id);
    const admin = await isGuildAdmin(member, interaction.guild.id);
    if (!admin && !isGuildLeader(guildDoc, interaction.user.id)) {
      const embed = createErrorEmbed('Permission denied', 'Only the current leader or a server administrator can transfer leadership.');
      const { MessageFlags } = require('discord.js');
      return interaction.reply({ components: [embed], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
    }

    // Resolve o nome do novo líder
    let newLeaderName = findMember(guildDoc, newLeaderId)?.username;
    if (!newLeaderName) {
      try {
        const user = await interaction.client.users.fetch(newLeaderId);
        newLeaderName = user?.username || newLeaderId;
      } catch (_) {
        newLeaderName = newLeaderId;
      }
    }

    const result = await transferLeadership(guildId, newLeaderId, newLeaderName);
    if (!result.success) {
      const embed = createErrorEmbed('Transfer failed', result.message);
      const { MessageFlags } = require('discord.js');
      return interaction.reply({ components: [embed], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
    }

    // Audit: if an administrator (who is not a leader) performed the action
    const leader = isGuildLeader(guildDoc, interaction.user.id);
    if (admin && !leader) {
      try {
        await auditAdminAction(interaction.guild, interaction.user.id, 'Transfer Leadership', {
          guildName: guildDoc.name,
          guildId,
          targetUserId: newLeaderId,
          extra: `New leader: ${newLeaderName}`,
        });
      } catch (_) {}
    }

    const embed = createSuccessEmbed('Leadership transferred', `New leader: ${newLeaderName}`);
    const { MessageFlags } = require('discord.js');
    return interaction.reply({ components: [embed], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
  } catch (error) {
    console.error('Error in leadership transfer User Select:', error);
    const embed = createErrorEmbed('Error', 'Could not complete the transfer.');
    const { MessageFlags } = require('discord.js');
    if (interaction.deferred || interaction.replied) {
      return interaction.followUp({ components: [embed], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
    }
    return interaction.reply({ components: [embed], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
  }
}

module.exports = { handle };

