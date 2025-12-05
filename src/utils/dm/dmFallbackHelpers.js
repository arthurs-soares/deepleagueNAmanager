/**
 * DM Fallback thread helper functions
 * Extracted to comply with max-lines rule
 */
const { buildSupportCloseButtonRow } = require('../tickets/closeButtons');
const LoggerService = require('../../services/LoggerService');

/**
 * Add user to thread
 * @param {import('discord.js').ThreadChannel} thread
 * @param {string} userId
 * @returns {Promise<boolean>}
 */
async function addUserToThread(thread, userId) {
  try {
    await thread.members.add(userId);
    return true;
  } catch (err) {
    LoggerService.warn('[dmFallback] Failed to add user', {
      userId,
      threadId: thread.id,
      error: err?.message || 'Unknown'
    });
    return false;
  }
}

/**
 * Verify user membership in thread
 * @param {import('discord.js').ThreadChannel} thread
 * @param {string} userId
 * @returns {Promise<boolean>}
 */
async function verifyUserInThread(thread, userId) {
  try {
    const member = await thread.members.fetch(userId);
    return !!member;
  } catch (_) {
    return false;
  }
}

/**
 * Send header and payload messages to thread
 * @param {import('discord.js').ThreadChannel} thread
 * @param {string} userId
 * @param {Object} dmPayload
 * @param {boolean} includeSupportBtn
 */
async function sendThreadMessages(thread, userId, dmPayload, includeSupportBtn) {
  const header = `<@${userId}>\n` +
    'The bot could not send a DM due to privacy settings. ' +
    'Original message is below:';
  const components = includeSupportBtn ? [buildSupportCloseButtonRow()] : [];

  try {
    await thread.send({
      content: header,
      components,
      allowedMentions: { users: [userId] }
    });
  } catch (err) {
    LoggerService.warn('[dmFallback] Failed to send header', {
      threadId: thread.id,
      error: err?.message
    });
  }

  try {
    await thread.send(dmPayload);
  } catch (err) {
    LoggerService.warn('[dmFallback] Failed to send payload', {
      threadId: thread.id,
      error: err?.message
    });
  }
}

module.exports = {
  addUserToThread,
  verifyUserInThread,
  sendThreadMessages
};
