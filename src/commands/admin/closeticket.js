const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { createErrorEmbed } = require('../../utils/embeds/embedBuilder');
const { isModeratorOrHoster } = require('../../utils/core/permissions');
const { safeDeferEphemeral } = require('../../utils/core/ack');
const War = require('../../models/war/War');
const WagerTicket = require('../../models/wager/WagerTicket');
const GeneralTicket = require('../../models/ticket/GeneralTicket');
const { sendLog } = require('../../utils/core/logger');
const { sendTranscriptToLogs } = require('../../utils/tickets/transcript');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('closeticket')
    .setDescription('Close the current ticket channel (general, war, or wager tickets). Only moderators/hosters/admins.'),

  category: 'Admin',
  cooldown: 3,

  /**
   * Close the current ticket channel if recognized (general, war, or wager ticket)
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    // Defer immediately to prevent timeout
    await safeDeferEphemeral(interaction);

    try {
      const member = await interaction.guild.members.fetch(interaction.user.id);
      const allowed = await isModeratorOrHoster(member, interaction.guild.id);
      if (!allowed) {
        const container = createErrorEmbed('Permission denied', 'Only administrators, moderators or hosters can use this command.');
        return interaction.editReply({
          components: [container],
          flags: MessageFlags.IsComponentsV2
        });
      }

      const channel = interaction.channel;
      // Check if this channel is a war, wager, or general ticket channel
      const [war, wager, generalTicket] = await Promise.all([
        War.findOne({ discordGuildId: interaction.guild.id, channelId: channel.id }),
        WagerTicket.findOne({ discordGuildId: interaction.guild.id, channelId: channel.id }),
        GeneralTicket.findOne({ discordGuildId: interaction.guild.id, channelId: channel.id }),
      ]);
      if (!war && !wager && !generalTicket) {
        const container = createErrorEmbed('Not a ticket', 'This channel is not a recognized ticket channel.');
        return interaction.editReply({
          components: [container],
          flags: MessageFlags.IsComponentsV2
        });
      }

      // Update ticket records with closure information BEFORE generating transcript
      if (war) {
        war.closedByUserId = interaction.user.id;
        war.closedAt = new Date();
        await war.save();
      } else if (wager) {
        wager.status = 'closed';
        wager.closedByUserId = interaction.user.id;
        wager.closedAt = new Date();
        await wager.save();
      } else if (generalTicket) {
        generalTicket.status = 'closed';
        generalTicket.closedByUserId = interaction.user.id;
        generalTicket.closedAt = new Date();
        await generalTicket.save();
      }

      // Send transcript to logs before deleting (with timeout protection)
      try {
        // Determine ticket metadata and label
        const ticketMetadata = war || wager || generalTicket;
        const ticketTypeLabel = war ? `War ${war._id}` :
          wager ? `Wager Ticket ${wager._id}` :
            `General ticket (${generalTicket.ticketType})`;

        // Add a timeout to prevent transcript generation from blocking indefinitely
        const transcriptPromise = sendTranscriptToLogs(
          interaction.guild,
          channel,
          `${ticketTypeLabel} closed via /closeticket by ${interaction.user.tag}`,
          ticketMetadata
        );

        // Wait max 10 seconds for transcript
        await Promise.race([
          transcriptPromise,
          new Promise((resolve) => setTimeout(resolve, 10000))
        ]);
      } catch (transcriptError) {
        console.error('Error generating transcript:', transcriptError);
        // Continue with channel deletion even if transcript fails
      }

      try {
        await channel.delete('Ticket closed via /closeticket');
      } catch (err) {
        const container = createErrorEmbed('Close failed', `Could not close this ticket: ${err?.message || 'unknown error'}`);
        return interaction.editReply({
          components: [container],
          flags: MessageFlags.IsComponentsV2
        });
      }

      try {
        if (war) {
          await sendLog(
            interaction.guild,
            'War Ticket Closed',
            `War ${war._id} • Action by: <@${interaction.user.id}>`
          );
        } else if (wager) {
          await sendLog(
            interaction.guild,
            'Wager Ticket Closed',
            `Wager Ticket ${wager._id} • Action by: <@${interaction.user.id}>`
          );
        } else if (generalTicket) {
          const ticketTypeDisplay = {
            admin: 'Admin Ticket',
            blacklist_appeal: 'Blacklist Appeal',
            general: 'General Ticket',
            roster: 'Roster Ticket'
          }[generalTicket.ticketType] || generalTicket.ticketType;

          await sendLog(
            interaction.guild,
            'General Ticket Closed',
            `${ticketTypeDisplay} • Action by: <@${interaction.user.id}>`
          );
        }
      } catch (_) {}

      // No further reply since channel is deleted
      return;
    } catch (error) {
      console.error('Error in closeticket command:', error);
      const container = createErrorEmbed('Error', error?.message || 'Could not close the ticket.');

      try {
        if (interaction.deferred || interaction.replied) {
          return interaction.editReply({
            components: [container],
            flags: MessageFlags.IsComponentsV2
          });
        }
        return interaction.reply({
          components: [container],
          flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2
        });
      } catch (replyError) {
        // Interaction may have expired, log and continue
        console.error('Could not send error reply:', replyError);
      }
    }
  }
};

