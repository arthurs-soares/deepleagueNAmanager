const { MessageFlags } = require('discord.js');
const {
  createErrorEmbed,
  createSuccessEmbed
} = require('../../../utils/embeds/embedBuilder');
const { getGuildById } = require('../../../utils/roster/rosterManager');
const { sendRosterInvite } = require('../../../utils/roster/sendRosterInvite');
const LoggerService = require('../../../services/LoggerService');

/**
 * Handle roster invite send confirmation
 * CustomId: rosterInvite:sendConfirm:<guildId>:<roster>:<userId>:yes|no
 * @param {import('discord.js').ButtonInteraction} interaction
 */
async function handle(interaction) {
  try {
    const parts = interaction.customId.split(':');
    const guildId = parts[2];
    const roster = parts[3];
    const userId = parts[4];
    const decision = parts[5];

    if (!guildId || !roster || !userId || !decision) {
      const embed = createErrorEmbed('Invalid data', 'Missing confirmation.');
      return interaction.reply({
        components: [embed],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
      });
    }

    if (decision === 'no') {
      const embed = createSuccessEmbed('Cancelled', 'Invitation was cancelled.');
      return interaction.update({
        components: [embed],
        flags: MessageFlags.IsComponentsV2
      });
    }

    // Defer update for slow operations (DB + DM sending)
    await interaction.deferUpdate();

    // decision === 'yes'
    const guildDoc = await getGuildById(guildId);
    if (!guildDoc) {
      const embed = createErrorEmbed('Guild not found', 'Guild not in database.');
      return interaction.editReply({ components: [embed] });
    }

    // Send DM invite
    const invite = await sendRosterInvite(
      interaction.client, userId, guildDoc, roster,
      { id: interaction.user.id, username: interaction.user.username }
    );

    if (!invite.ok) {
      const embed = createErrorEmbed('Send failed', invite.error || 'DM failed.');
      return interaction.editReply({ components: [embed] });
    }

    const label = roster === 'main' ? 'Main Roster' : 'Sub Roster';
    const embed = createSuccessEmbed(
      'Invitation sent',
      `DM sent to <@${userId}> to join ${label} of "${guildDoc?.name}".`
    );
    return interaction.editReply({ components: [embed] });
  } catch (error) {
    LoggerService.error('Error in rosterInviteSendConfirm:', { error });
    const embed = createErrorEmbed('Error', 'Could not process the invitation.');
    if (interaction.deferred || interaction.replied) {
      return interaction.followUp({
        components: [embed],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
      });
    }
    return interaction.reply({
      components: [embed],
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
    });
  }
}

module.exports = { handle };
