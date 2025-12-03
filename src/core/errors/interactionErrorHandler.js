// Discord interaction error handling utilities
const { MessageFlags } = require('discord.js');
const { createErrorEmbed } = require('../../utils/embeds/embedBuilder');
const LoggerService = require('../../services/LoggerService');
const {
  ValidationError,
  PermissionError,
  DatabaseError,
  RateLimitError
} = require('./customErrors');

/**
 * Handle interaction errors with user-friendly responses
 * @param {Error} error - The error that occurred
 * @param {Object} interaction - Discord interaction
 * @param {string} context - Context description
 */
async function handleInteractionError(error, interaction, context = 'operation') {
  LoggerService.error(`Interaction error in ${context}:`, {
    error: error.message,
    userId: interaction.user?.id,
    guildId: interaction.guild?.id,
    commandName: interaction.commandName || 'unknown'
  });

  // Handle specific error types
  let errorContainer;

  if (error instanceof ValidationError) {
    errorContainer = createErrorEmbed(
      'Invalid Input',
      `Please check your ${error.field}: ${error.message}`
    );
  } else if (error instanceof PermissionError) {
    errorContainer = createErrorEmbed(
      'Permission Denied',
      `You don't have permission to perform this action. Required: ${error.required}`
    );
  } else if (error instanceof DatabaseError) {
    errorContainer = createErrorEmbed(
      'Database Error',
      'A database error occurred. Please try again later.'
    );
  } else if (error instanceof RateLimitError) {
    errorContainer = createErrorEmbed(
      'Rate Limited',
      `Please wait ${error.retryAfter} seconds before trying again.`
    );
  } else if (
    error?.code === 50035 &&
    error?.message?.includes('COMPONENT_LAYOUT_WIDTH_EXCEEDED')
  ) {
    errorContainer = createErrorEmbed(
      'Interface Error',
      'The interface components are too wide for Discord.'
    );
    LoggerService.error('Component width exceeded error:', {
      errorCode: error.code,
      errorMessage: error.message,
      userId: interaction.user?.id,
      guildId: interaction.guild?.id,
      customId: interaction.customId || 'N/A'
    });
  } else {
    errorContainer = createErrorEmbed(
      'Something went wrong',
      `An error occurred while processing your ${context}.`
    );
  }

  try {
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        components: [errorContainer],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
      });
    } else {
      await interaction.reply({
        components: [errorContainer],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
      });
    }
  } catch (replyError) {
    LoggerService.error('Failed to send error response:', {
      error: replyError.message
    });
  }
}

module.exports = {
  handleInteractionError
};
