const { createErrorEmbed } = require('../utils/embeds/embedBuilder');
const { replyEphemeral } = require('../utils/core/reply');
const { resolveSelectHandler } = require('../utils/routing/selectRoutes');

/**
 * Routes Select Menu interactions (String/User/Role/Channel) to their respective handlers
 * @param {import('discord.js').AnySelectMenuInteraction} interaction
 */
async function handleSelectInteraction(interaction) {
  try {
    const { customId } = interaction;

    const modulePath = resolveSelectHandler(customId);
    if (modulePath) {
      const handler = require(modulePath);
      return handler.handle(interaction);
    }

    // If no handler matches, ignore
  } catch (error) {
    console.error('Error in handleSelectInteraction:', error);

    const embed = createErrorEmbed(
      'Interaction Error',
      'An error occurred while processing this menu.'
    );

    await replyEphemeral(interaction, { components: [embed] });
  }
}

module.exports = { handleSelectInteraction };

