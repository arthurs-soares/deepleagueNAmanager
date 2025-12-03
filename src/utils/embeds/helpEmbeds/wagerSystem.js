const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder
} = require('@discordjs/builders');
const { SeparatorSpacingSize } = require('discord.js');
const { colors } = require('../../../config/botConfig');

function buildWagerSystemEmbed() {
  const container = new ContainerBuilder();

  const primaryColor = typeof colors.primary === 'string'
    ? parseInt(colors.primary.replace('#', ''), 16)
    : colors.primary;
  container.setAccentColor(primaryColor);

  const titleText = new TextDisplayBuilder()
    .setContent('# 🎲 Wager System');
  const descText = new TextDisplayBuilder()
    .setContent('Player-to-player competitive matches.');

  container.addTextDisplayComponents(titleText, descText);
  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
  );

  const commandsText = new TextDisplayBuilder()
    .setContent(
      '**Commands:**\n' +
      '`/wager stats` — View your wager statistics\n' +
      '`/wager leaderboard` — Server wager rankings\n' +
      '`/admin wager record` — Record a wager result'
    );
  container.addTextDisplayComponents(commandsText);

  const ticketsText = new TextDisplayBuilder()
    .setContent(
      '**Wager Tickets**\n' +
      'Set the Wager Channel in `/config` → Channels. Anyone can open ' +
      'player-to-player wager tickets. Mods/Hosters close tickets.'
    );
  container.addTextDisplayComponents(ticketsText);

  const statsText = new TextDisplayBuilder()
    .setContent(
      '**Statistics Tracked:**\n' +
      '• Games played, wins, losses\n' +
      '• Win rate percentage\n' +
      '• Current and best win streak\n' +
      '• Wager ELO rating'
    );
  container.addTextDisplayComponents(statsText);

  const permText = new TextDisplayBuilder()
    .setContent(
      '**Permissions:**\n' +
      '• Anyone can start a wager ticket\n' +
      '• Only staff can decide winner/close'
    );
  container.addTextDisplayComponents(permText);

  return container;
}

module.exports = { buildWagerSystemEmbed };

