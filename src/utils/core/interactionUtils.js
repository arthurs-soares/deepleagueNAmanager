const { checkRateLimit } = require('../rate-limiting/rateLimitUtils');
const { isSafeCustomId } = require('./validation');
const LoggerService = require('../../services/LoggerService');

/**
 * Determine if an interaction is likely expired (token invalid)
 * Default threshold: 14 minutes to provide buffer before Discord's 15 min expiry.
 * @param {import('discord.js').Interaction} interaction
 * @param {number} maxAgeMs
 */
function isInteractionExpired(interaction, maxAgeMs = 14 * 60 * 1000) {
  try {
    const created = Number(interaction?.createdTimestamp) || Date.now();
    return Date.now() - created > maxAgeMs;
  } catch (_) {
    return false;
  }
}


/**
 * Check rate limit for interaction
 * @param {Interaction} interaction - Discord interaction
 * @returns {Promise<{allowed: boolean, responded: boolean}>} Rate limit result and response status
 */
async function checkInteractionRateLimit(interaction) {
  const type = interaction.type ?? 'unknown';
  const rlKey = `interaction:${interaction.user?.id || 'anon'}:${type}`;
  const allowed = checkRateLimit(rlKey, 8, 10_000);

  if (!allowed) {
    const { MessageFlags } = require('discord.js');
    const msg = {
      content: '⏳ Too many actions in a row. Please try again in a moment.',
      flags: MessageFlags.Ephemeral
    };

    try {
      if (isInteractionExpired(interaction)) {
        return { allowed: false, responded: false };
      }

      // Check if interaction has already been responded to
      if (interaction.deferred || interaction.replied) {
        await interaction.followUp(msg);
      } else if (typeof interaction.reply === 'function') {
        await interaction.reply(msg);
      }
      return { allowed: false, responded: true };
    } catch (replyError) {
      const code = replyError?.code ?? replyError?.rawError?.code;
      if (code === 10062 || code === 40060 || code === 50027) {
        // Interaction already handled elsewhere or token invalid
        return { allowed: false, responded: false };
      }
      LoggerService.error('Error responding to rate limit:', {
        error: replyError?.message
      });
      return { allowed: false, responded: false };
    }
  }

  return { allowed: true, responded: false };
}

/**
 * Validate button interaction
 * @param {ButtonInteraction} interaction - Button interaction
 * @returns {Promise<{valid: boolean, responded: boolean}>} Validation result and response status
 */
async function validateButtonInteraction(interaction) {
  if (!isSafeCustomId(interaction.customId)) {
    try {
      if (typeof interaction.reply === 'function' && !isInteractionExpired(interaction)) {
        // Check if interaction has already been responded to
        if (!interaction.deferred && !interaction.replied) {
          const { MessageFlags } = require('discord.js');
          await interaction.reply({
            content: '❌ Invalid component ID.',
            flags: MessageFlags.Ephemeral
          });
          return { valid: false, responded: true };
        }
      }
    } catch (replyError) {
      const code = replyError?.code ?? replyError?.rawError?.code;
      if (code === 10062 || code === 40060) {
        // Interaction already handled elsewhere
        return { valid: false, responded: false };
      }
      LoggerService.error('Error responding to invalid button:', {
        error: replyError?.message
      });
    }
    return { valid: false, responded: false };
  }
  return { valid: true, responded: false };
}

/**
 * Handle interaction error response
 * @param {Error} error - The error that occurred
 * @param {Interaction} interaction - Discord interaction
 */
async function handleInteractionError(error, interaction) {
  LoggerService.error('Error handling interaction:', { error: error?.message });

  const { MessageFlags } = require('discord.js');
  const errorMessage = {
    content: '❌ An error occurred while processing your request.',
    flags: MessageFlags.Ephemeral
  };

  try {
    if (isInteractionExpired(interaction)) return;

    if (interaction.replied || interaction.deferred) {
      if (typeof interaction.followUp === 'function') {
        await interaction.followUp(errorMessage);
      }
    } else {
      if (typeof interaction.reply === 'function') {
        await interaction.reply(errorMessage);
      }
    }
  } catch (replyError) {
    const code = replyError?.code ?? replyError?.rawError?.code;
    if (code === 10062 || code === 40060 || code === 10008 || code === 50027) {
      // Ignore Unknown interaction / Already acknowledged / Unknown message
      return;
    }
    LoggerService.error('Error responding to interaction error:', {
      error: replyError?.message,
      interactionType: interaction.type
    });
  }
}

/**
 * Safely respond to an interaction, checking if it's already been responded to
 * @param {Interaction} interaction - Discord interaction
 * @param {Object} options - Response options
 * @param {boolean} ephemeral - Whether response should be ephemeral
 * @returns {Promise<boolean>} Whether the response was sent successfully
 */
async function safeInteractionReply(interaction, options, ephemeral = true) {
  try {
    if (isInteractionExpired(interaction)) {
      return false;
    }

    const { MessageFlags } = require('discord.js');
    const existingFlags = options.flags || 0;
    const finalFlags = ephemeral ? (existingFlags | MessageFlags.Ephemeral) : existingFlags;
    const payload = { ...options, flags: finalFlags };

    if (interaction.deferred && !interaction.replied) {
      await interaction.editReply(payload);
      return true;
    } else if (interaction.replied) {
      await interaction.followUp(payload);
      return true;
    } else if (typeof interaction.reply === 'function') {
      await interaction.reply(payload);
      return true;
    }

    return false;
  } catch (error) {
    const code = error?.code ?? error?.rawError?.code;
    if (code === 10062 || code === 40060 || code === 50027) {
      // Interaction expired, already acknowledged, or invalid token
      return false;
    }
    if (code === 10008) {
      // Unknown Message: try an alternate path if possible
      try {
        if (!interaction.replied && typeof interaction.reply === 'function') {
          await interaction.reply(options);
          return true;
        }
      } catch (_) { /* fall through */ }
      return false;
    }
    throw error;
  }
}

module.exports = {
  checkInteractionRateLimit,
  validateButtonInteraction,
  handleInteractionError,
  isInteractionExpired,
  safeInteractionReply
};
