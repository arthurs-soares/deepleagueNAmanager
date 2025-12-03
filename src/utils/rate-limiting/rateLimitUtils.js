const serviceContainer = require('../../core/ServiceContainer');
const LoggerService = require('../../services/LoggerService');

/**
 * Check rate limit using the service container
 * @param {string} key - Rate limit key
 * @param {number} limit - Request limit (default: 5)
 * @param {number} window - Time window in ms (default: 60000)
 * @returns {boolean} Whether request is allowed
 */
function checkRateLimit(key, limit = 5, window = 60000) {
  try {
    if (serviceContainer.has('rateLimitService')) {
      const rateLimitService = serviceContainer.get('rateLimitService');
      return rateLimitService.checkLimit(key, limit, window);
    }

    // Fallback if service not available - allow all requests
    LoggerService.warn('Rate limit service not available, allowing request');
    return true;
  } catch (error) {
    LoggerService.error('Error checking rate limit:', { error: error.message });
    // Fail open - allow the request if rate limiting fails
    return true;
  }
}

/**
 * Get rate limit info for a key
 * @param {string} key - Rate limit key
 * @returns {Object|null} Rate limit info
 */
function getRateLimitInfo(key) {
  try {
    if (serviceContainer.has('rateLimitService')) {
      const rateLimitService = serviceContainer.get('rateLimitService');
      return rateLimitService.getInfo(key);
    }
    return null;
  } catch (error) {
    LoggerService.error('Error getting rate limit info:', {
      error: error.message
    });
    return null;
  }
}

/**
 * Reset rate limit for a key
 * @param {string} key - Rate limit key
 */
function resetRateLimit(key) {
  try {
    if (serviceContainer.has('rateLimitService')) {
      const rateLimitService = serviceContainer.get('rateLimitService');
      rateLimitService.reset(key);
    }
  } catch (error) {
    LoggerService.error('Error resetting rate limit:', { error: error.message });
  }
}

module.exports = {
  checkRateLimit,
  getRateLimitInfo,
  resetRateLimit
};
