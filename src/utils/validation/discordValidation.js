// Discord-specific validation utilities

/**
 * Validates a Discord ID (snowflake) with enhanced security
 * @param {string} id
 * @returns {string|null}
 */
function safeParseId(id) {
  const v = String(id || '').trim();
  // Discord snowflakes are 17-19 characters long typically
  return /^[0-9]{17,19}$/.test(v) ? v : null;
}

/**
 * Validates Discord user mention format
 * @param {string} mention
 * @returns {string|null} User ID if valid, null otherwise
 */
function parseUserMention(mention) {
  const mentionStr = String(mention || '').trim();
  const match = mentionStr.match(/^<@!?(\d{17,19})>$/);
  return match ? match[1] : null;
}

/**
 * Validates Discord channel mention format
 * @param {string} mention
 * @returns {string|null} Channel ID if valid, null otherwise
 */
function parseChannelMention(mention) {
  const mentionStr = String(mention || '').trim();
  const match = mentionStr.match(/^<#(\d{17,19})>$/);
  return match ? match[1] : null;
}

/**
 * Validates Discord role mention format
 * @param {string} mention
 * @returns {string|null} Role ID if valid, null otherwise
 */
function parseRoleMention(mention) {
  const mentionStr = String(mention || '').trim();
  const match = mentionStr.match(/^<@&(\d{17,19})>$/);
  return match ? match[1] : null;
}

/**
 * Validates array of Discord IDs
 * @param {Array} ids
 * @param {number} maxLength
 * @returns {Object} Validation result
 */
function validateIdArray(ids, maxLength = 100) {
  if (!Array.isArray(ids)) {
    return { valid: false, message: 'Must be an array' };
  }

  if (ids.length > maxLength) {
    return { valid: false, message: `Cannot exceed ${maxLength} items` };
  }

  const validIds = [];
  for (const id of ids) {
    const validId = safeParseId(id);
    if (!validId) {
      return { valid: false, message: `Invalid ID: ${id}` };
    }
    validIds.push(validId);
  }

  return { valid: true, value: validIds };
}

module.exports = {
  safeParseId,
  parseUserMention,
  parseChannelMention,
  parseRoleMention,
  validateIdArray
};
