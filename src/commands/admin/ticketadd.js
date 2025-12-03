const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { createErrorEmbed, createSuccessEmbed } = require('../../utils/embeds/embedBuilder');
const { isModeratorOrHoster } = require('../../utils/core/permissions');
const War = require('../../models/war/War');
const WagerTicket = require('../../models/wager/WagerTicket');
const { sendLog } = require('../../utils/core/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticketadd')
    .setDescription('Add a user to the current ticket (moderators/hosters/admins only).')
    .addUserOption(opt =>
      opt.setName('user').setDescription('User to add to the ticket').setRequired(true)
    ),

  category: 'Admin',
  cooldown: 3,

  /**
   * Adds permissions for the user to view/send messages in the ticket channel
   * @param {import('discord.js').GuildTextBasedChannel} channel
   * @param {string} userId
   */
  async addUserToChannel(channel, userId) {
    await channel.permissionOverwrites.edit(
      userId,
      {
        ViewChannel: true,
        SendMessages: true,
        ReadMessageHistory: true,
        AttachFiles: true,
      },
      { reason: 'Added to ticket via /ticketadd' }
    );
  },

  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const hasPerm = await isModeratorOrHoster(interaction.member, interaction.guild.id);
    if (!hasPerm) {
      const container = createErrorEmbed('Permission denied', 'You do not have permission to use this command.');
      return interaction.editReply({
        components: [container],
        flags: MessageFlags.IsComponentsV2
      });
    }

    const target = interaction.options.getUser('user', true);
    const channel = interaction.channel;

    // Verifica se é um canal de ticket (War ou Wager)
    const [war, wager] = await Promise.all([
      War.findOne({ discordGuildId: interaction.guild.id, channelId: channel.id }),
      WagerTicket.findOne({ discordGuildId: interaction.guild.id, channelId: channel.id }),
    ]);

    if (!war && !wager) {
      const container = createErrorEmbed('Not a ticket', 'This command must be used within a ticket channel.');
      return interaction.editReply({
        components: [container],
        flags: MessageFlags.IsComponentsV2
      });
    }

    // Avoid adding if user already has access
    const canView = channel.permissionsFor(target.id)?.has(PermissionFlagsBits.ViewChannel);
    if (canView) {
      const container = createErrorEmbed('Already has access', `User <@${target.id}> already has access to this ticket.`);
      return interaction.editReply({
        components: [container],
        flags: MessageFlags.IsComponentsV2
      });
    }

    try {
      await module.exports.addUserToChannel(channel, target.id);
    } catch (e) {
      const container = createErrorEmbed('Failed to add', 'Could not update channel permissions. Check bot permissions.');
      return interaction.editReply({
        components: [container],
        flags: MessageFlags.IsComponentsV2
      });
    }

    const container = createSuccessEmbed('User added', `User <@${target.id}> has been added and can now view and send messages in this ticket.`);
    await interaction.editReply({
      components: [container],
      flags: MessageFlags.IsComponentsV2
    });

    // Log opcional
    const ticketLabel = war ? `War ${war._id}` : `Wager Ticket ${wager._id}`;
    try {
      await sendLog(interaction.guild, '👤 User added to ticket', `${ticketLabel} — Added: <@${target.id}> by <@${interaction.user.id}> in #${channel.name}`);
    } catch (_) {}
  }
};

