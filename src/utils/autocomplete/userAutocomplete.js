/**
 * Build autocomplete choices for server members by username/nickname/tag
 * Keeps privacy and rate limits by fetching from cache first.
 */

/**
 * @param {import('discord.js').AutocompleteInteraction} interaction
 * @param {string} focusedName - the name of the focused option to filter
 */
async function respondUserAutocomplete(interaction, focusedName) {
  try {
    const focused = interaction.options.getFocused(true);
    if (focused.name !== focusedName) return;
    const query = String(focused.value || '').trim().toLowerCase();

    // Use cache; Discord.js cache generally has enough recent members
    const members = interaction.guild.members.cache;
    const choices = [];
    for (const [, m] of members) {
      const label = m.user?.tag || m.displayName || m.user?.username;
      if (!label) continue;
      const hay = label.toLowerCase();
      if (!query || hay.includes(query)) {
        choices.push({ name: label.slice(0, 100), value: m.user.id });
        if (choices.length >= 25) break;
      }
    }

    return interaction.respond(choices);
  } catch (e) {
    try {
      if (!interaction.responded) {
        await interaction.respond([]);
      }
    } catch (_) {}
  }
}

module.exports = { respondUserAutocomplete };

