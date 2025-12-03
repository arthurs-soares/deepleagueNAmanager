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
      detailsContent += `**Creator:** ${ticketMetadata.userId}\n`;

      // Extract support staff (excluding creator)
      const participantIds = new Set();
      for (const msg of msgs) {
        if (msg.author && !msg.author.bot && msg.author.id !== ticketMetadata.userId) {
          participantIds.add(msg.author.id);
        }
      }

      if (participantIds.size > 0) {
        const participantList = Array.from(participantIds).join(', ');
        detailsContent += `**Support Staff:** ${participantList}\n`;
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
        const participantList = Array.from(participantIds).join(', ');
        detailsContent += `**Participants:** ${participantList}\n`;
      }
    } else if (isWager) {
      // Wager metadata
      const wagerType = ticketMetadata.isWar ? 'War Wager' : 'Regular Wager';
      detailsContent += `**Wager ID:** ${ticketMetadata._id}\n`;
      detailsContent += `**Type:** ${wagerType}\n`;
      detailsContent += `**Initiator:** ${ticketMetadata.initiatorUserId}\n`;
      detailsContent += `**Opponent:** ${ticketMetadata.opponentUserId}\n`;

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
        const participantList = Array.from(participantIds).join(', ');
        detailsContent += `**Support Staff:** ${participantList}\n`;
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
      detailsContent += `**Closed By:** ${ticketMetadata.closedByUserId}\n`;
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
 * Send transcript to the appropriate transcript channel based on ticket type.
 * Falls back to logs channel if no specific transcript channel is configured.
 * @param {import('discord.js').Guild} guild
 * @param {import('discord.js').TextChannel} ticketChannel
 * @param {string} reason
 * @param {Object} ticketMetadata - Optional ticket metadata (ticket document)
 * @param {'war'|'wager'|'general'} ticketType - Optional explicit ticket type override
 */
async function sendTranscriptToLogs(guild, ticketChannel, reason, ticketMetadata = null, ticketType = null) {
  try {
    if (!guild || !ticketChannel) return false;
    const settings = await getOrCreateServerSettings(guild.id);

    // Determine ticket type from metadata if not explicitly provided
    let resolvedTicketType = ticketType;
    if (!resolvedTicketType && ticketMetadata) {
      const isGeneralTicket = ticketMetadata.ticketType !== undefined;
      const isWar = ticketMetadata.guildAId !== undefined;
      const isWager = ticketMetadata.initiatorUserId !== undefined && !isWar;

      if (isGeneralTicket) resolvedTicketType = 'general';
      else if (isWar) resolvedTicketType = 'war';
      else if (isWager) resolvedTicketType = 'wager';
    }

    // Get the appropriate transcript channel based on ticket type
    let transcriptChannelId = null;
    switch (resolvedTicketType) {
      case 'war':
        transcriptChannelId = settings?.warTranscriptsChannelId;
        break;
      case 'wager':
        transcriptChannelId = settings?.wagerTranscriptsChannelId;
        break;
      case 'general':
        transcriptChannelId = settings?.generalTranscriptsChannelId;
        break;
    }

    // Fallback to logs channel if no specific transcript channel is configured
    if (!transcriptChannelId) {
      transcriptChannelId = settings?.logsChannelId;
    }

    if (!transcriptChannelId) return false;
    const transcriptChannel = guild.channels.cache.get(transcriptChannelId);
    if (!transcriptChannel) return false;

    const { attachment, info } = await createTranscriptAttachment(ticketChannel, reason, ticketMetadata);

    // Send metadata embed (Components v2)
    await transcriptChannel.send({
      components: [info],
      flags: MessageFlags.IsComponentsV2
    });

    // Send transcript file in a separate message (Components v2 doesn't support files in same message)
    await transcriptChannel.send({
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

