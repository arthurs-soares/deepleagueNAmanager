const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder } = require('@discordjs/builders');
const { SeparatorSpacingSize } = require('discord.js');
const { colors, emojis } = require('../../../config/botConfig');

/**
 * Build the "What's New" help embed
 * @returns {ContainerBuilder}
 */
function buildWhatsNewEmbed() {
  const container = new ContainerBuilder();

  // Set accent color
  const primaryColor = typeof colors.primary === 'string'
    ? parseInt(colors.primary.replace('#', ''), 16)
    : colors.primary;
  container.setAccentColor(primaryColor);

  // Header
  const titleText = new TextDisplayBuilder()
    .setContent('# 🆕 What\'s New');
  const descText = new TextDisplayBuilder()
    .setContent(
      `${emojis.info} Check out the latest updates and improvements!`
    );

  container.addTextDisplayComponents(titleText, descText);
  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
  );

  // Latest Updates
  const updatesText = new TextDisplayBuilder()
    .setContent(
      '### ⚡ Latest Updates\n' +
      '- **Components v2** — All interfaces now use the new Discord Components v2\n' +
      '- **Improved Help System** — Better navigation and more information\n' +
      '- **Shop Cooldowns** — Item purchase cooldowns are now available\n' +
      '- **Daily Rewards** — Automatic daily reward system'
    );
  container.addTextDisplayComponents(updatesText);

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
  );

  // Admin Commands
  const commandsText = new TextDisplayBuilder()
    .setContent(
      '### 🛡️ Unified Admin Commands\n' +
      'Administrative commands are consolidated under `/admin`:\n' +
      '`/admin war adjust-elo` — Adjust ELO after a war\n' +
      '`/admin war mark-dodge` — Mark a dodge\n' +
      '`/admin war undo-dodge` — Undo a dodge\n' +
      '`/admin war revert-result` — Revert a war result\n' +
      '`/admin wager record` — Record a wager result'
    );
  container.addTextDisplayComponents(commandsText);

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
  );

  // UX Improvements
  const uxText = new TextDisplayBuilder()
    .setContent(
      '### ✨ UX Improvements\n' +
      '- **War ID Autocomplete** — Easier war selection in admin commands\n' +
      '- **Better Error Handling** — Clearer error messages\n' +
      '- **Audit Logs** — More detailed action logging\n' +
      '- **Rate Limiting** — Protection against spam'
    );
  container.addTextDisplayComponents(uxText);

  return container;
}

module.exports = { buildWhatsNewEmbed };

