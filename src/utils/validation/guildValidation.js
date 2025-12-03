// Guild-specific validation utilities
const { sanitizeText } = require('./textValidation');

/**
 * Validates guild name with enhanced rules
 * @param {string} name
 * @returns {Object} Validation result
 */
function validateGuildName(name) {
  const sanitized = sanitizeText(name, 100);

  if (!sanitized || sanitized.length < 2) {
    return { valid: false, message: 'Guild name must be at least 2 characters long' };
  }

  if (sanitized.length > 100) {
    return { valid: false, message: 'Guild name cannot exceed 100 characters' };
  }

  // Check for only whitespace or special characters
  if (!/^[\w\s\-_.]+$/.test(sanitized)) {
    return { valid: false, message: 'Guild name contains invalid characters' };
  }

  return { valid: true, sanitized };
}

/**
 * Validates guild tag/name with enhanced rules
 * @param {string} tag
 * @returns {Object} Validation result
 */
function validateGuildTag(tag) {
  const sanitized = sanitizeText(tag, 20);

  if (!sanitized || sanitized.length < 2) {
    return { valid: false, message: 'Guild tag must be at least 2 characters long' };
  }

  if (sanitized.length > 20) {
    return { valid: false, message: 'Guild tag cannot exceed 20 characters' };
  }

  // Only allow alphanumeric characters and underscores
  if (!/^[A-Za-z0-9_]+$/.test(sanitized)) {
    return { valid: false, message: 'Guild tag can only contain letters, numbers, and underscores' };
  }

  return { valid: true, sanitized };
}

/**
 * Validates war score format
 * @param {string|number} score
 * @returns {Object} Validation result
 */
function validateWarScore(score) {
  const num = parseInt(score, 10);

  if (isNaN(num)) {
    return { valid: false, message: 'Score must be a valid number' };
  }

  if (num < 0) {
    return { valid: false, message: 'Score cannot be negative' };
  }

  if (num > 999999) {
    return { valid: false, message: 'Score cannot exceed 999,999' };
  }

  return { valid: true, value: num };
}

module.exports = {
  validateGuildName,
  validateGuildTag,
  validateWarScore
};
