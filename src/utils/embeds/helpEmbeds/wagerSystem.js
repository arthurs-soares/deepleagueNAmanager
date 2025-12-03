const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder
} = require('@discordjs/builders');
const { colors } = require('../../../config/botConfig');

function buildWagerSystemEmbed() {
  const container = new ContainerBuilder();

  // Set accent color
  const primaryColor = typeof colors.primary === 'string'
    ? parseInt(colors.primary.replace('#', ''), 16)
    : colors.primary;
  container.setAccentColor(primaryColor);

  // Header
  const titleText = new TextDisplayBuilder()
    .setContent('# 🎲 Wager System');
  const descText = new TextDisplayBuilder()
    .setContent('Wager tickets for player-to-player matches.');

  container.addTextDisplayComponents(titleText, descText);
  container.addSeparatorComponents(new SeparatorBuilder());

  // Wager Tickets
  const ticketsText = new TextDisplayBuilder()
    .setContent(
      '**Wager Tickets**\n' +
      'Use `/config` → Channels to set the Wager Tickets Channel and ' +
      'the Wager Category. The panel lets any member open player-to-player ' +
      'wager tickets. Mods/Hosters/Admins can close tickets. The initial ' +
      'ticket panel is automatically pinned. After accepting a wager, the ' +
      'bot pins a control message in the ticket channel (decide winner, mark ' +
      'dodge, close).'
    );
  container.addTextDisplayComponents(ticketsText);

  // Permissions
  const permText = new TextDisplayBuilder()
    .setContent(
      '**Permissions**\n' +
      '• Anyone can start a player-to-player wager\n' +
      '• War wagers are disabled'
    );
  container.addTextDisplayComponents(permText);

  // Inactivity Reminders
  const inactivityText = new TextDisplayBuilder()
    .setContent(
      '**Inactivity Reminders**\n' +
      'The bot sends automatic reminders when a wager ticket becomes ' +
      'inactive (e.g.: 36h without messages). Both players are mentioned. ' +
      'There is a cooldown between reminders to avoid spam.'
    );
  container.addTextDisplayComponents(inactivityText);

  // Recording Results
  const recordingText = new TextDisplayBuilder()
    .setContent(
      '**Recording Results**\n' +
      'Use the in-ticket flow: press "Accept Wager" to open the decision ' +
      'panel. Only hosters/moderators/admins can select the winner.'
    );
  container.addTextDisplayComponents(recordingText);

  // Display
  const displayText = new TextDisplayBuilder()
    .setContent(
      '**Display**\n' +
      'Players can see: `/profile` and `/wagerstats` (detailed stats).'
    );
  container.addTextDisplayComponents(displayText);

  return container;
}

module.exports = { buildWagerSystemEmbed };

