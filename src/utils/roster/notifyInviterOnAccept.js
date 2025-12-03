const { MessageFlags } = require('discord.js');
const { createSuccessEmbed } = require('../embeds/embedBuilder');
const { sendDmOrFallback } = require('../dm/dmFallback');

/**
 * Notify the inviter via DM that their roster invitation was accepted (English only)
 * Falls back to a private thread in DM Warning channel if DMs are closed.
 *
 * @param {import('discord.js').Client} client - Discord client
 * @param {string} inviterUserId - The user who originally sent the invite
 * @param {{ acceptedUserId: string, acceptedUsername?: string, guildName: string, roster: 'main'|'sub', when?: Date, discordGuildId?: string, guildDiscordId?: string }} payload
 */
async function notifyInviterOnAccept(client, inviterUserId, payload) {
  try {
    if (!client || !inviterUserId) return false;

    const user = await client.users.fetch(inviterUserId).catch(() => null);
    if (!user) return false;

    const when = payload.when || new Date();
    const rosterLabel = payload.roster === 'main' ? 'Main' : 'Sub';
    const username = payload.acceptedUsername || `ID: ${payload.acceptedUserId}`;

    const container = createSuccessEmbed(
      'Invitation accepted',
      `User <@${payload.acceptedUserId}> (${username}) accepted your invitation to join the guild "${payload.guildName}".\n\n` +
      `**Guild:** ${payload.guildName}\n` +
      `**Roster:** ${rosterLabel}\n` +
      `**When:** <t:${Math.floor(when.getTime() / 1000)}:f>`
    );

    const dmPayload = {
      components: [container],
      flags: MessageFlags.IsComponentsV2
    };

    // Try DM, fallback to thread mentioning moderators and inviter
    const discordGuildId = payload.discordGuildId || payload.guildDiscordId;
    if (!discordGuildId) {
      await user.send(dmPayload).catch(() => null);
      return true;
    }

    await sendDmOrFallback(client, discordGuildId, inviterUserId, dmPayload, {
      threadTitle: `Roster Invite Accepted — ${payload.guildName}`,
      reason: `Notify inviter ${inviterUserId} about acceptance of ${payload.acceptedUserId}`
    });

    return true;
  } catch (_) {
    return false; // Silently fail if DMs are closed or any error occurs
  }
}

module.exports = { notifyInviterOnAccept };

