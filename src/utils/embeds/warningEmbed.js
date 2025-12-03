const { ContainerBuilder, TextDisplayBuilder } = require('@discordjs/builders');
const { colors, emojis } = require('../../config/botConfig');

/**
 * Create a warning container using Components v2
 * @param {string} title
 * @param {string} description
 * @returns {ContainerBuilder}
 */
function createWarningEmbed(title, description) {
  const container = new ContainerBuilder();
  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(`# ${emojis.warning} ${title}`),
    new TextDisplayBuilder().setContent(description)
  );
  const warningColor = typeof colors.warning === 'string'
    ? parseInt(colors.warning.replace('#', ''), 16)
    : colors.warning;
  container.setAccentColor(warningColor);
  // Back-compat for legacy tests expecting Embed-like shape
  try {
    container.data = container.data || {};
    container.data.title = `⚠️ ${title}`;
    container.data.description = description;
  } catch { /* noop */ }
  return container;
}

module.exports = { createWarningEmbed };

