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
    // Connection timeouts - increased for better stability
    serverSelectionTimeoutMS: 30000, // Increased from 10000 to 30s
    socketTimeoutMS: 120000, // Increased from 60000 to 120s (2 minutes)
    connectTimeoutMS: 30000, // Increased from 10000 to 30s

    // Connection pool settings
    maxPoolSize: 10,
    minPoolSize: 2,
    maxIdleTimeMS: 60000, // Increased from 30000 to 60s

    // Retry and reliability settings
    retryWrites: true,
    retryReads: true,
    w: 'majority',

    // Buffer settings
    bufferCommands: false,

    // Heartbeat settings for better connection monitoring
    heartbeatFrequencyMS: 10000,

    // Prevent automatic reconnection (we handle it manually)
    autoIndex: false,
    autoCreate: false,

    // Additional stability settings
    family: 4 // Use IPv4, helps with some network configurations
  };
}

module.exports = {
  getConnectionString,
  buildConnectionOptions
};
