/**
 * Guild document helper utilities
 * Provides functions for ensuring guild document integrity
 */

/**
 * Ensures the guild document has a valid regions array
 * (legacy migration for guilds created before multi-region)
 * @param {object} doc - Guild document
 */
function ensureRegionsArray(doc) {
  if (!doc) return;

  if (!Array.isArray(doc.regions) || doc.regions.length === 0) {
    doc.regions = [{
      region: 'NA East',
      wins: 0,
      losses: 0,
      elo: 1000,
      registeredAt: doc.createdAt || new Date(),
      status: 'active'
    }];
  }
}

module.exports = {
  ensureRegionsArray
};
