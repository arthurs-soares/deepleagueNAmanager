// Custom error types for better error categorization

/**
 * Database operation errors
 */
class DatabaseError extends Error {
  constructor(message, operation = 'unknown') {
    super(message);
    this.name = 'DatabaseError';
    this.operation = operation;
  }
}

/**
 * Input validation errors
 */
class ValidationError extends Error {
  constructor(message, field = 'unknown') {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
  }
}

/**
 * Permission-related errors
 */
class PermissionError extends Error {
  constructor(message, required = 'unknown') {
    super(message);
    this.name = 'PermissionError';
    this.required = required;
  }
}

/**
 * Rate limiting errors
 */
class RateLimitError extends Error {
  constructor(message, retryAfter = 0) {
    super(message);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

module.exports = {
  DatabaseError,
  ValidationError,
  PermissionError,
  RateLimitError
};
