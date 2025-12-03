const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder } = require('@discordjs/builders');
const { colors } = require('../../config/botConfig');

/**
 * Build a War Dodge notification container
 * @returns {ContainerBuilder}
 */
function buildWarDodgeEmbed(guildAName, guildBName, dodgerName, penaltyText, when = new Date()) {
  const container = new ContainerBuilder();

  // Convert color to integer if it's a hex string
  const warningColor = typeof colors.warning === 'string'
    ? parseInt(colors.warning.replace('#', ''), 16)
    : colors.warning;
  container.setAccentColor(warningColor);

  const titleText = new TextDisplayBuilder()
    .setContent(`# 🚫 War Dodge\n${guildAName} vs ${guildBName}`);

  const detailsText = new TextDisplayBuilder()
    .setContent(
      `**Dodged by:** ${dodgerName}\n` +
      `**Penalty:** ${penaltyText}\n` +
      `**When:** <t:${Math.floor(when.getTime()/1000)}:f>`
    );

  const timestampText = new TextDisplayBuilder()
    .setContent(`*<t:${Math.floor(when.getTime()/1000)}:R>*`);

  container.addTextDisplayComponents(titleText);
  container.addSeparatorComponents(new SeparatorBuilder());
  container.addTextDisplayComponents(detailsText);
  container.addTextDisplayComponents(timestampText);

  return container;
}

/**
 * Build a Wager Dodge notification container
 * @returns {ContainerBuilder}
 */
function buildWagerDodgeEmbed(dodgerUserTag, opponentUserTag, when = new Date()) {
  const container = new ContainerBuilder();

  // Convert color to integer if it's a hex string
  const warningColor = typeof colors.warning === 'string'
    ? parseInt(colors.warning.replace('#', ''), 16)
    : colors.warning;
  container.setAccentColor(warningColor);

  const titleText = new TextDisplayBuilder()
    .setContent(`# 🚫 Wager Dodge\n${dodgerUserTag} dodged a wager vs ${opponentUserTag}`);

  const whenText = new TextDisplayBuilder()
    .setContent(`**When:** <t:${Math.floor(when.getTime()/1000)}:f>`);

  const timestampText = new TextDisplayBuilder()
    .setContent(`*<t:${Math.floor(when.getTime()/1000)}:R>*`);

  container.addTextDisplayComponents(titleText);
  container.addSeparatorComponents(new SeparatorBuilder());
  container.addTextDisplayComponents(whenText);
  container.addTextDisplayComponents(timestampText);

  return container;
}

module.exports = { buildWarDodgeEmbed, buildWagerDodgeEmbed };

