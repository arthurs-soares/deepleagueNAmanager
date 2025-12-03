/**
 * Cleanup helpers for RateLimitService
 */
const LoggerService = require('../services/LoggerService');

/**
 * Remove expired records from the given store
 * @param {Map<string, {count:number, resetTime:number}>} store
 * @returns {number} cleaned - number of removed records
 */
function cleanupStore(store) {
  const now = Date.now();
  let cleaned = 0;
  for (const [key, record] of store.entries()) {
    if (now > record.resetTime) {
      store.delete(key);
      cleaned++;
    }
  }
  if (cleaned > 0) {
    LoggerService.debug('Rate limit cleanup:', { removed: cleaned });
  }
  return cleaned;
}

/**
 * Start automatic cleanup for a service that has { store, cleanupInterval }
 * @param {{store: Map, cleanupInterval: any}} service
 * @param {number} intervalMs
 */
function startCleanup(service, intervalMs = 5 * 60 * 1000) {
  if (service.cleanupInterval) clearInterval(service.cleanupInterval);
  service.cleanupInterval = setInterval(() => cleanupStore(service.store), intervalMs);
}

/**
 * Stop automatic cleanup for a service that has { cleanupInterval }
 * @param {{cleanupInterval: any}} service
 */
function stopCleanup(service) {
  if (service.cleanupInterval) {
    clearInterval(service.cleanupInterval);
    service.cleanupInterval = null;
  }
}

module.exports = { cleanupStore, startCleanup, stopCleanup };

