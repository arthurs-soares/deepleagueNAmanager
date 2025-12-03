const { MessageFlags } = require('discord.js');
const { createErrorEmbed, createSuccessEmbed } = require('../../utils/embeds/embedBuilder');
const { removeFromRoster, getGuildById } = require('../../utils/roster/rosterManager');
const { isGuildAdmin } = require('../../utils/core/permissions');
const { isGuildLeader } = require('../../utils/guilds/guildMemberManager');
const { auditAdminAction } = require('../../utils/misc/adminAudit');

/**
 * String Select Menu handler for removing specific roster members
 * Expected CustomId: roster_member_select:<guildId>:<action>:<source>
 * action: remove_main | remove_sub
 * source: admin | user
 * @param {StringSelectMenuInteraction} interaction
 */
async function handle(interaction) {
  try {
    const parts = interaction.customId.split(':');
    const guildId = parts[1];
    const action = parts[2];
    // source unused but kept for customId consistency

    if (!guildId || !action) {
      const embed = createErrorEmbed('Invalid data', 'Insufficient information to process the action.');
      return interaction.reply({ components: [embed], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
    }

    const userId = interaction.values?.[0];
    if (!userId) return interaction.deferUpdate();

    // Validate action
    if (!['remove_main', 'remove_sub'].includes(action)) {
      return interaction.deferUpdate();
    }

    // Acknowledge early to avoid 10062
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const guildDoc = await getGuildById(guildId);
    if (!guildDoc) {
      const embed = createErrorEmbed('Guild not found', 'Could not find the guild in the database.');
      return interaction.editReply({ components: [embed], flags: MessageFlags.IsComponentsV2 });
    }

    // Determine roster type
    const roster = action === 'remove_main' ? 'main' : 'sub';

    // Verify the user is still in the roster (double-check)
    const rosterField = roster === 'main' ? 'mainRoster' : 'subRoster';
    const rosterMembers = Array.isArray(guildDoc[rosterField]) ? guildDoc[rosterField] : [];

    if (!rosterMembers.includes(userId)) {
      const embed = createErrorEmbed('User not in roster', 'The selected user is no longer in this roster.');
      return interaction.editReply({ components: [embed], flags: MessageFlags.IsComponentsV2 });
    }

    // Verify the user is still in the Discord server
    try {
      await interaction.guild.members.fetch(userId);
    } catch (_) {
      // User has left the server, but we can still remove them from the roster
      // This is actually helpful for cleanup
    }

    // Remove from roster
    const result = await removeFromRoster(guildId, roster, userId);
    if (!result.success) {
      let msg = result.message || 'Failed to process the action.';
      if (msg.includes('Usuário não está neste roster')) msg = 'User is not in this roster.';
      if (msg.includes('Guilda não encontrada')) msg = 'Guild not found.';
      const embed = createErrorEmbed('Action not completed', msg);
      return interaction.editReply({ components: [embed], flags: MessageFlags.IsComponentsV2 });
    }
    // If removing from Main Roster and the user is current co-leader, demote automatically
    if (roster === 'main') {
      try {
        const members = Array.isArray(guildDoc.members) ? guildDoc.members : [];
        const co = members.find(m => m.userId === userId && m.role === 'vice-lider');
        if (co) {
          co.role = 'membro';
          await guildDoc.save();

          // Remove Discord co-leader role if configured
          try {
            const { getOrCreateRoleConfig } = require('../../utils/misc/roleConfig');
            const cfg = await getOrCreateRoleConfig(interaction.guild.id);
            const coRoleId = cfg?.coLeadersRoleId;
            if (coRoleId) {
              try {
                const member = await interaction.guild.members.fetch(userId);
                if (member?.roles?.cache?.has(coRoleId)) {
                  await member.roles.remove(coRoleId).catch(() => {});
                }
              } catch (_) { /* ignore */ }
            }
          } catch (_) { /* ignore */ }
        }
      } catch (e) {
        console.warn('Auto-demote co-leader on main roster removal failed:', e?.message);
      }
    }


    // Audit admin action on removal
    const memberSelf = await interaction.guild.members.fetch(interaction.user.id);
    const admin = await isGuildAdmin(memberSelf, interaction.guild.id);
    const leader = isGuildLeader(guildDoc, interaction.user.id);
    if (admin && !leader) {
      try {
        await auditAdminAction(interaction.guild, interaction.user.id, 'Edit Roster', {
          guildName: guildDoc?.name,
          guildId,
          targetUserId: userId,
          extra: `Action: ${action}`,
        });
      } catch (_) {}
    }

    // Success response
    const rosterName = roster === 'main' ? 'Main Roster' : 'Sub Roster';
    const embed = createSuccessEmbed(
      'Member removed',
      `<@${userId}> has been removed from the ${rosterName} of "${guildDoc?.name}".`
    );
    return interaction.editReply({ components: [embed], flags: MessageFlags.IsComponentsV2 });

  } catch (error) {
    console.error('Error in roster member select:', error);
    const embed = createErrorEmbed('Error', 'Could not process the roster removal.');
    if (interaction.deferred || interaction.replied) {
      return interaction.followUp({ components: [embed], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
    }
    return interaction.reply({ components: [embed], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
  }
}

module.exports = { handle };
