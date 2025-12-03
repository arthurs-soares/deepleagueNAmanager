/**
 * Centralized Logging Service
 * Replaces direct console.log usage throughout the codebase
 * @module LoggerService
 */

const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
};

/**
 * Get current log level from environment
 * @returns {number}
 */
function getCurrentLevel() {
  const envLevel = process.env.LOG_LEVEL?.toLowerCase();
  return LOG_LEVELS[envLevel] ?? LOG_LEVELS.info;
}

/**
 * Format timestamp for logs
 * @returns {string}
 */
function getTimestamp() {
  return new Date().toISOString();
}

/**
 * Format log message with context
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {Object} context - Additional context
 * @returns {string}
 */
function formatMessage(level, message, context = {}) {
  const timestamp = getTimestamp();
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

  if (Object.keys(context).length > 0) {
    return `${prefix} ${message} ${JSON.stringify(context)}`;
  }
  return `${prefix} ${message}`;
}

/**
 * Logger Service - Centralized logging
 */
const LoggerService = {
  /**
   * Log info message
   * @param {string} message - Message to log
   * @param {Object} context - Additional context
   */
  info(message, context = {}) {
    if (getCurrentLevel() >= LOG_LEVELS.info) {
      // eslint-disable-next-line no-console
      console.log(formatMessage('info', message, context));
    }
  },

  /**
   * Log warning message
   * @param {string} message - Message to log
   * @param {Object} context - Additional context
   */
  warn(message, context = {}) {
    if (getCurrentLevel() >= LOG_LEVELS.warn) {
      // eslint-disable-next-line no-console
      console.warn(formatMessage('warn', message, context));
    }
  },

  /**
   * Log error message
   * @param {string} message - Message to log
   * @param {Object} context - Additional context
   */
  error(message, context = {}) {
    if (getCurrentLevel() >= LOG_LEVELS.error) {
      // eslint-disable-next-line no-console
      console.error(formatMessage('error', message, context));
    }
  },

  /**
   * Log debug message
   * @param {string} message - Message to log
   * @param {Object} context - Additional context
   */
  debug(message, context = {}) {
    if (getCurrentLevel() >= LOG_LEVELS.debug) {
      // eslint-disable-next-line no-console
      console.log(formatMessage('debug', message, context));
    }
  }
};

module.exports = LoggerService;
