// Validation utilities - organized and refactored for maintainability
// Re-exports all validation functions for backward compatibility

const {
  escapeRegex,
  sanitizeText,
  isValidHexColor,
  isValidUrl,
  isSafeCustomId
} = require('./textValidation');

const {
  safeParseId,
  parseUserMention,
  parseChannelMention,
  parseRoleMention,
  validateIdArray
} = require('./discordValidation');

const {
  isValidEmail,
  isValidPhone
} = require('./formatValidation');

const {
  validateGuildName,
  validateGuildTag,
  validateWarScore
} = require('./guildValidation');

const {
  validateAndSanitize
} = require('./schemaValidation');

const {
  DISCORD_LIMITS,
  validateButtonLabel,
  estimateActionRowWidth,
  validateActionRow,
  suggestShorterLabels
} = require('./componentValidation');

module.exports = {
  // Text validation
  escapeRegex,
  sanitizeText,
  isValidHexColor,
  isValidUrl,
  isSafeCustomId,

  // Discord validation
  safeParseId,
  parseUserMention,
  parseChannelMention,
  parseRoleMention,
  validateIdArray,

  // Format validation
  isValidEmail,
  isValidPhone,

  // Guild validation
  validateGuildName,
  validateGuildTag,
  validateWarScore,

  // Schema validation
  validateAndSanitize,

  // Component validation
  DISCORD_LIMITS,
  validateButtonLabel,
  estimateActionRowWidth,
  validateActionRow,
  suggestShorterLabels
};
