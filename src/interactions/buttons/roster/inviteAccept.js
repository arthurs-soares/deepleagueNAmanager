const { MessageFlags } = require('discord.js');
const { createErrorEmbed, createSuccessEmbed } = require('../../../utils/embeds/embedBuilder');
const { addToRoster, getGuildById } = require('../../../utils/roster/rosterManager');
const { notifyInviterOnAccept } = require('../../../utils/roster/notifyInviterOnAccept');
const { safeDeferEphemeral } = require('../../../utils/core/ack');


/**
 * Button handler for accepting a roster invitation via DM
 * CustomId: rosterInvite:accept:<guildId>:<roster>
 */
async function handle(interaction) {
  try {
    await safeDeferEphemeral(interaction);

    const parts = interaction.customId.split(':');
    const guildId = parts[2];
    const roster = parts[3] === 'main' ? 'main' : 'sub';
    const inviterId = parts[4] || null; // Optional: inviter user id for notification

    if (!guildId) {
      const embed = createErrorEmbed('Invalid invitation', 'Missing guild information.');
      return interaction.editReply({ components: [embed], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
    }

    const guildDoc = await getGuildById(guildId);
    if (!guildDoc) {
      const embed = createErrorEmbed('Guild not found', 'This invitation refers to a guild that no longer exists.');
      return interaction.editReply({ components: [embed], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
    }

    const userId = interaction.user.id;

    const result = await addToRoster(guildId, roster, userId, interaction.client);
    if (!result.success) {
      // Ensure English-only UX
      const msg = result.message || 'We could not add you to the roster.';
      const embed = createErrorEmbed('Could not join', msg);
      return interaction.editReply({ components: [embed], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
    }

    const container = createSuccessEmbed(
      'You have joined the guild',
      `You were added to the ${roster === 'main' ? 'Main Roster' : 'Sub Roster'} of "${result.guild?.name || guildDoc.name}". Welcome!`
    );

    // Notify inviter, ignore errors (falls back to thread if DM closed)
    if (inviterId) {
      const acceptedUsername = interaction.user.tag || interaction.user.username;
      await notifyInviterOnAccept(interaction.client, inviterId, {
        acceptedUserId: interaction.user.id,
        acceptedUsername,
        guildName: result.guild?.name || guildDoc.name,
        roster,
        when: new Date(),
        discordGuildId: guildDoc.discordGuildId || interaction.guild?.id,
      }).catch(() => {});
    }

    // Disable buttons after success
    try { await interaction.message.edit({ components: [] }); } catch (_) {}

    return interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2 });
  } catch (error) {
    const container = createErrorEmbed('Error', 'An error occurred while processing your acceptance.');
    if (interaction.deferred || interaction.replied) {
      return interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
    }
    return interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
  }
}

module.exports = { handle };

