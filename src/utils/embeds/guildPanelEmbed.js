const {
  ContainerBuilder,
  TextDisplayBuilder,
  SectionBuilder,
  SeparatorBuilder,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ActionRowBuilder
} = require('@discordjs/builders');
const { ButtonStyle } = require('discord.js');

const { colors, emojis } = require('../../config/botConfig');
const { formatRosterCounts } = require('../roster/rosterUtils');
const { getFirstActiveRegion } = require('../../models/statics/guildStatics');

/**
 * Format managers list for display
 * @param {string[]} managers - Array of manager user IDs
 * @returns {string}
 */
function formatManagersList(managers) {
  if (!Array.isArray(managers) || managers.length === 0) return '—';
  return managers.map(id => `<@${id}>`).join(', ');
}

/**
 * Get region stats for display
 * @param {Object} guild - Guild document
 * @param {string} selectedRegion - Selected region name
 * @returns {Object} Region stats
 */
function getRegionStatsForDisplay(guild, selectedRegion) {
  if (!guild?.regions?.length) {
    return { region: '—', wins: 0, losses: 0, elo: 1000 };
  }

  if (selectedRegion) {
    const found = guild.regions.find(r => r.region === selectedRegion);
    if (found) return found;
  }

  return getFirstActiveRegion(guild) || guild.regions[0];
}

/**
 * Build region stats section components
 * @param {ContainerBuilder} container - Container to add to
 * @param {Object} guild - Guild document
 * @param {Object} regionStats - Region stats object
 * @param {Array} activeRegions - Active regions array
 * @param {string} guildId - Guild ID
 */
function buildRegionStatsSection(container, guild, regionStats, activeRegions, guildId) {
  const regionLabel = regionStats?.region || '—';
  const regionWins = regionStats?.wins ?? 0;
  const regionLosses = regionStats?.losses ?? 0;
  const regionElo = regionStats?.elo ?? 1000;

  const regionsListText = activeRegions.length > 0
    ? activeRegions.map(r => r.region).join(', ')
    : '—';

  const regionStatsText = new TextDisplayBuilder()
    .setContent(
      `### 🌍 Region Stats: **${regionLabel}**\n` +
      `**Regions:** ${regionsListText}\n` +
      `**W/L:** ${regionWins}/${regionLosses} | **ELO:** ${regionElo}`
    );
  container.addTextDisplayComponents(regionStatsText);

  if (activeRegions.length > 1) {
    const regionSelect = new StringSelectMenuBuilder()
      .setCustomId(`guild_panel:select_region:${guildId}`)
      .setPlaceholder('Switch Region');

    for (const r of activeRegions) {
      const option = new StringSelectMenuOptionBuilder()
        .setLabel(r.region)
        .setValue(r.region)
        .setDefault(r.region === regionLabel);
      regionSelect.addOptions(option);
    }

    const regionRow = new ActionRowBuilder().addComponents(regionSelect);
    container.addActionRowComponents(regionRow);
  }
}


/**
 * Build the guild panel using Display Components v2
 * - Uses ContainerBuilder for main layout
 * - Uses SectionBuilder for organized information display
 * - Maintains all existing functionality with modern components
 * @param {Object} guild - Guild document
 * @param {import('discord.js').Guild} _discordGuild - Discord guild object
 * @param {string} [selectedRegion] - Selected region for stats display
 * @returns {Promise<ContainerBuilder[]>}
 */
async function buildGuildPanelDisplayComponents(guild, _discordGuild, selectedRegion = null) {

  const members = Array.isArray(guild.members) ? guild.members : [];
  const coLeader = members.find(m => m.role === 'vice-lider');

  const guildId = guild.id || guild._id;
  const regionStats = getRegionStatsForDisplay(guild, selectedRegion);
  const activeRegions = (guild.regions || []).filter(r => r.status === 'active');

  const color = guild.color ? parseInt(guild.color.replace('#', ''), 16) : colors.primary;

  // Single container: merge top and bottom; add a visual separator between
  const container = new ContainerBuilder().setAccentColor(color);

  // Title section with icon thumbnail if available
  const titleText = new TextDisplayBuilder()
    .setContent(`# ${emojis.leader} ${guild.name}`);

  // Get guild icon or fallback to Discord server icon
  const serverIconUrl = _discordGuild?.iconURL({ dynamic: true, size: 128 });
  const guildIconUrl = guild.iconUrl || serverIconUrl;

  if (guildIconUrl) {
    const titleSection = new SectionBuilder()
      .addTextDisplayComponents(titleText);
    titleSection.setThumbnailAccessory(thumbnail =>
      thumbnail
        .setURL(guildIconUrl)
        .setDescription(`${guild.name} icon`)
    );
    container.addSectionComponents(titleSection);
  } else {
    container.addTextDisplayComponents(titleText);
  }

  // Leadership section
  const leaderText = new TextDisplayBuilder()
    .setContent(`**${emojis.leader} Leader**\n${guild.leader || '—'}`);
  const coLeaderText = new TextDisplayBuilder()
    .setContent(`**${emojis.coLeader} Co-leader**\n${coLeader?.username || '—'}`);
  const rostersLeadershipText = new TextDisplayBuilder()
    .setContent(`**Rosters**\n${formatRosterCounts(guild)}`);

  // Leader + inline action
  const leaderActionSection = new SectionBuilder()
    .addTextDisplayComponents(leaderText);
  leaderActionSection.setButtonAccessory(button =>
    button
      .setCustomId(`guild_panel:transfer_leadership:${guildId}`)
      .setLabel('Transfer Leader')
      .setStyle(ButtonStyle.Primary)
  );
  container.addSectionComponents(leaderActionSection);

  // Co-leader section with inline Add Co-leader button (or thumbnail when exists)
  const coLeaderSection = new SectionBuilder()
    .addTextDisplayComponents(coLeaderText);
  if (!coLeader) {
    coLeaderSection.setButtonAccessory(button =>
      button
        .setCustomId(`guild_panel:add_co_leader:${guildId}`)
        .setLabel('Add Co-leader')
        .setStyle(ButtonStyle.Secondary)
    );
  } else {
    coLeaderSection.setButtonAccessory(button =>
      button
        .setCustomId(`guild_panel:change_co_leader:${guildId}`)
        .setLabel('Change Co-leader')
        .setStyle(ButtonStyle.Secondary)
    );
  }

  container.addSectionComponents(coLeaderSection);

  // Rosters section with inline Edit button
  const rostersSection = new SectionBuilder()
    .addTextDisplayComponents(rostersLeadershipText);
  rostersSection.setButtonAccessory(button =>
    button
      .setCustomId(`guild_panel:edit_roster:${guildId}`)
      .setLabel('Edit Roster')
      .setStyle(ButtonStyle.Primary)
  );
  container.addSectionComponents(rostersSection);

  // Managers section with inline Manage Managers button
  const managersArray = Array.isArray(guild.managers) ? guild.managers : [];
  const managersText = new TextDisplayBuilder()
    .setContent(`**Managers (${managersArray.length}/2)**\n${formatManagersList(managersArray)}`);
  const managersSection = new SectionBuilder()
    .addTextDisplayComponents(managersText);
  managersSection.setButtonAccessory(button =>
    button
      .setCustomId(`guild_panel:manage_managers:${guildId}`)
      .setLabel('Manage Managers')
      .setStyle(ButtonStyle.Secondary)
  );
  container.addSectionComponents(managersSection);

  // Members count directly below Managers (before separator)
  const mainRoster = Array.isArray(guild.mainRoster) ? guild.mainRoster : [];
  const subRoster = Array.isArray(guild.subRoster) ? guild.subRoster : [];
  const uniqueIds = new Set([...mainRoster, ...subRoster]);
  if (guild.registeredBy) uniqueIds.add(guild.registeredBy);
  const memberCount = uniqueIds.size;
  const membersText = new TextDisplayBuilder()
    .setContent(`**Members**\n${memberCount}`);
  container.addTextDisplayComponents(membersText);


  // Separator between top and bottom (Components V2)
  const separator = new SeparatorBuilder();
  container.addSeparatorComponents(separator);

  // Region Stats Section
  buildRegionStatsSection(container, guild, regionStats, activeRegions, guildId);

  // Separator before description
  container.addSeparatorComponents(new SeparatorBuilder());

  // Description — labeled, after separator
  if (guild.description) {
    const descText = new TextDisplayBuilder()
      .setContent(`**Description:**\n${guild.description}`);
    container.addTextDisplayComponents(descText);
  }








  // Guild statistics with inline Edit Data button next to Created
  const createdText = new TextDisplayBuilder()
    .setContent(`**Created**\n<t:${Math.floor(new Date(guild.createdAt).getTime() / 1000)}:F>`);
  const createdSection = new SectionBuilder().addTextDisplayComponents(createdText);
  createdSection.setButtonAccessory(button =>
    button
      .setCustomId(`guild_panel:edit_data:${guildId}`)
      .setLabel('Edit Data')
      .setStyle(ButtonStyle.Success)
  );
  container.addSectionComponents(createdSection);



  // Footer information
  if (guild.registeredBy) {
    const footerText = new TextDisplayBuilder()
      .setContent(`*Registered by: ${guild.registeredBy}*`);
    container.addTextDisplayComponents(footerText);
  }

  // Banner image at the end if configured
  if (guild.bannerUrl) {
    const bannerGallery = new MediaGalleryBuilder()
      .addItems(
        new MediaGalleryItemBuilder()
          .setURL(guild.bannerUrl)
          .setDescription(`${guild.name} banner`)
      );
    container.addMediaGalleryComponents(bannerGallery);
  }

  return container;
}

module.exports = { buildGuildPanelDisplayComponents };
