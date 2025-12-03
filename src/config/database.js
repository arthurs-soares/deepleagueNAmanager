// Main database module - coordinates database operations
const { ErrorHandler } = require('../core/ErrorHandler');
const { getConnectionString, buildConnectionOptions } = require('./database/connectionConfig');
const {
  isDatabaseConnected,
  attemptConnection,
  disconnectDatabase,
  resetConnectionState
} = require('./database/connectionManager');

/**
 * Connect to MongoDB database with retry logic
 */
async function connectDatabase() {
  return ErrorHandler.safeExecute(async () => {
    const connectionString = getConnectionString();

    if (!connectionString) {
      return { success: false, reason: 'no-connection-string' };
    }

    const connectionOptions = buildConnectionOptions();
    return await attemptConnection(connectionString, connectionOptions);
  }, {
    module: 'Database',
    operation: 'connect'
  });
}

/**
 * Disconnect from database
 */
async function disconnect() {
  return disconnectDatabase(ErrorHandler);
}

/**
 * Execute database operation with connection check
 * @param {Function} operation - Database operation to execute
 * @param {any} fallback - Fallback value if database not available
 * @returns {Promise<any>}
 */
async function withDatabase(operation, fallback = null) {
  if (!isDatabaseConnected()) {
    console.warn('[withDatabase] Database not connected, using fallback');
    return fallback;
  }

  return ErrorHandler.safeDbOperation(operation, fallback);
}

module.exports = {
  connectDatabase,
  disconnectDatabase: disconnect,
  isDatabaseConnected,
  withDatabase,
  resetConnectionState
};
