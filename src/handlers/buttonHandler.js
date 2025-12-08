const { createErrorEmbed } = require('../utils/embeds/embedBuilder');
const { MessageFlags } = require('discord.js');
const { resolveButtonHandler } = require('../utils/routing/buttonRoutes');
const { safeInteractionReply, isInteractionExpired } = require('../utils/core/interactionUtils');
const LoggerService = require('../services/LoggerService');

/**
 * Routes button interactions to their respective handlers
 * @param {ButtonInteraction} interaction
 */
async function handleButtonInteraction(interaction) {
  try {
    // Check if interaction is expired before processing
    if (isInteractionExpired(interaction)) {
      LoggerService.warn('Button interaction expired:', {
        customId: interaction.customId,
        userId: interaction.user?.id,
        age: Date.now() - (interaction.createdTimestamp || Date.now())
      });
      return;
    }

    const { customId } = interaction;

    const modulePath = resolveButtonHandler(customId);
    if (modulePath) {
      const handler = require(modulePath);
      return handler.handle(interaction);
    }

    // If no handler matches, ignore silently
  } catch (error) {
    LoggerService.error('Error in handleButtonInteraction:', {
      error: error?.message
    });

    // Handle specific Discord API errors
    const code = error?.code ?? error?.rawError?.code;
    if (code === 10062 || code === 40060) {
      // Interaction expired or already acknowledged, don't try to respond
      return;
    }

    const embed = createErrorEmbed(
      'Interaction Error',
      'An error occurred while processing this button.'
    );
    // Use safe reply to avoid double response errors
    await safeInteractionReply(interaction, {
      components: [embed],
      flags: MessageFlags.IsComponentsV2
    }, true);
  }
}

module.exports = { handleButtonInteraction };

