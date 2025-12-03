const AwardedBadge = require('../../models/badge/AwardedBadge');

/**
 * Retrieve all badges awarded to a specific user in a Discord guild
 * @param {string} discordGuildId - Discord guild ID
 * @param {string} userId - Discord user ID
 * @returns {Promise<Array>} Array of awarded badge documents with populated badge info
 */
async function getUserBadges(discordGuildId, userId) {
  try {
    if (!discordGuildId || !userId) return [];
    const awards = await AwardedBadge.find({
      discordGuildId,
      category: 'user',
      targetUserId: userId
    })
      .populate('badgeId')
      .sort({ createdAt: -1 }) // Most recent first
      .lean();

    // Filter out orphaned badges (where badgeId reference is broken)
    return awards.filter(award => award.badgeId);
  } catch (error) {
    console.error('Error retrieving user badges:', error);
    return [];
  }
}

/**
 * Retrieve all badges awarded to a specific guild
 * @param {string} discordGuildId - Discord guild ID
 * @param {string} guildModelId - Guild model ObjectId
 * @returns {Promise<Array>} Array of awarded badge documents with populated badge info
 */
async function getGuildBadges(discordGuildId, guildModelId) {
  try {
    if (!discordGuildId || !guildModelId) return [];
    const awards = await AwardedBadge.find({
      discordGuildId,
      category: 'guild',
      targetGuildId: guildModelId
    })
      .populate('badgeId')
      .sort({ createdAt: -1 }) // Most recent first
      .lean();

    // Filter out orphaned badges (where badgeId reference is broken)
    return awards.filter(award => award.badgeId);
  } catch (error) {
    console.error('Error retrieving guild badges:', error);
    return [];
  }
}

/**
 * Format a single badge as an emoji string
 * @param {Object} badge - Badge document
 * @returns {string} Formatted emoji string
 */
function formatBadgeEmoji(badge) {
  if (!badge) return '';
  return badge.animated
    ? `<a:${badge.emojiName}:${badge.emojiId}>`
    : `<:${badge.emojiName}:${badge.emojiId}>`;
}

/**
 * Format awarded badges for display in embeds
 * @param {Array} awards - Array of awarded badge documents
 * @param {Object} options - Formatting options
 * @param {number} options.maxLength - Maximum character length (default: 1000)
 * @param {boolean} options.showNames - Whether to show badge names (default: true)
 * @param {number} options.maxBadges - Maximum number of badges to display (default: 10)
 * @returns {string} Formatted badge string for display
 */
function formatBadgesForDisplay(awards, options = {}) {
  const {
    maxLength = 1000,
    showNames = true,
    maxBadges = 10
  } = options;

  if (!awards || awards.length === 0) {
    return '—';
  }

  // Limit the number of badges to display
  const limitedAwards = awards.slice(0, maxBadges);

  const badgeStrings = limitedAwards.map(award => {
    const badge = award.badgeId;
    const emoji = formatBadgeEmoji(badge);

    if (showNames) {
      return `${emoji} ${badge.name}`;
    } else {
      return emoji;
    }
  });

  let result = badgeStrings.join(' ');

  // Add indicator if there are more badges than displayed
  if (awards.length > maxBadges) {
    result += ` (+${awards.length - maxBadges} more)`;
  }

  // Truncate if too long
  if (result.length > maxLength) {
    result = result.slice(0, maxLength - 1) + '…';
  }

  return result;
}

/**
 * Format badges for compact display (emoji only, for leaderboards)
 * @param {Array} awards - Array of awarded badge documents
 * @param {number} maxBadges - Maximum number of badges to show (default: 3)
 * @returns {string} Compact badge string
 */
function formatBadgesCompact(awards, maxBadges = 3) {
  return formatBadgesForDisplay(awards, {
    maxLength: 100,
    showNames: false,
    maxBadges
  });
}

/**
 * Get badge count for a user
 * @param {string} discordGuildId - Discord guild ID
 * @param {string} userId - Discord user ID
 * @returns {Promise<number>} Number of badges awarded to user
 */
async function getUserBadgeCount(discordGuildId, userId) {
  try {
    return await AwardedBadge.countDocuments({
      discordGuildId,
      category: 'user',
      targetUserId: userId
    });
  } catch (error) {
    console.error('Error getting user badge count:', error);
    return 0;
  }
}

/**
 * Get badge count for a guild
 * @param {string} discordGuildId - Discord guild ID
 * @param {string} guildModelId - Guild model ObjectId
 * @returns {Promise<number>} Number of badges awarded to guild
 */
async function getGuildBadgeCount(discordGuildId, guildModelId) {
  try {
    return await AwardedBadge.countDocuments({
      discordGuildId,
      category: 'guild',
      targetGuildId: guildModelId
    });
  } catch (error) {
    console.error('Error getting guild badge count:', error);
    return 0;
  }
}

module.exports = {
  getUserBadges,
  getGuildBadges,
  formatBadgeEmoji,
  formatBadgesForDisplay,
  formatBadgesCompact,
  getUserBadgeCount,
  getGuildBadgeCount
};
