const { MessageFlags } = require('discord.js');
const { createErrorEmbed, createSuccessEmbed } = require('../../utils/embeds/embedBuilder');
const { removeFromRoster, getGuildById } = require('../../utils/roster/rosterManager');
const { formatRosterCounts } = require('../../utils/roster/rosterUtils');
const { isGuildAdmin } = require('../../utils/core/permissions');
const { isGuildLeader } = require('../../utils/guilds/guildMemberManager');
const { auditAdminAction } = require('../../utils/misc/adminAudit');
const { sendRosterInvite } = require('../../utils/roster/sendRosterInvite');

/**
 * User Select Menu handler to choose user for roster action
 * Expected CustomId: roster_user_select:<guildId>:<action>
 * action: add_main | add_sub | remove_main | remove_sub
 * @param {UserSelectMenuInteraction} interaction
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

    const map = {
      add_main: { type: 'add', roster: 'main' },
      add_sub: { type: 'add', roster: 'sub' },
      remove_main: { type: 'remove', roster: 'main' },
      remove_sub: { type: 'remove', roster: 'sub' },
    };

    const conf = map[action];
    if (!conf) return interaction.deferUpdate();

    // Acknowledge early to avoid 10062
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const guildDoc = await getGuildById(guildId);

    if (conf.type === 'add') {
      // Send DM invite instead of immediate add
      const invite = await sendRosterInvite(
        interaction.client,
        userId,
        guildDoc,
        conf.roster,
        { id: interaction.user.id, username: interaction.user.username }
      );

      if (!invite.ok) {
        const embed = createErrorEmbed('Could not send invite', invite.error || 'Failed to deliver the DM to the user.');
        return interaction.editReply({ components: [embed], flags: MessageFlags.IsComponentsV2 });
      }

      const embed = createSuccessEmbed(
        'Invitation sent',
        `A DM invitation was sent to <@${userId}> to join the ${conf.roster === 'main' ? 'Main Roster' : 'Sub Roster'} of "${guildDoc?.name}".\nThey must accept to be added.`
      );
      return interaction.editReply({ components: [embed], flags: MessageFlags.IsComponentsV2 });
    }

    // Remove flows still execute immediately
    const result = await removeFromRoster(guildId, conf.roster, userId);
    if (!result.success) {
      let msg = result.message || 'Failed to process the action.';
      if (msg.includes('Usuário não está neste roster')) msg = 'User is not in this roster.';
      if (msg.includes('Guilda não encontrada')) msg = 'Guild not found.';
      const embed = createErrorEmbed('Action not completed', msg);
      return interaction.editReply({ components: [embed], flags: MessageFlags.IsComponentsV2 });
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

    const counts = formatRosterCounts(result.guild || guildDoc);
    const embed = createSuccessEmbed('Success', `${result.message}\n\n${counts}`);
    return interaction.editReply({ components: [embed], flags: MessageFlags.IsComponentsV2 });
  } catch (error) {
    console.error('Roster User Select error:', error);
    const embed = createErrorEmbed('Error', 'Could not process this action.');
    try {
      if (interaction.deferred || interaction.replied) {
        return await interaction.followUp({ components: [embed], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
      }
      return await interaction.reply({ components: [embed], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
    } catch (_) { /* ignore */ }
  }
}

module.exports = { handle };

