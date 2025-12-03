// Rate limiting service with proper cleanup and management
const { startCleanup, stopCleanup, cleanupStore } = require('./rateLimitCleanup');

class RateLimitService {
  constructor() {
    this.store = new Map();
    this.cleanupInterval = null;
    startCleanup(this);
  }

  /**
   * Check if request is within rate limit
   * @param {string} key - Rate limit key
   * @param {number} limit - Request limit
   * @param {number} window - Time window in ms
   * @returns {boolean} Whether request is allowed
   */
  checkLimit(key, limit = 5, window = 60000) {
    if (!key || typeof key !== 'string') {
      return false;
    }

    const now = Date.now();
    const record = this.store.get(key) || {
      count: 0,
      resetTime: now + window
    };

    if (now > record.resetTime) {
      record.count = 1;
      record.resetTime = now + window;
    } else {
      record.count++;
    }

    this.store.set(key, record);
    return record.count <= limit;
  }

  /**
   * Get current rate limit info for a key
   * @param {string} key - Rate limit key
   * @returns {Object|null} Rate limit info
   */
  getInfo(key) {
    const record = this.store.get(key);
    if (!record) return null;

    const now = Date.now();
    return {
      count: record.count,
      remaining: Math.max(0, record.resetTime - now),
      resetTime: record.resetTime
    };
  }

  /**
   * Reset rate limit for a specific key
   * @param {string} key - Rate limit key
   */
  reset(key) {
    this.store.delete(key);
  }

  /**
   * Clear all rate limit records
   */
  clear() {
    this.store.clear();
  }

  /**
   * Start automatic cleanup of expired records
   */
  startCleanup() { startCleanup(this); }

  /**
   * Stop automatic cleanup
   */
  stopCleanup() { stopCleanup(this); }

  /**
   * Remove expired records
   */
  cleanup() { cleanupStore(this.store); }

  /**
   * Get service statistics
   * @returns {Object} Service stats
   */
  getStats() {
    return {
      totalKeys: this.store.size,
      isCleanupActive: this.cleanupInterval !== null
    };
  }
}

module.exports = RateLimitService;
