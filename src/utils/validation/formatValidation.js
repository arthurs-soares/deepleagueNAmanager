// Format validation utilities for email, phone, etc.

/**
 * Validates email format
 * @param {string} email
 * @returns {boolean}
 */
function isValidEmail(email) {
  const emailStr = String(email || '').trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(emailStr) && emailStr.length <= 254;
}

/**
 * Validates phone number format (international)
 * @param {string} phone
 * @returns {boolean}
 */
function isValidPhone(phone) {
  const phoneStr = String(phone || '').trim();
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(phoneStr);
}

module.exports = {
  isValidEmail,
  isValidPhone
};
