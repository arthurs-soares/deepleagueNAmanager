/**
 * War Log Session Manager
 * Handles in-memory session storage for war logging workflow
 */

// In-memory session storage (short-lived)
const warLogSessions = new Map();

// Clean old sessions every 30 minutes
setInterval(() => {
  const now = Date.now();
  for (const [id, session] of warLogSessions) {
    if (now - session.createdAt > 30 * 60 * 1000) {
      warLogSessions.delete(id);
    }
  }
}, 30 * 60 * 1000);

/**
 * Generate short session ID
 * @returns {string} Random 8-character session ID
 */
function generateSessionId() {
  return Math.random().toString(36).substring(2, 10);
}

/**
 * Get session by ID
 * @param {string} sessionId - Session ID
 * @returns {Object|undefined} Session data
 */
function getSession(sessionId) {
  return warLogSessions.get(sessionId);
}

/**
 * Set session data
 * @param {string} sessionId - Session ID
 * @param {Object} data - Session data
 */
function setSession(sessionId, data) {
  warLogSessions.set(sessionId, data);
}

/**
 * Delete session
 * @param {string} sessionId - Session ID
 */
function deleteSession(sessionId) {
  warLogSessions.delete(sessionId);
}

/**
 * Check if a string is a valid MongoDB ObjectId
 * @param {string} str - String to check
 * @returns {boolean} True if valid ObjectId
 */
function isValidObjectId(str) {
  if (!str) return false;
  return /^[a-fA-F0-9]{24}$/.test(str);
}

module.exports = {
  warLogSessions,
  generateSessionId,
  getSession,
  setSession,
  deleteSession,
  isValidObjectId
};
