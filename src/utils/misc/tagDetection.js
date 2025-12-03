/**
 * Tag detection utilities for primary guild-based role assignment
 */

/**
 * Get the primary guild tag of a user
 * @param {import('discord.js').User} user - Discord user
 * @returns {string|null} Primary guild tag or null
 */
function getPrimaryGuildTag(user) {
  try {
    return user?.primaryGuild?.tag || null;
  } catch (_) {
    return null;
  }
}

/**
 * Check if a user's primary guild has a specific tag
 * @param {import('discord.js').User} user - Discord user
 * @param {string} tag - Tag to search for (e.g., "DLSA")
 * @returns {boolean} True if tag matches (case-insensitive)
 */
function hasTag(user, tag) {
  try {
    if (!user || !tag) return false;
    const primaryTag = getPrimaryGuildTag(user);
    if (!primaryTag) return false;
    return primaryTag.toLowerCase() === tag.toLowerCase();
  } catch (_) {
    return false;
  }
}

/**
 * Check if tag status changed between old and new user states
 * @param {import('discord.js').User} oldUser - Old user state
 * @param {import('discord.js').User} newUser - New user state
 * @param {string} tag - Tag to check for
 * @returns {Object} Change status { changed: boolean, hadTag: boolean, hasTag: boolean }
 */
function detectTagChange(oldUser, newUser, tag) {
  try {
    const hadTag = hasTag(oldUser, tag);
    const hasTagNow = hasTag(newUser, tag);
    const changed = hadTag !== hasTagNow;

    return { changed, hadTag, hasTag: hasTagNow };
  } catch (_) {
    return { changed: false, hadTag: false, hasTag: false };
  }
}

module.exports = {
  getPrimaryGuildTag,
  hasTag,
  detectTagChange
};

