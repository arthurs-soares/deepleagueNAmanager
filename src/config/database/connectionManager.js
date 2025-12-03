// Database connection management with retry logic
const mongoose = require('mongoose');
const {
  setupConnectionEventListeners,
  resetReconnectionState
} = require('./eventListeners');
const { provideDiagnostics } = require('./diagnostics');
const LoggerService = require('../../services/LoggerService');

// Database connection state
let isConnected = false;
let connectionAttempts = 0;
let isConnecting = false;
const maxRetries = 3;

/**
 * Check if database is connected
 * @returns {boolean}
 */
function isDatabaseConnected() {
  const mongooseConnected = mongoose.connection.readyState === 1;

  if (mongooseConnected && !isConnected) {
    isConnected = true;
  }

  return mongooseConnected;
}

/**
 * Attempt connection with retry logic
 * @param {string} connectionString - MongoDB connection string
 * @param {Object} options - Connection options
 * @returns {Promise<Object>} Connection result
 */
async function attemptConnection(connectionString, options) {
  if (isConnecting) {
    LoggerService.info('Connection attempt already in progress...');
    return { success: false, reason: 'already-connecting' };
  }

  isConnecting = true;
  LoggerService.info('Attempting to connect to MongoDB...');

  try {
    while (connectionAttempts < maxRetries) {
      try {
        if (mongoose.connection.readyState === 1) {
          LoggerService.info('Already connected to MongoDB');
          isConnected = true;
          connectionAttempts = 0;
          setupConnectionEventListeners();
          return { success: true };
        }

        await mongoose.connect(connectionString, options);
        isConnected = true;
        connectionAttempts = 0;

        LoggerService.info('Successfully connected to MongoDB');
        setupConnectionEventListeners();

        return { success: true };
      } catch (error) {
        connectionAttempts++;
        LoggerService.error(`Connection attempt ${connectionAttempts}/${maxRetries} failed:`, {
          error: error.message
        });

        if (connectionAttempts >= maxRetries) {
          LoggerService.error('Maximum connection attempts reached');
          provideDiagnostics(error);
          LoggerService.info('Bot will run in limited mode without database...');
          resetReconnectionState();
          return {
            success: false,
            reason: 'max-retries-reached',
            error: error.message
          };
        }

        const delay = Math.min(2000 * connectionAttempts, 10000);
        LoggerService.info(`Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  } finally {
    isConnecting = false;
  }
}

/**
 * Disconnect from database
 * @param {Function} ErrorHandler - Error handler for safe execution
 */
async function disconnectDatabase(ErrorHandler) {
  return ErrorHandler.safeExecute(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      isConnected = false;
      LoggerService.info('Disconnected from MongoDB');
    }
  }, {
    module: 'Database',
    operation: 'disconnect'
  }, async (error) => {
    LoggerService.error('Error disconnecting from MongoDB:', {
      error: error.message
    });
    try {
      await mongoose.connection.close(true);
      isConnected = false;
    } catch (_) {
      // Silent fail for force close
    }
  });
}

/**
 * Export connection state setter for event listeners
 * @param {boolean} connected - Connection state
 */
function setConnectionState(connected) {
  isConnected = connected;
  if (!connected) {
    isConnecting = false;
  }
}

/**
 * Force reset connection state (for manual interventions)
 */
function resetConnectionState() {
  isConnected = false;
  isConnecting = false;
  connectionAttempts = 0;
  resetReconnectionState();
  LoggerService.info('Connection state reset');
}

module.exports = {
  isDatabaseConnected,
  attemptConnection,
  disconnectDatabase,
  setConnectionState,
  resetConnectionState
};
