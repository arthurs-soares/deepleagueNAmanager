// Database connection configuration utilities
const LoggerService = require('../../services/LoggerService');

/**
 * Get connection string from environment
 * @returns {string|null} Connection string or null if not available
 */
function getConnectionString() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    LoggerService.warn('DATABASE_URL is not defined in environment variables');
    LoggerService.info('Bot will run in limited mode without database...');
    return null;
  }

  return connectionString;
}

/**
 * Build MongoDB connection options
 * @returns {Object} Connection options
 */
function buildConnectionOptions() {
  return {
    // Connection timeouts - increased for unstable networks
    serverSelectionTimeoutMS: 45000,
    socketTimeoutMS: 180000,
    connectTimeoutMS: 45000,

    // Connection pool settings
    maxPoolSize: 10,
    minPoolSize: 1,
    maxIdleTimeMS: 120000,

    // Retry and reliability settings
    retryWrites: true,
    retryReads: true,
    w: 'majority',

    // Buffer settings
    bufferCommands: false,

    // Heartbeat settings - slower for unstable connections
    heartbeatFrequencyMS: 15000,

    // Prevent automatic reconnection (we handle it manually)
    autoIndex: false,
    autoCreate: false,

    // Force IPv4 to avoid DNS issues
    family: 4,

    // Direct connection for better stability with SRV records
    directConnection: false
  };
}

module.exports = {
  getConnectionString,
  buildConnectionOptions
};
