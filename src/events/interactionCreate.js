const { Events } = require('discord.js');
// Handlers are routed via utils/core/interactionRouter

const {
  checkInteractionRateLimit,
  handleInteractionError
} = require('../utils/core/interactionUtils');
const { routeInteraction } = require('../utils/core/interactionRouter');
const { handleKnownDiscordError } = require('../utils/core/discordErrorUtils');

module.exports = {
  name: Events.InteractionCreate,

  /**
   * Handle all interactions
   * @param {Interaction} interaction - Discord interaction
   */
  async execute(interaction) {
    try {
      // Rate limit check
      const rateLimitResult = await checkInteractionRateLimit(interaction);
      if (!rateLimitResult.allowed) return;

      // Route using centralized router
      await routeInteraction(interaction);
    } catch (error) {
      // Handle known Discord API interaction errors first
      if (handleKnownDiscordError(error, interaction)) return;
      // Fallback to standard interaction error handler
      await handleInteractionError(error, interaction);
    }
  }
};
