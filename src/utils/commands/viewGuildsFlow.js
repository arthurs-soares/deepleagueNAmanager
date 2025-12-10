const { MessageFlags, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { listGuilds, findGuildByName } = require('../guilds/guildManager');
const { createInfoEmbed } = require('../embeds/embedBuilder');
const { buildGuildsEmbed } = require('../embeds/guildsEmbed');
const { buildPaginationComponents, DEFAULT_TIMEOUT_MS } = require('../misc/pagination');
const { buildGuildDetailDisplayComponents } = require('../embeds/guildDetailEmbed');
const { sortByRanking } = require('../war/warRanking');

async function handleViewDetails(interaction, requestedName) {
  const target = await findGuildByName(requestedName, interaction.guild.id);
  if (!target) {
    const container = createInfoEmbed('Guild not found', 'No guild with that name was found on this server.');
    return interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2 });
  }
  const container = await buildGuildDetailDisplayComponents(target, interaction.guild);
  const historyButton = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`viewGuild:history:${target._id}`)
      .setStyle(ButtonStyle.Primary)
      .setLabel('📊 History'),
    new ButtonBuilder()
      .setCustomId(`viewGuild:rosterHistory:${target._id}`)
      .setStyle(ButtonStyle.Secondary)
      .setLabel('📋 Roster History')
  );
  return interaction.editReply({ components: [container, historyButton], flags: MessageFlags.IsComponentsV2 });
}

async function handleViewList(interaction) {
  const guildsRaw = await listGuilds(interaction.guild.id);
  const guilds = sortByRanking(guildsRaw);
  if (guilds.length === 0) {
    const container = createInfoEmbed(
      'No Guilds Found',
      'There are no guilds registered on this server yet.\n\nUse `/register` to register a new guild (administrators only).'
    );
    return interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2 });
  }

  const pageSize = 15;
  const embedObj = buildGuildsEmbed(guilds, 1, pageSize);
  const page = embedObj.page ?? 1;
  const totalPages = embedObj.totalPages ?? 1;

  const shouldPaginate = guilds.length > pageSize;
  const components = shouldPaginate
    ? buildPaginationComponents('guildas_page', page, totalPages)
    : [];

  await interaction.editReply({ components: [embedObj, ...components], flags: MessageFlags.IsComponentsV2 });

  if (shouldPaginate) {
    setTimeout(async () => {
      try {
        await interaction.editReply({ components: [embedObj], flags: MessageFlags.IsComponentsV2 });
      } catch (_) { /* ignore */ }
    }, DEFAULT_TIMEOUT_MS);
  }
}

module.exports = { handleViewDetails, handleViewList };

