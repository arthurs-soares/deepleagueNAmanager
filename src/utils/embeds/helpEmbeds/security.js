const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder } = require('@discordjs/builders');
const { colors } = require('../../../config/botConfig');

function buildSecurityEmbed() {
  const container = new ContainerBuilder();

  // Set accent color
  const primaryColor = typeof colors.primary === 'string'
    ? parseInt(colors.primary.replace('#', ''), 16)
    : colors.primary;
  container.setAccentColor(primaryColor);

  // Header
  const titleText = new TextDisplayBuilder()
    .setContent('# 🔐 Security and Limits');
  const descText = new TextDisplayBuilder()
    .setContent('The bot applies measures to protect against abuse and ensure clear rules between Discord and the game:');

  container.addTextDisplayComponents(titleText, descText);
  container.addSeparatorComponents(new SeparatorBuilder());

  // Rate Limiting
  const rateLimitText = new TextDisplayBuilder()
    .setContent('**Rate Limiting**\nBlocks excessive interactions per user in short periods.');
  container.addTextDisplayComponents(rateLimitText);

  // Command Cooldowns
  const cooldownText = new TextDisplayBuilder()
    .setContent('**Command Cooldowns**\nEach command can define an individual cooldown.');
  container.addTextDisplayComponents(cooldownText);

  // Guild Transition Cooldown
  const transitionText = new TextDisplayBuilder()
    .setContent(
      '**Guild Transition Cooldown (in-game)**\n' +
      'When leaving a guild, there is a 3-day cooldown to join ANOTHER guild. Re-entering the SAME guild is allowed. Joining/leaving the Discord server does NOT apply cooldown. Leaders and Co-leaders can manage manual overrides with `/managecooldown` (set/increase/decrease/reset/check).'
    );
  container.addTextDisplayComponents(transitionText);

  // Validation
  const validationText = new TextDisplayBuilder()
    .setContent('**Validation**\nSanitized inputs and safe regex usage in queries.');
  container.addTextDisplayComponents(validationText);

  return container;
}

module.exports = { buildSecurityEmbed };

