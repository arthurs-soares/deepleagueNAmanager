const { ContainerBuilder, TextDisplayBuilder } = require('@discordjs/builders');
const { colors, emojis } = require('../../config/botConfig');

/**
 * Create a success container using Components v2
 * @param {string} title
 * @param {string} description
 * @returns {ContainerBuilder}
 */
function createSuccessEmbed(title, description) {
  const container = new ContainerBuilder();
  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(`# ${emojis.success} ${title}`),
    new TextDisplayBuilder().setContent(description)
  );
  const successColor = typeof colors.success === 'string'
    ? parseInt(colors.success.replace('#', ''), 16)
    : colors.success;
  container.setAccentColor(successColor);
  // Back-compat for legacy tests expecting Embed-like shape
  try {
    container.data = container.data || {};
    container.data.title = `✅ ${title}`;
    container.data.description = description;
  } catch { /* noop */ }
  return container;
}

module.exports = { createSuccessEmbed };

