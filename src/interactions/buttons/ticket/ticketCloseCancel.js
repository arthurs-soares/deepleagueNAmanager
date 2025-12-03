const { MessageFlags } = require('discord.js');

/**
 * Cancel ticket closure
 * CustomId: ticket:close:cancel:<ticketId>
 */
async function handle(interaction) {
  try {
    await interaction.update({
      content: '❌ Ticket closure cancelled.',
      components: [],
      flags: MessageFlags.Ephemeral
    });
  } catch (error) {
    console.error('Error cancelling ticket closure:', error);
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

