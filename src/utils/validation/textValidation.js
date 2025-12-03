// Text sanitization and validation utilities

/**
 * Escapes special characters for safe use in RegExp
 * @param {string} text
 * @returns {string}
 */
function escapeRegex(text) {
  return String(text || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Enhanced text sanitization with security measures
 * @param {string} s - Input string
 * @param {number} [max] - Maximum length
 * @param {Object} [options] - Additional options
 * @returns {string} Sanitized string
 */
function sanitizeText(s, max, options = {}) {
  let text = String(s || '');

  // Remove control characters and other dangerous characters
  // eslint-disable-next-line no-control-regex
  text = text.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');

  // Remove potential XSS characters if specified
  if (options.removeHtml) {
    text = text.replace(/<[^>]*>/g, '');
  }

  // Remove zero-width characters that could be used for obfuscation
  text = text.replace(/[\u200B-\u200D\uFEFF]/g, '');

  text = text.trim();

  return typeof max === 'number' ? text.slice(0, max) : text;
}

/**
 * Validates hex color codes
 * @param {string} color
 * @returns {boolean}
 */
function isValidHexColor(color) {
  const colorStr = String(color || '').trim();
  return /^#?[0-9a-fA-F]{6}$/.test(colorStr);
}

/**
 * Validates URLs with enhanced security
 * @param {string} url
 * @param {Array} [allowedProtocols] - Allowed protocols
 * @returns {boolean}
 */
function isValidUrl(url, allowedProtocols = ['https', 'http']) {
  try {
    const parsed = new URL(String(url || ''));
    return allowedProtocols.includes(parsed.protocol.slice(0, -1));
  } catch {
    return false;
  }
}

/**
 * Enhanced custom ID validation
 * @param {string} customId
 * @returns {boolean}
 */
function isSafeCustomId(customId) {
  const s = String(customId || '');
  if (s.length === 0 || s.length > 100) return false; // Reduced from 200 for security
  return /^[A-Za-z0-9:_-]+$/.test(s); // Only allow specific characters
}

module.exports = {
  escapeRegex,
  sanitizeText,
  isValidHexColor,
  isValidUrl,
  isSafeCustomId
};
