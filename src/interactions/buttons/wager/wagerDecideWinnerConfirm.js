const { PermissionFlagsBits, MessageFlags } = require('discord.js');
const WagerTicket = require('../../../models/wager/WagerTicket');
const { getOrCreateRoleConfig } = require('../../../utils/misc/roleConfig');
const { recordWager } = require('../../../utils/wager/wagerService');
const { buildWagerCloseButtonRow } = require('../../../utils/tickets/closeButtons');
const { isDatabaseConnected } = require('../../../config/database');
const LoggerService = require('../../../services/LoggerService');

/**
 * Confirm and execute wager winner decision
 * CustomId: wager:decideWinner:confirm:<ticketId>:<winnerKey>
 */
async function handle(interaction) {
  try {
    await interaction.deferUpdate();

    const parts = interaction.customId.split(':');
    const [, , , ticketId, winnerKey] = parts;

    if (!ticketId || !winnerKey) {
      return interaction.followUp({
        content: '❌ Invalid parameters.',
        flags: MessageFlags.Ephemeral
      });
    }

    if (!isDatabaseConnected()) {
      return interaction.followUp({
        content: '❌ Database is temporarily unavailable.',
        flags: MessageFlags.Ephemeral
      });
    }

    const member = await interaction.guild.members.fetch(interaction.user.id);
    const cfg = await getOrCreateRoleConfig(interaction.guild.id);
    const allowed = new Set([
      ...(cfg?.hostersRoleIds || []),
      ...(cfg?.moderatorsRoleIds || [])
    ]);
    const isAdmin = member.permissions?.has(PermissionFlagsBits.Administrator);
    const hasRole = member.roles.cache.some(r => allowed.has(r.id));
    if (!isAdmin && !hasRole) {
      return interaction.followUp({
        content: '❌ Only hosters, moderators or admins can record.',
        flags: MessageFlags.Ephemeral
      });
    }

    let ticket = await WagerTicket.findById(ticketId).catch(() => null);

    if (!ticket) {
      ticket = await WagerTicket.findOne({
        discordGuildId: interaction.guild.id,
        channelId: interaction.channel.id,
        status: 'open'
      });
    }

    if (!ticket) {
      return interaction.followUp({
        content: '❌ Ticket not found.',
        flags: MessageFlags.Ephemeral
      });
    }

    if (ticket.status !== 'open') {
      return interaction.followUp({
        content: '⚠️ This ticket is already closed or marked as dodge.',
        flags: MessageFlags.Ephemeral
      });
    }

    const winnerId = winnerKey === 'initiator'
      ? ticket.initiatorUserId
      : ticket.opponentUserId;
    const loserId = winnerKey === 'initiator'
      ? ticket.opponentUserId
      : ticket.initiatorUserId;

    // Apply ELO via existing service
    const embed = await recordWager(
      interaction.guild,
      interaction.user.id,
      winnerId,
      loserId,
      interaction.client
    );

    // Close ticket
    ticket.status = 'closed';
    await ticket.save();

    // Remove confirmation message components
    try {
      await interaction.message.edit({ components: [] });
    } catch (_) {}

    // Post to ticket channel
    const ch = interaction.guild.channels.cache.get(ticket.channelId);
    if (ch) {
      try {
        await ch.send({
          content: `✅ Result recorded by <@${interaction.user.id}>.`,
          components: [embed, buildWagerCloseButtonRow(ticket._id)],
          flags: MessageFlags.IsComponentsV2
        });
      } catch (_) {}
    }

    return interaction.followUp({
      content: '✅ Result applied.',
      flags: MessageFlags.Ephemeral
    });
  } catch (error) {
    LoggerService.error('Error confirming wager winner:', error);
    const msg = {
      content: '❌ Could not record the result.',
      flags: MessageFlags.Ephemeral
    };
    if (interaction.deferred || interaction.replied) {
      return interaction.followUp(msg);
    }
    return interaction.reply(msg);
  }
}

module.exports = { handle };
