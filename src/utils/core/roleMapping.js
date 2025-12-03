/**
 * Role mapping utilities for backward compatibility
 * Maps Portuguese role names to English equivalents
 */

// Role mapping constants
const ROLE_MAPPING = {
  // Portuguese to English
  'lider': 'leader',
  'vice-lider': 'co-leader',
  'membro': 'member',

  // English to Portuguese (for backward compatibility)
  'leader': 'lider',
  'co-leader': 'vice-lider',
  'member': 'membro'
};

// Valid role values (both languages)
const VALID_ROLES = ['lider', 'vice-lider', 'membro', 'leader', 'co-leader', 'member'];

/**
 * Normalize role to Portuguese (for database storage)
 * @param {string} role - Role in any language
 * @returns {string} Role in Portuguese
 */
function normalizeRoleToPortuguese(role) {
  if (!role) return 'membro';

  const normalized = role.toLowerCase().trim();

  // If already Portuguese, return as is
  if (['lider', 'vice-lider', 'membro'].includes(normalized)) {
    return normalized;
  }

  // Map English to Portuguese
  const mapped = ROLE_MAPPING[normalized];
  return mapped || 'membro';
}

/**
 * Normalize role to English (for display)
 * @param {string} role - Role in any language
 * @returns {string} Role in English
 */
function normalizeRoleToEnglish(role) {
  if (!role) return 'member';

  const normalized = role.toLowerCase().trim();

  // If already English, return as is
  if (['leader', 'co-leader', 'member'].includes(normalized)) {
    return normalized;
  }

  // Map Portuguese to English
  const mapped = ROLE_MAPPING[normalized];
  return mapped || 'member';
}

/**
 * Get display label for role
 * @param {string} role - Role in any language
 * @returns {string} Capitalized English role
 */
function getRoleDisplayLabel(role) {
  const englishRole = normalizeRoleToEnglish(role);

  switch (englishRole) {
    case 'leader': return 'Leader';
    case 'co-leader': return 'Co-leader';
    case 'member': return 'Member';
    default: return 'Member';
  }
}

/**
 * Check if role is valid
 * @param {string} role - Role to validate
 * @returns {boolean} True if valid
 */
function isValidRole(role) {
  if (!role) return false;
  return VALID_ROLES.includes(role.toLowerCase().trim());
}

/**
 * Get Portuguese role values for database queries
 * @returns {string[]} Array of Portuguese role values
 */
function getPortugueseRoles() {
  return ['lider', 'vice-lider', 'membro'];
}

/**
 * Get English role values for display
 * @returns {string[]} Array of English role values
 */
function getEnglishRoles() {
  return ['leader', 'co-leader', 'member'];
}

module.exports = {
  ROLE_MAPPING,
  VALID_ROLES,
  normalizeRoleToPortuguese,
  normalizeRoleToEnglish,
  getRoleDisplayLabel,
  isValidRole,
  getPortugueseRoles,
  getEnglishRoles
};
