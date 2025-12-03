const { Events } = require('discord.js');
const { detectTagChange } = require('../utils/misc/tagDetection');
const { processUserTagRole } = require('../utils/misc/tagRoleManager');
const LoggerService = require('../services/LoggerService');

/**
 * Tag to monitor for automatic role assignment
 */
const MONITORED_TAG = 'DLSA';

module.exports = {
  name: Events.UserUpdate,
  once: false,

  /**
   * Handle user updates (primary guild changes, avatar changes, etc.)
   * Automatically assigns/removes configured role based on primary guild tag
   * @param {import('discord.js').User} oldUser - Old user state
   * @param {import('discord.js').User} newUser - New user state
   */
  async execute(oldUser, newUser) {
    try {
      // Debug: Log all user updates
      LoggerService.debug('[UserUpdate] User update detected', {
        user: newUser.tag,
        id: newUser.id
      });

      // Debug: Log primary guild info
      const oldTag = oldUser?.primaryGuild?.tag || 'none';
      const newTag = newUser?.primaryGuild?.tag || 'none';
      LoggerService.debug('[UserUpdate] Primary Guild change', { oldTag, newTag });

      // Check if primary guild tag changed
      const tagChange = detectTagChange(oldUser, newUser, MONITORED_TAG);
      LoggerService.debug('[UserUpdate] Tag change result', tagChange);

      if (!tagChange.changed) {
        LoggerService.debug('[UserUpdate] No tag change, skipping', {
          user: newUser.tag
        });
        return;
      }

      LoggerService.debug('[UserUpdate] Processing tag role', {
        user: newUser.tag,
        action: tagChange.hasTag ? 'adding' : 'removing'
      });

      // Process role assignment/removal across all guilds
      await processUserTagRole(
        newUser.client,
        newUser.id,
        tagChange.hasTag
      );

      LoggerService.info('[TagRole] Processed user', {
        user: newUser.tag,
        tag: tagChange.hasTag ? 'added' : 'removed'
      });
    } catch (error) {
      LoggerService.error('[UserUpdate] Error processing user update:', {
        error: error.message,
        userId: newUser?.id
      });
    }
  }
};

