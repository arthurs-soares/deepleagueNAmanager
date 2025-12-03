// Main error handler - coordinates error handling across modules
const { handleInteractionError } = require('./errors/interactionErrorHandler');
const { safeDbOperation, handleDatabaseError } = require('./errors/databaseErrorHandler');
const { validateData, validateRequired } = require('./errors/validationUtils');
const {
  DatabaseError,
  ValidationError,
  PermissionError,
  RateLimitError
} = require('./errors/customErrors');

/**
 * Enhanced error handling utilities
 */
class ErrorHandler {
  /**
   * Handle async operations with proper logging
   * @param {Function} operation - Async operation to execute
   * @param {Object} context - Context information for logging
   * @param {Function} fallback - Fallback function if operation fails
   */
  static async safeExecute(operation, context = {}, fallback = null) {
    try {
      return await operation();
    } catch (error) {
      console.error(`[${context.module || 'Unknown'}] Error in ${context.operation || 'operation'}:`, {
        error: error.message,
        stack: error.stack,
        context
      });

      if (fallback && typeof fallback === 'function') {
        try {
          return await fallback(error);
        } catch (fallbackError) {
          console.error('Fallback operation also failed:', fallbackError.message);
        }
      }

      throw error;
    }
  }

  // Re-export interaction error handling
  static handleInteractionError = handleInteractionError;

  // Re-export database error handling
  static safeDbOperation = safeDbOperation;
  static handleDatabaseError = handleDatabaseError;

  // Re-export validation utilities
  static validateData = validateData;
  static validateRequired = validateRequired;
}

module.exports = {
  ErrorHandler,
  DatabaseError,
  ValidationError,
  PermissionError,
  RateLimitError
};
