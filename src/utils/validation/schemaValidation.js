// Schema-based validation utilities
const { ValidationError } = require('../../core/ErrorHandler');
const { sanitizeText } = require('./textValidation');

/**
 * Comprehensive input sanitization with validation
 * @param {Object} data - Input data
 * @param {Object} schema - Validation schema
 * @returns {Object} Sanitized and validated data
 * @throws {ValidationError} If validation fails
 */
function validateAndSanitize(data, schema) {
  const result = {};

  for (const [field, rules] of Object.entries(schema)) {
    const value = data[field];

    // Check required fields
    if (rules.required && (value === undefined || value === null || value === '')) {
      throw new ValidationError(`${field} is required`, field);
    }

    // Skip validation for optional empty fields
    if (!rules.required && (value === undefined || value === null || value === '')) {
      continue;
    }

    // Type validation
    if (rules.type && typeof value !== rules.type) {
      throw new ValidationError(`${field} must be of type ${rules.type}`, field);
    }

    // String validations
    if (rules.type === 'string') {
      const sanitized = sanitizeText(value, rules.maxLength, rules.sanitizeOptions || {});

      if (rules.minLength && sanitized.length < rules.minLength) {
        throw new ValidationError(`${field} must be at least ${rules.minLength} characters`, field);
      }

      if (rules.pattern && !rules.pattern.test(sanitized)) {
        throw new ValidationError(`${field} format is invalid`, field);
      }

      result[field] = sanitized;
    }

    // Number validations
    if (rules.type === 'number') {
      const num = Number(value);

      if (isNaN(num)) {
        throw new ValidationError(`${field} must be a valid number`, field);
      }

      if (rules.min !== undefined && num < rules.min) {
        throw new ValidationError(`${field} must be at least ${rules.min}`, field);
      }

      if (rules.max !== undefined && num > rules.max) {
        throw new ValidationError(`${field} cannot exceed ${rules.max}`, field);
      }

      result[field] = num;
    }

    // Array validations
    if (rules.type === 'array') {
      if (!Array.isArray(value)) {
        throw new ValidationError(`${field} must be an array`, field);
      }

      if (rules.maxItems && value.length > rules.maxItems) {
        throw new ValidationError(`${field} cannot have more than ${rules.maxItems} items`, field);
      }

      result[field] = value;
    }

    // Custom validation
    if (rules.validate && typeof rules.validate === 'function') {
      const customResult = rules.validate(value);
      if (customResult !== true) {
        throw new ValidationError(customResult || `${field} is invalid`, field);
      }
    }
  }

  return result;
}

module.exports = {
  validateAndSanitize
};
