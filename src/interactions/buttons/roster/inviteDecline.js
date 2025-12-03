const { MessageFlags } = require('discord.js');
const { createInfoEmbed } = require('../../../utils/embeds/embedBuilder');
// eslint-disable-next-line no-unused-vars
const { sendDmOrFallback } = require('../../../utils/dm/dmFallback');

/**
 * Button handler for declining a roster invitation via DM
 * CustomId: rosterInvite:decline:<guildId>:<roster>
 */
async function handle(interaction) {
  // We do not need guildDoc here; simply acknowledge and disable buttons
  const embed = createInfoEmbed(
    'Invitation declined',
    'You have declined the invitation. If this was a mistake, ask a guild admin to resend.'
  );

  try { await interaction.message.edit({ components: [] }); } catch (_) {}
  try {
    // Inform inviter in thread if available in footer/metadata? Not available here; skip.
  } catch (_) {}
  return interaction.reply({ components: [embed], flags: MessageFlags.IsComponentsV2 });
}

module.exports = { handle };

