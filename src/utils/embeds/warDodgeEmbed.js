const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder } = require('@discordjs/builders');
const { colors } = require('../../config/botConfig');

/**
 * Build a clear War Dodge container using Components v2.
 * Shows who dodged and who the dodge was against.
 * Optionally includes who marked it and the penalty.
 *
 * @param {string} dodgerName
 * @param {string} targetName
 * @param {string} [markedByUserId]
 * @param {string} [penaltyText] e.g., "-16 ELO (dodger), +8 ELO (opponent)"
 * @param {Date} [when]
 * @returns {ContainerBuilder}
 */
function buildWarDodgeEmbed(dodgerName, targetName, markedByUserId, penaltyText, when = new Date()) {
  const container = new ContainerBuilder();

  // Set accent color for warning
  const warningColor = typeof colors.warning === 'string'
    ? parseInt(colors.warning.replace('#', ''), 16)
    : colors.warning;
  container.setAccentColor(warningColor);

  // Header
  const titleText = new TextDisplayBuilder()
    .setContent('# 🚫 War Dodge');
  container.addTextDisplayComponents(titleText);
  container.addSeparatorComponents(new SeparatorBuilder());

  // Dodger and Target info
  const dodgerText = new TextDisplayBuilder()
    .setContent(`**Dodger**\n${dodgerName || 'Unknown'}`);
  const targetText = new TextDisplayBuilder()
    .setContent(`**Target**\n${targetName || 'Unknown'}`);

  container.addTextDisplayComponents(dodgerText, targetText);

  // Penalty if provided
  if (penaltyText) {
    const penaltyTextDisplay = new TextDisplayBuilder()
      .setContent(`**Penalty**\n${penaltyText}`);
    container.addTextDisplayComponents(penaltyTextDisplay);
  }

  // Marked by if provided
  if (markedByUserId) {
    const markedByText = new TextDisplayBuilder()
      .setContent(`**Marked by**\n<@${markedByUserId}>`);
    container.addTextDisplayComponents(markedByText);
  }

  // Timestamp footer
  const timestamp = Math.floor(when.getTime() / 1000);
  const timestampText = new TextDisplayBuilder()
    .setContent(`*<t:${timestamp}:F>*`);
  container.addTextDisplayComponents(timestampText);

  return container;
}

module.exports = { buildWarDodgeEmbed };

