const { ChannelType, MessageFlags } = require('discord.js');
const { getOrCreateServerSettings } = require('../system/serverSettings');
const Guild = require('../../models/guild/Guild');
const { buildGuildDetailDisplayComponents } = require('../embeds/guildDetailEmbed');

/**
 * Render the roster post content for a guild using Components v2
 */
async function buildRosterPostContent(guildDoc) {
  const container = await buildGuildDetailDisplayComponents(guildDoc);
  // Return Components v2 payload
  return { components: [container], flags: MessageFlags.IsComponentsV2 };
}

/**
 * Map region filter to guild schema region values
 */
function getRegionValues(regionFilter) {
  switch (regionFilter) {
    case 'South America':
      return ['South America'];
    case 'NA':
      return ['NA East', 'NA West'];
    case 'Europe':
      return ['Europe'];
    default:
      return null; // All regions
  }
}

/**
 * Get the appropriate forum channel ID based on region filter
 */
function getForumChannelId(settings, regionFilter) {
  switch (regionFilter) {
    case 'South America':
      return settings.rosterForumSAChannelId;
    case 'NA':
      return settings.rosterForumNAChannelId;
    case 'Europe':
      return settings.rosterForumEUChannelId;
    default:
      return settings.rosterForumChannelId;
  }
}

/**
 * Encontra o thread de roster pelo título (nome da guilda)
 */
async function findRosterThread(discordGuild, title) {
  const settings = await getOrCreateServerSettings(discordGuild.id);
  const forumId = settings.rosterForumChannelId;
  const forum = forumId ? discordGuild.channels.cache.get(forumId) : null;
  if (!forum || forum.type !== ChannelType.GuildForum) return null;
  const active = await forum.threads.fetchActive();
  return active.threads.find(t => t.name === title) || null;
}

/**
 * Archive/remove the roster thread for a specific guild, if it exists
 */
async function removeGuildRosterThread(discordGuild, guildName) {
  try {
    const thread = await findRosterThread(discordGuild, guildName);
    if (!thread) return false;
    try { await thread.setArchived(true); } catch (_) {}
    return true;
  } catch (error) {
    console.warn('Failed to remove roster thread:', error?.message);
    return false;
  }
}

/**
 * Synchronize the roster forum: create/update posts for each guild
 * - Create topics for guilds without topic
 * - Update the first post of the topic to reflect the current roster
 * - Archive topics of removed guilds
 * @param {import('discord.js').Guild} discordGuild - The Discord guild
 * @param {string} [regionFilter] - Optional region filter: 'South America', 'NA', 'Europe', or null for all
 */
async function syncRosterForum(discordGuild, regionFilter = null) {
  const settings = await getOrCreateServerSettings(discordGuild.id);
  const forumId = getForumChannelId(settings, regionFilter);
  const forum = forumId ? discordGuild.channels.cache.get(forumId) : null;
  if (!forum || forum.type !== ChannelType.GuildForum) return;

  // Build query filter based on region
  const query = { discordGuildId: discordGuild.id };
  const regionValues = getRegionValues(regionFilter);
  if (regionValues) {
    query.region = { $in: regionValues };
  }

  const guilds = await Guild.find(query).sort({ createdAt: 1 });

  // Map existing threads by title (guild name)
  const active = await forum.threads.fetchActive();
  const titleToThread = new Map();
  active.threads.forEach(t => titleToThread.set(t.name, t));

  const expectedTitles = new Set(guilds.map(g => g.name));

  // Create/update
  for (const g of guilds) {
    const title = g.name;
    let thread = titleToThread.get(title);
    if (!thread) {
      // Create thread
      thread = await forum.threads.create({ name: title, message: await buildRosterPostContent(g) });
    } else {
      // Update first post if possible
      try {
        const starterMessage = await thread.fetchStarterMessage();
        if (starterMessage) {
          const payload = await buildRosterPostContent(g);
          await starterMessage.edit(payload);
        }
      } catch (_) { /* ignore */ }
    }
  }

  // Archive topics that no longer correspond to any guild
  for (const [title, thread] of titleToThread.entries()) {
    if (!expectedTitles.has(title)) {
      try { await thread.setArchived(true); } catch (_) {}
    }
  }
}

module.exports = { syncRosterForum, removeGuildRosterThread };

