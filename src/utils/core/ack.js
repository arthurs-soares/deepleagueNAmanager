const { MessageFlags } = require('discord.js');

/**
 * Safe helper to defer ephemeral replies without double-ack errors.
 * - Only defers if not already deferred/replied
 * - Catches Unknown interaction (10062) and Already acknowledged (40060)
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 */
async function safeDeferEphemeral(interaction) {
  try {
    if (!interaction.deferred && !interaction.replied) {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    }
  } catch (e) {
    const code = e?.code ?? e?.rawError?.code;
    if (code === 10062 || code === 40060 || code === 50027) return; // ignore benign cases
    throw e;
  }
}

/**
 * Safe helper to defer component update without double-ack errors.
 * Useful for buttons/selects that intend to update the original message
 * after doing async work. After deferring, prefer editing the message.
 * @param {import('discord.js').MessageComponentInteraction} interaction
 */
async function safeDeferUpdate(interaction) {
  try {
    if (!interaction.deferred && !interaction.replied) {
      await interaction.deferUpdate();
    }
  } catch (e) {
    const code = e?.code ?? e?.rawError?.code;
    if (code === 10062 || code === 40060 || code === 50027) return; // ignore benign cases
    throw e;
  }
}

module.exports = { safeDeferEphemeral, safeDeferUpdate };
