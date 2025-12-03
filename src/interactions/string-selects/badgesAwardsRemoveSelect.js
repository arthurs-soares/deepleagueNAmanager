const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

/**
 * Prompt confirmation to remove selected award
 * CustomId: badges_awards:removeSelect:<category>:<sort>:<page>
 */
async function handle(interaction) {
  try {
    const awardId = interaction.values?.[0];
    if (!awardId) return interaction.reply({ content: '\u274c Invalid selection.', ephemeral: true });

    const confirmRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`badges_awards:removeConfirm:${awardId}:yes`).setLabel('Remove').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId(`badges_awards:removeConfirm:${awardId}:no`).setLabel('Cancel').setStyle(ButtonStyle.Secondary)
    );

    // Keep the same embed, add confirm row on top of existing components
    const components = [confirmRow, ...interaction.message.components];
    return interaction.update({ components });
  } catch (error) {
    console.error('Error preparing remove confirmation:', error);
    const msg = { content: '\u274c Could not prepare confirmation.', ephemeral: true };
    if (interaction.deferred || interaction.replied) return interaction.followUp(msg);
    return interaction.reply(msg);
  }
}

module.exports = { handle };

