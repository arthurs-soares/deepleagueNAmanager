const { ContainerBuilder, TextDisplayBuilder } = require('@discordjs/builders');
const { colors } = require('../../../config/botConfig');

function buildProfileEmbed() {
  const container = new ContainerBuilder();

  const primaryColor = typeof colors.primary === 'string'
    ? parseInt(colors.primary.replace('#', ''), 16)
    : colors.primary;
  container.setAccentColor(primaryColor);

  const titleText = new TextDisplayBuilder()
    .setContent('# 👤 User Profile');

  const descText = new TextDisplayBuilder()
    .setContent(
      'View detailed user information with `/user profile`.\n\n' +
      '**Features:**\n' +
      '• Guild membership and role\n' +
      '• Wager statistics and ELO\n' +
      '• Server ranking position\n' +
      '• Account creation date\n\n' +
      '**Usage:**\n' +
      '`/user profile` — View your own profile\n' +
      '`/user profile @user` — View another user\'s profile'
    );

  container.addTextDisplayComponents(titleText, descText);
  return container;
}

module.exports = { buildProfileEmbed };

