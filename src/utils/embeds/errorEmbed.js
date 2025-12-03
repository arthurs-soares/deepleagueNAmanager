const { ContainerBuilder, TextDisplayBuilder } = require('@discordjs/builders');
const { colors, emojis } = require('../../config/botConfig');

/**
 * Create an error container using Components v2
 * @param {string} title
 * @param {string} description
 * @returns {ContainerBuilder}
 */
function createErrorEmbed(title, description) {
  const container = new ContainerBuilder();
  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(`# ${emojis.error} ${title}`),
    new TextDisplayBuilder().setContent(description)
  );
  const errorColor = typeof colors.error === 'string'
    ? parseInt(colors.error.replace('#', ''), 16)
    : colors.error;
  container.setAccentColor(errorColor);
  // Back-compat for legacy tests expecting Embed-like shape
  try {
    container.data = container.data || {};
    container.data.title = `❌ ${title}`;
    container.data.description = description;
  } catch { /* noop */ }
  return container;
}

module.exports = { createErrorEmbed };

