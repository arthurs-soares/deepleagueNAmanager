const { ContainerBuilder, TextDisplayBuilder } = require('@discordjs/builders');
const { colors } = require('../../../config/botConfig');

function buildProfileEmbed() {
  const container = new ContainerBuilder();

  // Set accent color
  const primaryColor = typeof colors.primary === 'string'
    ? parseInt(colors.primary.replace('#', ''), 16)
    : colors.primary;
  container.setAccentColor(primaryColor);

  // Header
  const titleText = new TextDisplayBuilder()
    .setContent('# 👤 User Profile');
  const descText = new TextDisplayBuilder()
    .setContent('Display a clean and organized user profile with guild info, wager statistics, server ranking, and account details. Profiles are shown publicly in the channel.');

  container.addTextDisplayComponents(titleText, descText);

  return container;
}

module.exports = { buildProfileEmbed };

