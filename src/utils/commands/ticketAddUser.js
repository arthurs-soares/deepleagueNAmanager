/**
 * Ticket add-user handler
 * Extracted from ticketHandlers.js to comply with max-lines rule
 */
const { PermissionFlagsBits, MessageFlags } = require('discord.js');
const { createErrorEmbed, createSuccessEmbed } = require('../../utils/embeds/embedBuilder');
const { isModeratorOrHoster } = require('../../utils/core/permissions');
const War = require('../../models/war/War');
const WagerTicket = require('../../models/wager/WagerTicket');
const { sendLog } = require('../../utils/core/logger');

/**
 * Handle /ticket add-user
 * @param {ChatInputCommandInteraction} interaction - Interaction
 * @returns {Promise<void>}
 */
async function handleAddUser(interaction) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const hasPerm = await isModeratorOrHoster(
    interaction.member,
    interaction.guild.id
  );

  if (!hasPerm) {
    const container = createErrorEmbed(
      'Permission denied',
      'You do not have permission to use this command.'
    );
    return interaction.editReply({
      components: [container],
      flags: MessageFlags.IsComponentsV2
    });
  }

  const target = interaction.options.getUser('user', true);
  const channel = interaction.channel;

  const [war, wager] = await Promise.all([
    War.findOne({
      discordGuildId: interaction.guild.id,
      channelId: channel.id
    }),
    WagerTicket.findOne({
      discordGuildId: interaction.guild.id,
      channelId: channel.id
    })
  ]);

  if (!war && !wager) {
    const container = createErrorEmbed(
      'Not a ticket',
      'This command must be used within a ticket channel.'
    );
    return interaction.editReply({
      components: [container],
      flags: MessageFlags.IsComponentsV2
    });
  }

  const canView = channel.permissionsFor(target.id)?.has(
    PermissionFlagsBits.ViewChannel
  );

  if (canView) {
    const container = createErrorEmbed(
      'Already has access',
      `User <@${target.id}> already has access to this ticket.`
    );
    return interaction.editReply({
      components: [container],
      flags: MessageFlags.IsComponentsV2
    });
  }

  try {
    await channel.permissionOverwrites.edit(
      target.id,
      {
        ViewChannel: true,
        SendMessages: true,
        ReadMessageHistory: true,
        AttachFiles: true,
      },
      { reason: 'Added to ticket via /ticket add-user' }
    );
  } catch (_e) {
    const container = createErrorEmbed(
      'Failed to add',
      'Could not update channel permissions. Check bot permissions.'
    );
    return interaction.editReply({
      components: [container],
      flags: MessageFlags.IsComponentsV2
    });
  }

  const container = createSuccessEmbed(
    'User added',
    `User <@${target.id}> has been added to this ticket.`
  );
  await interaction.editReply({
    components: [container],
    flags: MessageFlags.IsComponentsV2
  });

  const ticketLabel = war ? `War ${war._id}` : `Wager Ticket ${wager._id}`;
  try {
    await sendLog(
      interaction.guild,
      '👤 User added to ticket',
      `${ticketLabel} — Added: <@${target.id}> by <@${interaction.user.id}>`
    );
  } catch (_) {}
}

module.exports = { handleAddUser };
