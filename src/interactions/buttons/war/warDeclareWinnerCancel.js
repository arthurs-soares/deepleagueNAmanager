const { MessageFlags } = require('discord.js');

/**
 * Cancel the war winner declaration
 * CustomId: war:declareWinner:cancel:<warId>
 */
async function handle(interaction) {
  try {
    await interaction.deferUpdate();

    // Remove the confirmation message components
    try {
      await interaction.message.edit({ components: [] });
    } catch (_) {}

    return interaction.followUp({
      content: '❌ Winner declaration cancelled.',
      flags: MessageFlags.Ephemeral
    });
  } catch (error) {
    const msg = {
      content: '❌ Could not cancel.',
      flags: MessageFlags.Ephemeral
    };
    if (interaction.deferred || interaction.replied) {
      return interaction.followUp(msg);
    }
    return interaction.reply(msg);
  }
}

module.exports = { handle };
