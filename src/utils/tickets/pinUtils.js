const { ChannelType } = require('discord.js');

/**
 * Unpin all pinned messages in a given text channel
 * Safe on errors; ignores non-text channels
 * @param {import('discord.js').TextChannel} channel
 */
async function clearPinnedMessages(channel) {
  try {
    if (!channel || channel.type !== ChannelType.GuildText) return;
    const pinned = await channel.messages.fetchPins().catch(() => null);
    if (!pinned) return;
    for (const [, msg] of pinned) {
      try { await msg.unpin().catch(() => {}); } catch (_) {}
    }
  } catch (_) {}
}

/**
 * Send a message to the channel and pin it
 * Optionally clears previous pinned messages first
 * @param {import('discord.js').TextChannel} channel
 * @param {import('discord.js').BaseMessageOptions} payload
 * @param {{ unpinOld?: boolean }} options
 */
async function sendAndPin(channel, payload, { unpinOld = true } = {}) {
  if (!channel || channel.type !== ChannelType.GuildText) return null;
  try {
    if (unpinOld) await clearPinnedMessages(channel);
    const sent = await channel.send(payload);
    try { await sent.pin(); } catch (_) {}
    return sent;
  } catch (_) {
    return null;
  }
}

module.exports = { clearPinnedMessages, sendAndPin };

