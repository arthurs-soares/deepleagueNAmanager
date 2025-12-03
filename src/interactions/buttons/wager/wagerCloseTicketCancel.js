const { MessageFlags } = require('discord.js');

/**
 * Cancel wager ticket closure
 * CustomId: wager:closeTicket:cancel:<ticketId>
 */
async function handle(interaction) {
  try {
    await interaction.update({
      content: '❌ Wager ticket closure cancelled.',
      components: [],
      flags: MessageFlags.Ephemeral
    });
  } catch (error) {
    console.error('Error cancelling wager ticket closure:', error);
    const msg = {
      content: '❌ An error occurred.',
      flags: MessageFlags.Ephemeral
    };
    if (interaction.deferred || interaction.replied) {
      return interaction.followUp(msg);
    }
    return interaction.reply(msg);
  }
}

module.exports = { handle };

