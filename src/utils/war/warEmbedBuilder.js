// War embed building utilities
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder } = require('@discordjs/builders');
const { colors, emojis } = require('../../config/botConfig');

/**
 * Create war confirmation container (Components v2)
 * @param {Object} guildA - Guild A document
 * @param {Object} guildB - Guild B document
 * @param {Date} dateTime - Scheduled date/time
 * @param {Object} _guild - Discord guild
 * @returns {Object} Container
 */
async function createWarConfirmationEmbed(guildA, guildB, dateTime, _guild) {
  const container = new ContainerBuilder();

  // Set accent color
  const primaryColor = typeof colors.primary === 'string'
    ? parseInt(colors.primary.replace('#', ''), 16)
    : colors.primary;
  container.setAccentColor(primaryColor);

  // Header
  const titleText = new TextDisplayBuilder()
    .setContent(`# ${emojis.war} War Confirmation`);

  const warInfoText = new TextDisplayBuilder()
    .setContent(
      `**War between:** ${guildA.name} vs ${guildB.name}\n` +
      `**Date/Time:** <t:${Math.floor(dateTime.getTime()/1000)}:F>`
    );

  container.addTextDisplayComponents(titleText, warInfoText);
  container.addSeparatorComponents(new SeparatorBuilder());

  // Instructions
  const instructionsText = new TextDisplayBuilder()
    .setContent(
      `${emojis.info} **Waiting for confirmation from the opponent team (Leader/Co-leader).**\n\n` +
      'Use the buttons below:\n' +
      '• **Accept War** — confirm the war\n' +
      '• **Dodge** — cancel the war'
    );

  container.addTextDisplayComponents(instructionsText);

  return { embed: container };
}

/**
 * Create war confirmation action row
 * @param {string} warId - War document ID
 * @returns {Object} Action row with buttons
 */
function createWarConfirmationButtons(warId) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`war:confirm:accept:${warId}`)
      .setStyle(ButtonStyle.Success)
      .setLabel('Accept War'),
    new ButtonBuilder()
      .setCustomId(`war:confirm:dodge:${warId}`)
      .setStyle(ButtonStyle.Danger)
      .setLabel('Dodge')
  );
}

/**
 * Create disabled war confirmation action row
 * @param {string} warId - War document ID
 * @param {string} state - State to indicate what action was taken ('accepted' or 'dodging')
 * @returns {Object} Action row with disabled buttons
 */
function createDisabledWarConfirmationButtons(warId, state = 'processed') {
  const acceptLabel = state === 'accepted' ? 'War Accepted' : 'Accept War';
  const dodgeLabel = state === 'dodging' ? 'Dodge Selected' : 'Dodge';

  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`war:confirm:accept:${warId}`)
      .setStyle(ButtonStyle.Success)
      .setLabel(acceptLabel)
      .setDisabled(true),
    new ButtonBuilder()
      .setCustomId(`war:confirm:dodge:${warId}`)
      .setStyle(ButtonStyle.Danger)
      .setLabel(dodgeLabel)
      .setDisabled(true)
  );
}

module.exports = {
  createWarConfirmationEmbed,
  createWarConfirmationButtons,
  createDisabledWarConfirmationButtons
};
