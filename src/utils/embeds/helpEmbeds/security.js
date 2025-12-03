const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder
} = require('@discordjs/builders');
const { SeparatorSpacingSize } = require('discord.js');
const { colors } = require('../../../config/botConfig');

function buildSecurityEmbed() {
  const container = new ContainerBuilder();

  const primaryColor = typeof colors.primary === 'string'
    ? parseInt(colors.primary.replace('#', ''), 16)
    : colors.primary;
  container.setAccentColor(primaryColor);

  const titleText = new TextDisplayBuilder()
    .setContent('# 🔐 Security and Limits');
  const descText = new TextDisplayBuilder()
    .setContent('Protection measures against abuse.');

  container.addTextDisplayComponents(titleText, descText);
  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
  );

  const rateLimitText = new TextDisplayBuilder()
    .setContent(
      '**Rate Limiting:**\n' +
      'Blocks excessive interactions per user in short periods.'
    );
  container.addTextDisplayComponents(rateLimitText);

  const transitionText = new TextDisplayBuilder()
    .setContent(
      '**Guild Transition Cooldown:**\n' +
      '3-day cooldown when leaving a guild. Re-entering the same guild ' +
      'is allowed. Leaders can manage with `/cooldown`.'
    );
  container.addTextDisplayComponents(transitionText);

  const cooldownCmdsText = new TextDisplayBuilder()
    .setContent(
      '**Cooldown Commands:**\n' +
      '`/cooldown set` — Set specific duration\n' +
      '`/cooldown increase` — Add time\n' +
      '`/cooldown decrease` — Reduce time\n' +
      '`/cooldown reset` — Clear cooldown\n' +
      '`/cooldown check` — View status'
    );
  container.addTextDisplayComponents(cooldownCmdsText);

  return container;
}

module.exports = { buildSecurityEmbed };

