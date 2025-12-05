const { ThreadAutoArchiveDuration, ChannelType } = require('discord.js');
const { getOrCreateServerSettings } = require('../system/serverSettings');
const LoggerService = require('../../services/LoggerService');
const {
  addUserToThread,
  verifyUserInThread,
  sendThreadMessages
} = require('./dmFallbackHelpers');

/**
 * Try to send a DM; if it fails, create a private thread fallback.
 * @param {import('discord.js').Client} client
 * @param {string} discordGuildId
 * @param {string} targetUserId
 * @param {import('discord.js').MessageCreateOptions} dmPayload
 * @param {Object} [options]
 * @returns {Promise<{ ok: boolean, via: 'dm'|'thread', threadId?: string }>}
 */
async function sendDmOrFallback(client, discordGuildId, targetUserId, dmPayload, options = {}) {
  const { logDmSent, logDmFailed } = require('../misc/logEvents');
  const guild = client.guilds.cache.get(discordGuildId);
  const failResult = { ok: false, via: 'dm' };

  // Attempt direct DM first
  try {
    const user = await client.users.fetch(targetUserId).catch(() => null);
    if (user) {
      const sent = await user.send(dmPayload).catch(() => null);
      if (sent) {
        if (guild) await logDmSent(guild, targetUserId, options.reason || 'System DM');
        return { ok: true, via: 'dm' };
      }
    }
  } catch (_) { /* fallback */ }

  // Fallback to private thread
  if (!guild) return failResult;

  const settings = await getOrCreateServerSettings(discordGuildId);
  const channelId = settings?.dmWarningChannelId;
  const base = channelId ? guild.channels.cache.get(channelId) : null;
  if (!base || !base.isTextBased?.()) return failResult;

  const threadName = (options.threadTitle || `[DM Fallback] ${targetUserId}`)
    .slice(0, 90);
  const thread = await base.threads.create({
    name: threadName,
    autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek,
    type: ChannelType.PrivateThread,
    invitable: false,
    reason: options.reason || `Fallback for DM to <@${targetUserId}>`
  }).catch(() => null);

  if (!thread) return failResult;

  // Add user to thread
  let userAdded = await addUserToThread(thread, targetUserId);

  // Send messages (mention also adds user if members.add failed)
  await sendThreadMessages(
    thread,
    targetUserId,
    dmPayload,
    options.includeSupportCloseButton
  );

  // Verify user was added
  if (!userAdded) userAdded = await verifyUserInThread(thread, targetUserId);
  if (!userAdded) {
    LoggerService.error('[dmFallback] User not added to thread', {
      targetUserId,
      threadId: thread.id
    });
  }

  try {
    await logDmFailed(
      guild,
      targetUserId,
      options.reason || 'User privacy settings',
      `Private thread created: ${thread.id}`
    );
  } catch (_) {}

  return { ok: true, via: 'thread', threadId: thread.id };
}

module.exports = { sendDmOrFallback };
