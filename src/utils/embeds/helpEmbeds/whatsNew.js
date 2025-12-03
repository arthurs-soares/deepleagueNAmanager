const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder
} = require('@discordjs/builders');
const { SeparatorSpacingSize } = require('discord.js');
const { colors, emojis } = require('../../../config/botConfig');

/**
 * Build the "What's New" help embed
 * @returns {ContainerBuilder}
 */
function buildWhatsNewEmbed() {
  const container = new ContainerBuilder();

  const primaryColor = typeof colors.primary === 'string'
    ? parseInt(colors.primary.replace('#', ''), 16)
    : colors.primary;
  container.setAccentColor(primaryColor);

  const titleText = new TextDisplayBuilder()
    .setContent('# 🆕 What\'s New');
  const descText = new TextDisplayBuilder()
    .setContent(`${emojis.info} Latest updates and improvements!`);

  container.addTextDisplayComponents(titleText, descText);
  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
  );

  const restructureText = new TextDisplayBuilder()
    .setContent(
      '### 📁 Command Restructure\n' +
      'Commands are now organized by domain:\n' +
      '• `/guild` — Guild management\n' +
      '• `/war` — War operations\n' +
      '• `/wager` — Wager system\n' +
      '• `/user` — User management\n' +
      '• `/ticket` — Ticket operations\n' +
      '• `/cooldown` — Cooldown management\n' +
      '• `/leaderboard` — Rankings\n' +
      '• `/admin` — Administration'
    );
  container.addTextDisplayComponents(restructureText);

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
  );

  const updatesText = new TextDisplayBuilder()
    .setContent(
      '### ⚡ Recent Updates\n' +
      '• **Components v2** — Modern Discord interfaces\n' +
      '• **System Commands** — `/admin system` for sync and DB\n' +
      '• **Improved Help** — Better navigation\n' +
      '• **Cleaner Structure** — Easier to remember commands'
    );
  container.addTextDisplayComponents(updatesText);

  return container;
}

module.exports = { buildWhatsNewEmbed };

