const { handleSlashCommand } = require('../../handlers/interactionHandler');
const { handleButtonInteraction } = require('../../handlers/buttonHandler');
const { handleAutocomplete } = require('../../handlers/autocompleteHandler');
const { handleSelectInteraction } = require('../../handlers/selectHandler');
const { handleModalInteraction } = require('../../handlers/modalHandler');
const { validateButtonInteraction } = require('./interactionUtils');

/**
 * Route an interaction to the appropriate handler.
 * Keeps event handler lean and testable.
 * @param {import('discord.js').Interaction} interaction
 */
async function routeInteraction(interaction) {
  if (interaction.isAutocomplete()) {
    await handleAutocomplete(interaction);
    return;
  }

  if (interaction.isChatInputCommand()) {
    await handleSlashCommand(interaction);
    return;
  }

  if (interaction.isButton()) {
    const validationResult = await validateButtonInteraction(interaction);
    if (!validationResult.valid) return;
    await handleButtonInteraction(interaction);
    return;
  }

  // Select Menus: String, User, Role and Channel
  if (
    interaction.isStringSelectMenu() ||
    interaction.isUserSelectMenu() ||
    interaction.isRoleSelectMenu?.() ||
    interaction.isChannelSelectMenu?.()
  ) {
    await handleSelectInteraction(interaction);
    return;
  }

  if (interaction.isModalSubmit()) {
    await handleModalInteraction(interaction);
    return;
  }
}

module.exports = { routeInteraction };

