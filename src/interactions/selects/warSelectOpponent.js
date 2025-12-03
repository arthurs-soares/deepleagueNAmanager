const { ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const { ContainerBuilder, TextDisplayBuilder } = require('@discordjs/builders');
const { colors, emojis } = require('../../config/botConfig');
const Guild = require('../../models/guild/Guild');

/**
 * Opponent selection dropdown
 * CustomId: war:selectOpponent:<guildAId>
 */
async function handle(interaction) {
  try {
    const [, , guildAId] = interaction.customId.split(':');
    const guildBId = interaction.values?.[0];
    if (!guildAId || !guildBId) return interaction.deferUpdate();

    const [guildA, guildB] = await Promise.all([
      Guild.findById(guildAId),
      Guild.findById(guildBId),
    ]);
    if (!guildA || !guildB) return interaction.deferUpdate();

    const container = new ContainerBuilder();
    const primaryColor = typeof colors.primary === 'string'
      ? parseInt(colors.primary.replace('#', ''), 16)
      : colors.primary;
    container.setAccentColor(primaryColor);

    const titleText = new TextDisplayBuilder()
      .setContent(`# ${emojis.war} War Creation Flow`);

    const descText = new TextDisplayBuilder()
      .setContent(`War: ${guildA.name} VS ${guildB.name}`);

    const footerText = new TextDisplayBuilder()
      .setContent(`*${emojis.schedule} Click "Set Schedule" to enter date and time*`);

    container.addTextDisplayComponents(titleText, descText, footerText);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`war:openScheduleModal:${guildA._id}:${guildB._id}`)
        .setStyle(ButtonStyle.Secondary)
        .setLabel(`${emojis.schedule} Set Schedule`)
    );

    // Update the ephemeral message
    return interaction.update({
      components: [container, row],
      flags: MessageFlags.IsComponentsV2
    });
  } catch (error) {
    console.error('Error in war:selectOpponent select:', error);
    const { MessageFlags } = require('discord.js');
    const msg = { content: '❌ Error selecting opponent.', flags: MessageFlags.Ephemeral };
    if (interaction.deferred || interaction.replied) return interaction.followUp(msg);
    return interaction.reply(msg);
  }
}

module.exports = { handle };

