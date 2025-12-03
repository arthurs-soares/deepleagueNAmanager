/**
 * Routes autocomplete interactions to the command's autocomplete method
 * @param {AutocompleteInteraction} interaction
 */
async function handleAutocomplete(interaction) {
  try {
    const command = interaction.client.commands.get(interaction.commandName);
    if (!command || typeof command.autocomplete !== 'function') return;

    await command.autocomplete(interaction);
  } catch (error) {
    console.error('Error in handleAutocomplete:', error);
    // Only try to respond if we haven't already responded
    try {
      if (!interaction.responded) {
        await interaction.respond([]);
      }
    } catch (_) {
      // Silently fail - interaction may have expired or been acknowledged elsewhere
    }
  }
}

module.exports = { handleAutocomplete };

