const { AttachmentBuilder, MessageFlags } = require('discord.js');
const { ContainerBuilder, TextDisplayBuilder } = require('@discordjs/builders');
const { getOrCreateServerSettings } = require('../../utils/system/serverSettings');
const { colors } = require('../../config/botConfig');

/**
 * Fetch all messages from a text channel, newest to oldest, then return oldest->newest
 * Keeps within rate limits by paging 100 at a time
 * @param {import('discord.js').TextChannel} channel
 * @returns {Promise<import('discord.js').Message[]>}
 */
async function fetchAllMessages(channel) {
  const all = [];
  let lastId = undefined;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const batch = await channel.messages.fetch({ limit: 100, before: lastId }).catch(() => null);
    if (!batch || batch.size === 0) break;
    const arr = Array.from(batch.values());
    all.push(...arr);
    lastId = arr[arr.length - 1].id;
    if (batch.size < 100) break;
  }
  // Sort ascending by createdTimestamp
  all.sort((a, b) => a.createdTimestamp - b.createdTimestamp);
  return all;
}

/**
 * Build a plain-text transcript content for a list of messages
 * @param {import('discord.js').Message[]} messages
 * @returns {string}
 */
function buildTranscriptText(messages) {
  const lines = [];
  for (const m of messages) {
    const ts = new Date(m.createdTimestamp).toISOString();
    const author = `${m.author?.tag || m.author?.id || 'Unknown'} (${m.author?.id || 'unknown'})`;
    const base = m.content?.replace(/\r?\n/g, '\n') || '';
    const attach = m.attachments?.size ? ` [attachments: ${Array.from(m.attachments.values()).map(a => a.url).join(', ')}]` : '';
    const embeds = m.embeds?.length ? ` [embeds: ${m.embeds.length}]` : '';
    lines.push(`[${ts}] ${author}: ${base}${attach}${embeds}`.trim());
  }
  return lines.join('\n');
}

/**
 * Create an AttachmentBuilder for the channel transcript and an optional summary embed
 * @param {import('discord.js').TextChannel} channel
 * @param {string} reason
 * @param {Object} ticketMetadata - Optional ticket metadata (ticket document - can be GeneralTicket, War, or WagerTicket)
 */
async function createTranscriptAttachment(channel, reason = 'ticket transcript', ticketMetadata = null) {
  const msgs = await fetchAllMessages(channel);
  const content = buildTranscriptText(msgs);
  const fileName = `${channel.name}_transcript_${new Date().toISOString().replace(/[:.]/g, '-')}.txt`;
  const attachment = new AttachmentBuilder(Buffer.from(content, 'utf8'), { name: fileName });

  const info = new ContainerBuilder();
  const infoColor = typeof colors.info === 'string'
    ? parseInt(colors.info.replace('#', ''), 16)
    : colors.info;
  info.setAccentColor(infoColor);

  const titleText = new TextDisplayBuilder()
    .setContent('# Ticket Transcript');

  const descText = new TextDisplayBuilder()
    .setContent(`Channel: #${channel.name} (${channel.id})`);

  // Build details with enhanced metadata if available
  let detailsContent = `**Messages:** ${msgs.length}\n`;

  if (ticketMetadata) {
    // Detect ticket type based on fields
    const isGeneralTicket = ticketMetadata.ticketType !== undefined;
    const isWar = ticketMetadata.guildAId !== undefined;
    const isWager = ticketMetadata.initiatorUserId !== undefined && !isWar;

    if (isGeneralTicket) {
      // General Ticket metadata
      const ticketTypeDisplay = {
        admin: 'Admin Ticket',
        blacklist_appeal: 'Blacklist Appeal',
        general: 'General Ticket',
        roster: 'Roster Ticket'
      }[ticketMetadata.ticketType] || ticketMetadata.ticketType;

      detailsContent += `**Ticket Type:** ${ticketTypeDisplay}\n`;
      detailsContent += `**Creator:** <@${ticketMetadata.userId}> (${ticketMetadata.userId})\n`;

      // Extract support staff (excluding creator)
      const participantIds = new Set();
      for (const msg of msgs) {
        if (msg.author && !msg.author.bot && msg.author.id !== ticketMetadata.userId) {
          participantIds.add(msg.author.id);
        }
      }

      if (participantIds.size > 0) {
        const participantMentions = Array.from(participantIds).map(id => `<@${id}>`).join(', ');
        detailsContent += `**Support Staff:** ${participantMentions}\n`;
      }
    } else if (isWar) {
      // War metadata
      const Guild = require('../../models/guild/Guild');
      const [guildA, guildB] = await Promise.all([
        Guild.findById(ticketMetadata.guildAId).catch(() => null),
        Guild.findById(ticketMetadata.guildBId).catch(() => null)
      ]);

      detailsContent += `**War ID:** ${ticketMetadata._id}\n`;
      detailsContent += `**Guilds:** ${guildA?.name || 'Unknown'} vs ${guildB?.name || 'Unknown'}\n`;
      detailsContent += `**Scheduled:** <t:${Math.floor(ticketMetadata.scheduledAt.getTime() / 1000)}:F>\n`;

      // Extract support staff (all non-bot participants)
      const participantIds = new Set();
      for (const msg of msgs) {
        if (msg.author && !msg.author.bot) {
          participantIds.add(msg.author.id);
        }
      }

      if (participantIds.size > 0) {
        const participantMentions = Array.from(participantIds).map(id => `<@${id}>`).join(', ');
        detailsContent += `**Participants:** ${participantMentions}\n`;
      }
    } else if (isWager) {
      // Wager metadata
      const wagerType = ticketMetadata.isWar ? 'War Wager' : 'Regular Wager';
      detailsContent += `**Wager ID:** ${ticketMetadata._id}\n`;
      detailsContent += `**Type:** ${wagerType}\n`;
      detailsContent += `**Initiator:** <@${ticketMetadata.initiatorUserId}> (${ticketMetadata.initiatorUserId})\n`;
      detailsContent += `**Opponent:** <@${ticketMetadata.opponentUserId}> (${ticketMetadata.opponentUserId})\n`;

      // Extract support staff (excluding initiator and opponent)
      const participantIds = new Set();
      for (const msg of msgs) {
        if (msg.author && !msg.author.bot &&
            msg.author.id !== ticketMetadata.initiatorUserId &&
            msg.author.id !== ticketMetadata.opponentUserId) {
          participantIds.add(msg.author.id);
        }
      }

      if (participantIds.size > 0) {
        const participantMentions = Array.from(participantIds).map(id => `<@${id}>`).join(', ');
        detailsContent += `**Support Staff:** ${participantMentions}\n`;
      }
    }

    // Common fields for all ticket types
    if (ticketMetadata.createdAt) {
      detailsContent += `**Opened:** <t:${Math.floor(ticketMetadata.createdAt.getTime() / 1000)}:F>\n`;
    }
    if (ticketMetadata.closedAt) {
      detailsContent += `**Closed:** <t:${Math.floor(ticketMetadata.closedAt.getTime() / 1000)}:F>\n`;
    }
    if (ticketMetadata.closedByUserId) {
      detailsContent += `**Closed By:** <@${ticketMetadata.closedByUserId}> (${ticketMetadata.closedByUserId})\n`;
    }
  }

  detailsContent += `**Reason:** ${reason || 'ticket transcript'}`;

  const detailsText = new TextDisplayBuilder()
    .setContent(detailsContent);

  const timestampText = new TextDisplayBuilder()
    .setContent(`*<t:${Math.floor(Date.now() / 1000)}:F>*`);

  info.addTextDisplayComponents(titleText, descText, detailsText, timestampText);

  return { attachment, info };
}

/**
 * Send transcript to the configured logs channel. No-ops if logs channel is not set.
 * @param {import('discord.js').Guild} guild
 * @param {import('discord.js').TextChannel} ticketChannel
 * @param {string} reason
 * @param {Object} ticketMetadata - Optional ticket metadata (ticket document)
 */
async function sendTranscriptToLogs(guild, ticketChannel, reason, ticketMetadata = null) {
  try {
    if (!guild || !ticketChannel) return false;
    const settings = await getOrCreateServerSettings(guild.id);
    const logChannelId = settings?.logsChannelId;
    if (!logChannelId) return false;
    const logChannel = guild.channels.cache.get(logChannelId);
    if (!logChannel) return false;

    const { attachment, info } = await createTranscriptAttachment(ticketChannel, reason, ticketMetadata);

    // Send metadata embed (Components v2)
    await logChannel.send({
      components: [info],
      flags: MessageFlags.IsComponentsV2
    });

    // Send transcript file in a separate message (Components v2 doesn't support files in same message)
    await logChannel.send({
      files: [attachment]
    });

    return true;
  } catch (err) {
    console.error('Failed to send transcript to logs:', err);
    return false;
  }
}

module.exports = {
  fetchAllMessages,
  buildTranscriptText,
  createTranscriptAttachment,
  sendTranscriptToLogs,
};

