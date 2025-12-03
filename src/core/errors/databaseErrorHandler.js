// Database error handling utilities
const { DatabaseError, ValidationError } = require('./customErrors');

/**
 * Create a safe wrapper for database operations
 * @param {Function} dbOperation - Database operation
 * @param {any} _defaultValue - Default value if operation fails (reserved)
 */
async function safeDbOperation(dbOperation, _defaultValue = null) {
  try {
    return await dbOperation();
  } catch (error) {
    if (error.name === 'MongoNetworkError' || error.name === 'MongoServerError') {
      console.warn('Database operation failed, using fallback:', error.message);
      throw new DatabaseError(error.message, 'database_connection');
    }
    if (error.name === 'ValidationError') {
      throw new ValidationError(error.message, 'database_validation');
    }
    throw error; // Re-throw non-database errors
  }
}

/**
 * Handle database errors specifically
 * @param {Error} error - Database error
 * @param {string} operation - Database operation
 * @param {any} fallback - Fallback value
 */
function handleDatabaseError(error, operation, fallback = null) {
  if (error instanceof DatabaseError) {
    console.error(`Database error in ${operation}:`, error.message);
    return fallback;
  }
  throw error;
}

module.exports = {
  safeDbOperation,
  handleDatabaseError
};
