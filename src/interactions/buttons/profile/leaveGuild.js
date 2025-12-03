const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

/**
 * Opens confirmation to leave the guild
 * CustomId: profile:leaveGuild
 */
async function handle(interaction) {
  try {
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('profile:confirmLeave:yes').setStyle(ButtonStyle.Danger).setLabel('Confirm Leave'),
      new ButtonBuilder().setCustomId('profile:confirmLeave:no').setStyle(ButtonStyle.Secondary).setLabel('Cancel')
    );

    return interaction.reply({
      content: '⚠️ Are you sure you want to leave your guild? This action cannot be undone.',
      components: [row],
      ephemeral: true
    });
  } catch (error) {
    console.error('Error opening leave guild confirmation:', error);
    const msg = { content: '❌ Could not open the confirmation.', ephemeral: true };
    if (interaction.deferred || interaction.replied) return interaction.followUp(msg);
    return interaction.reply(msg);
  }
}

module.exports = { handle };
