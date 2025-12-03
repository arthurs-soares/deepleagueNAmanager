const { ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');
const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder } = require('@discordjs/builders');
const { colors, emojis } = require('../../config/botConfig');
const { listBadges } = require('./badgeService');

function buildOptions(all) {
  const list = [...(all.user || []), ...(all.guild || [])].slice(0, 25);
  return list.map(b => new StringSelectMenuOptionBuilder()
    .setLabel(`${b.name}`)
    .setDescription(b.category === 'user' ? 'User badge' : 'Guild badge')
    .setEmoji(b.animated ? { id: b.emojiId, name: b.emojiName, animated: true } : { id: b.emojiId, name: b.emojiName })
    .setValue(String(b._id))
  );
}

function buildListField(arr) {
  if (!arr?.length) return '—';
  return arr.slice(0, 20)
    .map(b => `${b.animated ? `<a:${b.emojiName}:${b.emojiId}>` : `<:${b.emojiName}:${b.emojiId}>`} — ${b.name}`)
    .join('\n');
}

async function buildBadgePanel(guild) {
  const all = await listBadges(guild.id);

  const container = new ContainerBuilder();

  // Convert color to integer if it's a hex string
  const primaryColor = typeof colors.primary === 'string'
    ? parseInt(colors.primary.replace('#', ''), 16)
    : colors.primary;
  container.setAccentColor(primaryColor);

  const titleText = new TextDisplayBuilder()
    .setContent(`# ${emojis.leaderboard} Badge Management\n\nCreate and manage server badges for users and guilds.`);

  const userBadgesText = new TextDisplayBuilder()
    .setContent(`**User Badges**\n${buildListField(all.user)}`);

  const guildBadgesText = new TextDisplayBuilder()
    .setContent(`**Guild Badges**\n${buildListField(all.guild)}`);

  container.addTextDisplayComponents(titleText);
  container.addSeparatorComponents(new SeparatorBuilder());
  container.addTextDisplayComponents(userBadgesText);
  container.addTextDisplayComponents(guildBadgesText);

  const createRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('config:badges:user').setStyle(ButtonStyle.Primary).setLabel('User'),
    new ButtonBuilder().setCustomId('config:badges:guild').setStyle(ButtonStyle.Secondary).setLabel('Guild')
  );

  const options = buildOptions(all);
  let editRow, deleteRow;

  if (options.length) {
    const editSelect = new StringSelectMenuBuilder()
      .setCustomId('config:badges:selectEdit')
      .setPlaceholder('Select a badge to edit')
      .setMinValues(1).setMaxValues(1)
      .setOptions(options);
    const deleteSelect = new StringSelectMenuBuilder()
      .setCustomId('config:badges:selectDelete')
      .setPlaceholder('Select a badge to delete')
      .setMinValues(1).setMaxValues(1)
      .setOptions(options);

    editRow = new ActionRowBuilder().addComponents(editSelect);
    deleteRow = new ActionRowBuilder().addComponents(deleteSelect);
  } else {
    const dummy = [
      new StringSelectMenuOptionBuilder()
        .setLabel('No badges available')
        .setValue('none')
    ];

    const editDisabled = new StringSelectMenuBuilder()
      .setCustomId('config:badges:selectEdit')
      .setPlaceholder('No badges available')
      .setMinValues(1).setMaxValues(1)
      .setDisabled(true)
      .setOptions(dummy);

    const deleteDisabled = new StringSelectMenuBuilder()
      .setCustomId('config:badges:selectDelete')
      .setPlaceholder('No badges available')
      .setMinValues(1).setMaxValues(1)
      .setDisabled(true)
      .setOptions(dummy);

    editRow = new ActionRowBuilder().addComponents(editDisabled);
    deleteRow = new ActionRowBuilder().addComponents(deleteDisabled);
  }

  const manageRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('config:badges:awards').setStyle(ButtonStyle.Secondary).setLabel('Manage Awards')
  );

  return { container, rows: [createRow, editRow, deleteRow, manageRow] };
}

module.exports = { buildBadgePanel };

