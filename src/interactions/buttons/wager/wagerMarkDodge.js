const { ActionRowBuilder, StringSelectMenuBuilder, MessageFlags } = require('discord.js');
const WagerTicket = require('../../../models/wager/WagerTicket');
const { getOrCreateRoleConfig } = require('../../../utils/misc/roleConfig');
const { isDatabaseConnected } = require('../../../config/database');
const LoggerService = require('../../../services/LoggerService');

/**
 * Start dodge flow for a wager (hosters/mods only)
 * CustomId: wager:markDodge:<ticketId>
 */
async function handle(interaction) {
  try {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const [, , ticketId] = interaction.customId.split(':');
    if (!ticketId) return interaction.editReply({ content: '❌ Ticket ID not provided.' });

    // Check database connection
    if (!isDatabaseConnected()) {
      return interaction.editReply({ content: '❌ Database is temporarily unavailable.' });
    }

    // Permissions: only Moderators/Hosters (configured in /config)
    const rolesCfg = await getOrCreateRoleConfig(interaction.guild.id);
    const allowedRoleIds = new Set([...(rolesCfg?.hostersRoleIds || []), ...(rolesCfg?.moderatorsRoleIds || [])]);
    const hasAllowedRole = interaction.member.roles.cache.some(r => allowedRoleIds.has(r.id));
    if (!hasAllowedRole) {
      return interaction.editReply({ content: '❌ Only hosters or moderators can mark a wager as dodge.' });
    }

    // Try to find by ID first, then by channel as fallback
    let ticket = await WagerTicket.findById(ticketId).catch(() => null);

    // Log ticket search result for debugging
    if (ticket) {
      LoggerService.debug('Ticket found by ID', {
        ticketId,
        status: ticket.status,
        channelId: ticket.channelId
      });
    }

    // Fallback: find by channel ID if the ticket ID lookup fails
    if (!ticket) {
      LoggerService.warn('Ticket not found by ID, trying channel fallback', {
        ticketId,
        channelId: interaction.channel?.id
      });
      ticket = await WagerTicket.findOne({
        discordGuildId: interaction.guild.id,
        channelId: interaction.channel.id
      }).sort({ createdAt: -1 }); // Get most recent ticket for this channel
    }

    if (!ticket) {
      LoggerService.warn('Ticket not found', { ticketId, channelId: interaction.channel?.id });
      return interaction.editReply({ content: '❌ Ticket not found.' });
    }

    // Check ticket status
    if (ticket.status !== 'open') {
      LoggerService.warn('Ticket is not open', {
        ticketId: ticket._id,
        status: ticket.status,
        channelId: ticket.channelId
      });
      return interaction.editReply({
        content: `⚠️ This ticket is not open (status: ${ticket.status}).`
      });
    }

    const sourceMessageId = interaction.message?.id || '0';

    const [initiatorUser, opponentUser] = await Promise.all([
      interaction.client.users.fetch(ticket.initiatorUserId).catch(() => null),
      interaction.client.users.fetch(ticket.opponentUserId).catch(() => null),
    ]);

    const menu = new StringSelectMenuBuilder()
      .setCustomId(`wager:dodge:select:${ticket._id}:${sourceMessageId}`)
      .setPlaceholder('Select which user dodged')
      .addOptions([
        { label: `Initiator: ${initiatorUser?.tag || ticket.initiatorUserId}`, value: ticket.initiatorUserId },
        { label: `Opponent: ${opponentUser?.tag || ticket.opponentUserId}`, value: ticket.opponentUserId },
      ]);

    const row = new ActionRowBuilder().addComponents(menu);
    return interaction.editReply({ content: 'Select which participant dodged this wager.', components: [row] });
  } catch (error) {
    LoggerService.error('Error in button wager:markDodge:', error);
    const msg = { content: '❌ Could not open the dodge selector.' };
    if (interaction.deferred || interaction.replied) return interaction.followUp({ ...msg, flags: MessageFlags.Ephemeral });
    return interaction.reply({ ...msg, flags: MessageFlags.Ephemeral });
  }
}

module.exports = { handle };

