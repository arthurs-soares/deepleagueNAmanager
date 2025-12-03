const { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const { ContainerBuilder, TextDisplayBuilder } = require('@discordjs/builders');
const { setWarTicketsChannel } = require('../../utils/system/serverSettings');
const { colors, emojis } = require('../../config/botConfig');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('wartickets')
    .setDescription('Set this channel as the war tickets channel')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  category: 'Admin',
  cooldown: 5,

  async execute(interaction) {
    try {
      await setWarTicketsChannel(interaction.guild.id, interaction.channel.id);

      const container = new ContainerBuilder();
      const primaryColor = typeof colors.primary === 'string'
        ? parseInt(colors.primary.replace('#', ''), 16)
        : colors.primary;
      container.setAccentColor(primaryColor);

      const titleText = new TextDisplayBuilder()
        .setContent(`# ${emojis.war} War Tickets`);

      const descText = new TextDisplayBuilder()
        .setContent(`${emojis.info} To start a war, click the button below.`);

      const timestampText = new TextDisplayBuilder()
        .setContent(`*<t:${Math.floor(Date.now() / 1000)}:F>*`);

      container.addTextDisplayComponents(titleText, descText, timestampText);

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('war:start')
          .setStyle(ButtonStyle.Primary)
          .setLabel(`${emojis.war} Start War`)
      );

      await interaction.reply({
        components: [container, row],
        flags: MessageFlags.IsComponentsV2
      });
    } catch (error) {
      console.error('Error in /wartickets:', error);
      const err = { content: '❌ Could not configure the channel.', flags: MessageFlags.Ephemeral };
      if (interaction.deferred || interaction.replied) return interaction.followUp(err);
      return interaction.reply(err);
    }
  }
};

