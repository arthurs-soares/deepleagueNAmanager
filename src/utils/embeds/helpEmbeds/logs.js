const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder
} = require('@discordjs/builders');
const { SeparatorSpacingSize } = require('discord.js');
const { colors } = require('../../../config/botConfig');

function buildLogsEmbed() {
  const container = new ContainerBuilder();

  const primaryColor = typeof colors.primary === 'string'
    ? parseInt(colors.primary.replace('#', ''), 16)
    : colors.primary;
  container.setAccentColor(primaryColor);

  const titleText = new TextDisplayBuilder()
    .setContent('# 🧾 Logs and Audit');
  const descText = new TextDisplayBuilder()
    .setContent(
      'Configure the logs channel in `/config` → Channels → Logs.'
    );

  container.addTextDisplayComponents(titleText, descText);
  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
  );

  const coverageText = new TextDisplayBuilder()
    .setContent(
      '**What is logged:**\n' +
      '• Command executions with parameters\n' +
      '• War creation, acceptance, results\n' +
      '• Ticket transcripts on close\n' +
      '• Administrative actions\n' +
      '• Data changes (before/after)'
    );
  container.addTextDisplayComponents(coverageText);

  const dmWarningsText = new TextDisplayBuilder()
    .setContent(
      '**DM Fallback:**\n' +
      'Set DM Warning Channel in `/config`. If a user has DMs closed, ' +
      'the bot creates a private thread with the message.'
    );
  container.addTextDisplayComponents(dmWarningsText);

  return container;
}

module.exports = { buildLogsEmbed };

