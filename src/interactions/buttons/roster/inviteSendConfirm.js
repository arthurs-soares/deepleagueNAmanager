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
      const embed = createErrorEmbed(
        'Invalid data',
        'Missing confirmation data.'
      );
      return interaction.reply({
        components: [embed],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
      });
    }

    if (decision === 'no') {
      const embed = createSuccessEmbed(
        'Action cancelled',
        'The roster invitation was cancelled.'
      );
      return interaction.update({
        components: [embed],
        flags: MessageFlags.IsComponentsV2
      });
    }

    // decision === 'yes'
    const guildDoc = await getGuildById(guildId);
    if (!guildDoc) {
      const embed = createErrorEmbed(
        'Guild not found',
        'Could not find the guild in the database.'
      );
      return interaction.update({ components: [embed] });
    }

    // Send DM invite
    const invite = await sendRosterInvite(
      interaction.client,
      userId,
      guildDoc,
      roster,
      { id: interaction.user.id, username: interaction.user.username }
    );

    if (!invite.ok) {
      const embed = createErrorEmbed(
        'Could not send invite',
        invite.error || 'Failed to deliver the DM to the user.'
      );
      return interaction.update({ components: [embed] });
    }

    const rosterLabel = roster === 'main' ? 'Main Roster' : 'Sub Roster';
    const embed = createSuccessEmbed(
      'Invitation sent',
      `A DM invitation was sent to <@${userId}> to join the ` +
      `${rosterLabel} of "${guildDoc?.name}".\n` +
      `They must accept to be added.`
    );
    return interaction.update({ components: [embed] });
  } catch (error) {
    LoggerService.error('Error in rosterInviteSendConfirm:', { error });
    const embed = createErrorEmbed(
      'Error',
      'Could not process the roster invitation.'
    );
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
