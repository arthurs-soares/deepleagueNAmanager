// Database connection event listeners
const mongoose = require('mongoose');
const LoggerService = require('../../services/LoggerService');

// Control variables to prevent duplicate listeners and infinite reconnection
let listenersSetup = false;
let reconnectAttempts = 0;
let isReconnecting = false;
const maxReconnectAttempts = 50;
const baseReconnectDelay = 5000;
const maxReconnectDelay = 60000;

/**
 * Setup connection event listeners (only once)
 */
function setupConnectionEventListeners() {
  if (listenersSetup) {
    LoggerService.debug('Database event listeners already configured');
    return;
  }

  const { setConnectionState } = require('./connectionManager');

  mongoose.connection.removeAllListeners('error');
  mongoose.connection.removeAllListeners('disconnected');
  mongoose.connection.removeAllListeners('reconnected');
  mongoose.connection.removeAllListeners('connected');

  mongoose.connection.on('connected', () => {
    LoggerService.info('MongoDB connected successfully');
    setConnectionState(true);
    reconnectAttempts = 0;
    isReconnecting = false;
  });

  mongoose.connection.on('error', (error) => {
    LoggerService.error('MongoDB connection error:', { error: error.message });
    setConnectionState(false);
  });

  mongoose.connection.on('disconnected', () => {
    LoggerService.warn('Disconnected from MongoDB');
    setConnectionState(false);

    if (!isReconnecting && reconnectAttempts < maxReconnectAttempts) {
      isReconnecting = true;
      reconnectAttempts++;

      const delay = Math.min(
        baseReconnectDelay * Math.pow(1.5, reconnectAttempts - 1),
        maxReconnectDelay
      );

      LoggerService.info('Attempting to reconnect...', {
        attempt: reconnectAttempts,
        maxAttempts: maxReconnectAttempts,
        delaySeconds: Math.round(delay / 1000)
      });

      setTimeout(async () => {
        try {
          const { isDatabaseConnected } = require('./connectionManager');
          if (!isDatabaseConnected()) {
            LoggerService.info('Initiating reconnection attempt...');
            const { connectDatabase } = require('../database');
            const result = await connectDatabase();

            if (result && result.success) {
              LoggerService.info('Reconnection successful');
              reconnectAttempts = 0;
            } else {
              LoggerService.warn('Reconnection attempt did not succeed');
            }
          } else {
            LoggerService.info('Already reconnected');
            reconnectAttempts = 0;
          }
        } catch (error) {
          LoggerService.error('Reconnection attempt failed:', {
            error: error.message
          });
        } finally {
          isReconnecting = false;
        }
      }, delay);
    } else if (reconnectAttempts >= maxReconnectAttempts) {
      LoggerService.error('Maximum reconnection attempts reached', {
        hints: [
          'Check MongoDB Atlas IP whitelist',
          'Check network connectivity',
          'Check MongoDB cluster status'
        ]
      });
      isReconnecting = false;
    }
  });

  mongoose.connection.on('reconnected', () => {
    LoggerService.info('Reconnected to MongoDB');
    setConnectionState(true);
    reconnectAttempts = 0;
    isReconnecting = false;
  });

  listenersSetup = true;
  LoggerService.debug('Database event listeners configured');
}

/**
 * Reset reconnection state (useful for manual reconnection attempts)
 */
function resetReconnectionState() {
  reconnectAttempts = 0;
  isReconnecting = false;
  LoggerService.debug('Reconnection state reset');
}

/**
 * Get current reconnection status (for monitoring)
 * @returns {Object} Status object
 */
function getReconnectionStatus() {
  return {
    attempts: reconnectAttempts,
    maxAttempts: maxReconnectAttempts,
    isReconnecting,
    listenersSetup
  };
}

module.exports = {
  setupConnectionEventListeners,
  resetReconnectionState,
  getReconnectionStatus
};
