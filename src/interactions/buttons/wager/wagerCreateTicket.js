const { ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const { ContainerBuilder, TextDisplayBuilder } = require('@discordjs/builders');
const { getOrCreateServerSettings } = require('../../../utils/system/serverSettings');
const { getOrCreateRoleConfig } = require('../../../utils/misc/roleConfig');
const { createWagerChannel } = require('../../../utils/wager/wagerChannelManager');
const { sendAndPin } = require('../../../utils/tickets/pinUtils');
const WagerTicket = require('../../../models/wager/WagerTicket');
const LoggerService = require('../../../services/LoggerService');

/**
 * Create wager ticket channel and panel
 * CustomId: wager:createTicket:<opponentUserId>
 */
async function handle(interaction) {
  try {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const [, , opponentUserId] = interaction.customId.split(':');
    if (!opponentUserId) return interaction.editReply({ content: '❌ Missing opponent.' });

    // War wagers removed: no leader/co-leader restrictions for wagers
    const roleCfg = await getOrCreateRoleConfig(interaction.guild.id);

    const settings = await getOrCreateServerSettings(interaction.guild.id);

    // Category selection: only Wager Category is used for player-to-player wagers
    const wagerCatId = settings.wagerCategoryId;
    const catId = wagerCatId;

    if (!catId) {
      return interaction.editReply({ content: '⚠️ Category for wager channels not configured. Set it in /config → Channels.' });
    }

    const category = interaction.guild.channels.cache.get(catId);
    if (!category || category.type !== ChannelType.GuildCategory) {
      return interaction.editReply({ content: '❌ Configured category is invalid.' });
    }

    const roleIdsHosters = roleCfg?.hostersRoleIds || [];

    const initiator = interaction.user;
    const opponent = await interaction.client.users.fetch(opponentUserId).catch(() => null);
    if (!opponent) return interaction.editReply({ content: '❌ Opponent not found.' });

    const userIds = new Set([initiator.id, opponent.id]);
    const channel = await createWagerChannel(interaction.guild, category, initiator, opponent, userIds, roleIdsHosters);

    const ticket = await WagerTicket.create({
      discordGuildId: interaction.guild.id,
      channelId: channel.id,
      initiatorUserId: initiator.id,
      opponentUserId: opponent.id,
    });

    const container = new ContainerBuilder();
    container.setAccentColor(0x5865f2);

    const titleText = new TextDisplayBuilder()
      .setContent('# 🎲 Wager Ticket');

    const descText = new TextDisplayBuilder()
      .setContent('Use this channel to coordinate the wager. When finished or cancelled, a moderator/hoster can close the ticket.');

    const timestampText = new TextDisplayBuilder()
      .setContent(`*<t:${Math.floor(Date.now() / 1000)}:F>*`);

    container.addTextDisplayComponents(titleText, descText, timestampText);

    const actionRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`wager:accept:${ticket._id}`).setStyle(ButtonStyle.Success).setLabel('Accept Wager'),
      new ButtonBuilder().setCustomId(`wager:closeTicket:${ticket._id}`).setStyle(ButtonStyle.Secondary).setLabel('Close Ticket'),
      new ButtonBuilder().setCustomId(`wager:markDodge:${ticket._id}`).setStyle(ButtonStyle.Danger).setLabel('Mark Dodge')
    );

    try {
      await channel.send({
        content: `<@${initiator.id}> vs <@${opponent.id}>`,
        allowedMentions: { users: [initiator.id, opponent.id] }
      });
    } catch (_) {}

    // Note: Hosters are NOT mentioned on ticket creation
    // They will be mentioned only when someone clicks the "Accept" button

    try { await sendAndPin(channel, { components: [container, actionRow], flags: MessageFlags.IsComponentsV2 }, { unpinOld: true }); } catch (_) {}

    return interaction.editReply({ content: `✅ Wager ticket created: <#${channel.id}>` });
  } catch (error) {
    LoggerService.error('Error creating wager ticket:', error);
    const msg = { content: '❌ Could not create the wager ticket.', flags: MessageFlags.Ephemeral };
    if (interaction.deferred || interaction.replied) return interaction.followUp(msg);
    return interaction.reply(msg);
  }
}

module.exports = { handle };

