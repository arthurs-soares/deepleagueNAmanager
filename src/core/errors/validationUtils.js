// Validation utilities for error handling
const { ValidationError } = require('./customErrors');

/**
 * Handle validation errors
 * @param {any} data - Data to validate
 * @param {Object} rules - Validation rules
 * @throws {ValidationError} If validation fails
 */
function validateData(data, rules) {
  for (const [field, rule] of Object.entries(rules)) {
    if (rule.required && (data[field] === undefined || data[field] === null || data[field] === '')) {
      throw new ValidationError(`${field} is required`, field);
    }

    if (data[field] !== undefined && rule.type) {
      if (typeof data[field] !== rule.type) {
        throw new ValidationError(`${field} must be of type ${rule.type}`, field);
      }
    }

    if (data[field] !== undefined && rule.minLength && data[field].length < rule.minLength) {
      throw new ValidationError(`${field} must be at least ${rule.minLength} characters`, field);
    }

    if (data[field] !== undefined && rule.maxLength && data[field].length > rule.maxLength) {
      throw new ValidationError(`${field} cannot exceed ${rule.maxLength} characters`, field);
    }
  }
}

/**
 * Validate required parameters
 * @param {Object} params - Parameters to validate
 * @param {Array} required - Required parameter names
 * @throws {Error} If required parameters are missing
 */
function validateRequired(params, required) {
  const missing = required.filter(param =>
    params[param] === undefined || params[param] === null || params[param] === ''
  );

  if (missing.length > 0) {
    throw new Error(`Missing required parameters: ${missing.join(', ')}`);
  }
}

module.exports = {
  validateData,
  validateRequired
};
