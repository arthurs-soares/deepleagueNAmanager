const { PermissionFlagsBits, MessageFlags } = require('discord.js');
const WagerTicket = require('../../../models/wager/WagerTicket');
const { getOrCreateRoleConfig } = require('../../../utils/misc/roleConfig');
const { recordWager } = require('../../../utils/wager/wagerService');
const { buildWagerCloseButtonRow } = require('../../../utils/tickets/closeButtons');
const { isDatabaseConnected } = require('../../../config/database');
const LoggerService = require('../../../services/LoggerService');

/**
 * Decide winner for a wager (hosters/mods/admin only)
 * CustomId: wager:decideWinner:<ticketId>:<winnerKey>[:<type>]
 * winnerKey in {initiator, opponent}; type is optional and ignored (Depths-only)
 */
async function handle(interaction) {
  try {
    await interaction.deferReply({ ephemeral: true });

    const parts = interaction.customId.split(':');
    const [, , ticketId, winnerKey] = parts;

    if (!ticketId || !winnerKey) {
      return interaction.editReply({ content: '❌ Invalid parameters.' });
    }

    // Check database connection
    if (!isDatabaseConnected()) {
      return interaction.editReply({ content: '❌ Database is temporarily unavailable.' });
    }

    const member = await interaction.guild.members.fetch(interaction.user.id);
    const cfg = await getOrCreateRoleConfig(interaction.guild.id);
    const allowed = new Set([...(cfg?.hostersRoleIds || []), ...(cfg?.moderatorsRoleIds || [])]);
    const isAdmin = member.permissions?.has(PermissionFlagsBits.Administrator);
    const hasRole = member.roles.cache.some(r => allowed.has(r.id));
    if (!isAdmin && !hasRole) {
      return interaction.editReply({ content: '❌ Only hosters, moderators or administrators can record the result.' });
    }

    // Try to find by ID first, then by channel as fallback
    let ticket = await WagerTicket.findById(ticketId).catch(() => null);

    // Fallback: find by channel ID if the ticket ID lookup fails
    if (!ticket) {
      LoggerService.warn('Ticket not found by ID, trying channel fallback', {
        ticketId,
        channelId: interaction.channel?.id
      });
      ticket = await WagerTicket.findOne({
        discordGuildId: interaction.guild.id,
        channelId: interaction.channel.id,
        status: 'open'
      });
    }

    if (!ticket) {
      LoggerService.warn('Ticket not found', { ticketId, channelId: interaction.channel?.id });
      return interaction.editReply({ content: '❌ Ticket not found.' });
    }

    if (ticket.status !== 'open') {
      return interaction.editReply({ content: '⚠️ This ticket is already closed or marked as dodge.' });
    }

    const winnerId = winnerKey === 'initiator' ? ticket.initiatorUserId : ticket.opponentUserId;
    const loserId = winnerKey === 'initiator' ? ticket.opponentUserId : ticket.initiatorUserId;

    // Apply ELO via existing service (Depths-only)
    const embed = await recordWager(interaction.guild, interaction.user.id, winnerId, loserId, interaction.client);

    // Close ticket
    ticket.status = 'closed';
    await ticket.save();

    try { await interaction.message.edit({ components: [] }).catch(() => {}); } catch (_) {}

    // Post to ticket channel
    const ch = interaction.guild.channels.cache.get(ticket.channelId);
    if (ch) {
      try {
        await ch.send({
          content: `✅ Result recorded by <@${interaction.user.id}>. Use the button below to close this ticket (transcript will be saved).`,
          components: [embed, buildWagerCloseButtonRow(ticket._id)],
          flags: MessageFlags.IsComponentsV2
        });
      } catch (_) {}
    }

    return interaction.editReply({ content: '✅ Result applied and ELO updated.' });
  } catch (error) {
    LoggerService.error('Error in button wager:decideWinner:', error);
    const msg = { content: '❌ Could not record the result.', flags: MessageFlags.Ephemeral };
    if (interaction.deferred || interaction.replied) return interaction.followUp(msg);
    return interaction.reply(msg);
  }
}

module.exports = { handle };

