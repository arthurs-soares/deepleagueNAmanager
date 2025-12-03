const { MessageFlags } = require('discord.js');
const { createWarningEmbed } = require('../embeds/embedBuilder');
const { sendDmOrFallback } = require('../dm/dmFallback');

/**
 * Notify the guild leader via DM that a member left the guild (English only)
 * Errors are swallowed (DMs may be disabled). Falls back to DM Warning thread.
 *
 * @param {import('discord.js').Client} client
 * @param {string} leaderUserId
 * @param {{ leaverUserId: string, leaverUsername?: string, guildName: string, roster: 'main'|'sub', when?: Date, discordGuildId?: string, guildDiscordId?: string }} payload
 */
async function notifyLeaderOnMemberLeave(client, leaderUserId, payload) {
  try {
    if (!client || !leaderUserId) return false;
    const user = await client.users.fetch(leaderUserId).catch(() => null);
    if (!user) return false;

    const when = payload.when || new Date();
    const rosterLabel = payload.roster === 'main' ? 'Main' : 'Sub';
    const username = payload.leaverUsername || `ID: ${payload.leaverUserId}`;

    const container = createWarningEmbed(
      'Member Left',
      `User <@${payload.leaverUserId}> (${username}) left the guild "${payload.guildName}".\n\n` +
      `**Guild:** ${payload.guildName}\n` +
      `**Roster:** ${rosterLabel}\n` +
      `**When:** <t:${Math.floor(when.getTime() / 1000)}:f>`
    );

    const dmPayload = {
      components: [container],
      flags: MessageFlags.IsComponentsV2
    };

    const discordGuildId = payload.discordGuildId || payload.guildDiscordId;
    if (!discordGuildId) {
      await user.send(dmPayload).catch(() => null);
      return true;
    }

    await sendDmOrFallback(client, discordGuildId, leaderUserId, dmPayload, {
      threadTitle: `Member Left — ${payload.guildName}`,
      reason: `Notify leader ${leaderUserId} about member ${payload.leaverUserId} leaving`
    });

    return true;
  } catch (_) {
    return false;
  }
}

module.exports = { notifyLeaderOnMemberLeave };

