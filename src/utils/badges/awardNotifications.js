const { MessageFlags } = require('discord.js');
const { ContainerBuilder, TextDisplayBuilder } = require('@discordjs/builders');
const { colors, emojis } = require('../../config/botConfig');
const { sendDmOrFallback } = require('../dm/dmFallback');
const { sendLog } = require('../core/logger');

function buildAwardEmbed({ title, description }) {
  const container = new ContainerBuilder();

  // Set accent color
  const primaryColor = typeof colors.primary === 'string'
    ? parseInt(colors.primary.replace('#', ''), 16)
    : colors.primary;
  container.setAccentColor(primaryColor);

  const titleText = new TextDisplayBuilder()
    .setContent(`# ${title}`);
  const descText = new TextDisplayBuilder()
    .setContent(description);

  container.addTextDisplayComponents(titleText, descText);

  return container;
}

async function notifyUserAward(client, discordGuildId, targetUserId, badge, reason, awardedByUserId) {
  const emoji = badge.animated ? `<a:${badge.emojiName}:${badge.emojiId}>` : `<:${badge.emojiName}:${badge.emojiId}>`;
  const desc = [
    `${emoji} You have been awarded the badge **${badge.name}**!`,
    reason ? `Reason: ${reason}` : null,
    `Awarded by: <@${awardedByUserId}>`
  ].filter(Boolean).join('\n');
  const container = buildAwardEmbed({ title: `${emojis.trophy || '🏆'} Badge Awarded`, description: desc });
  await sendDmOrFallback(
    client,
    discordGuildId,
    targetUserId,
    { components: [container], flags: MessageFlags.IsComponentsV2 },
    { threadTitle: `Badge award for ${targetUserId}` }
  );
}

async function notifyUserRevoke(client, discordGuildId, targetUserId, badge, awardedByUserId) {
  const emoji = badge.animated ? `<a:${badge.emojiName}:${badge.emojiId}>` : `<:${badge.emojiName}:${badge.emojiId}>`;
  const desc = [
    `${emoji} Your badge **${badge.name}** has been removed.`,
    `By: <@${awardedByUserId}>`
  ].join('\n');
  const container = buildAwardEmbed({ title: `${emojis.warning || '⚠️'} Badge Removed`, description: desc });
  await sendDmOrFallback(
    client,
    discordGuildId,
    targetUserId,
    { components: [container], flags: MessageFlags.IsComponentsV2 },
    { threadTitle: `Badge removed for ${targetUserId}` }
  );
}

async function notifyGuildAward(guild, badge, targetGuildName, reason, awardedByUserId) {
  const emoji = badge.animated ? `<a:${badge.emojiName}:${badge.emojiId}>` : `<:${badge.emojiName}:${badge.emojiId}>`;
  const lines = [
    `${emoji} Guild **${targetGuildName}** received badge **${badge.name}**!`,
    reason ? `Reason: ${reason}` : null,
    `Awarded by: <@${awardedByUserId}>`
  ].filter(Boolean).join('\n');
  await sendLog(guild, 'Guild Badge Awarded', lines);
}

async function notifyGuildRevoke(guild, badge, targetGuildName, awardedByUserId) {
  const emoji = badge.animated ? `<a:${badge.emojiName}:${badge.emojiId}>` : `<:${badge.emojiName}:${badge.emojiId}>`;
  const lines = [
    `${emoji} Badge **${badge.name}** removed from guild **${targetGuildName}**.`,
    `By: <@${awardedByUserId}>`
  ].join('\n');
  await sendLog(guild, 'Guild Badge Removed', lines);
}

module.exports = {
  notifyUserAward,
  notifyUserRevoke,
  notifyGuildAward,
  notifyGuildRevoke,
};

