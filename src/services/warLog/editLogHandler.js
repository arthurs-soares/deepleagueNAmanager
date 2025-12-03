/**
 * Edit Log Handler
 * Handles the /log edit subcommand
 */
const { MessageFlags } = require('discord.js');
const WarLog = require('../../models/war/WarLog');
const { getOrCreateServerSettings } = require('../../utils/system/serverSettings');
const { generateSessionId, setSession, isValidObjectId } = require('./sessionManager');
const { buildPreviewContainer } = require('../../utils/war/warLogContainer');
const { buildRoundButtons } = require('../../utils/war/warLogButtons');

/**
 * Find war log by ID
 * @param {string} guildId - Discord guild ID
 * @param {string} logId - War log ID or message ID
 * @returns {Promise<Object|null>} War log document or null
 */
async function findWarLog(guildId, logId) {
  return WarLog.findOne({
    discordGuildId: guildId,
    $or: [
      { messageId: logId },
      { _id: isValidObjectId(logId) ? logId : null }
    ]
  });
}

/**
 * Create session data from war log
 * @param {Object} warLog - War log document
 * @returns {Object} Session data object
 */
function createSessionData(warLog) {
  return {
    guildA: warLog.guildA,
    guildB: warLog.guildB,
    format: warLog.format,
    mvpId: warLog.mvpId,
    honorableId: warLog.honorableId || '',
    rounds: warLog.rounds.map(r => ({
      deathsA: r.deathsA,
      deathsB: r.deathsB,
      clip: r.clip
    })),
    createdAt: Date.now(),
    isEdit: true,
    originalLogId: warLog._id.toString(),
    messageId: warLog.messageId,
    channelId: warLog.channelId
  };
}

/**
 * Handle edit log subcommand
 * Note: interaction must already be deferred
 * @param {ChatInputCommandInteraction} interaction - Discord interaction
 */
async function handleEditLog(interaction) {
  const logId = interaction.options.getString('log_id').trim();
  const warLog = await findWarLog(interaction.guild.id, logId);

  if (!warLog) {
    return interaction.editReply({
      content: '❌ War log not found. Check the ID and try again.'
    });
  }

  const settings = await getOrCreateServerSettings(interaction.guild.id);
  const channel = interaction.guild.channels.cache.get(settings.warLogsChannelId);

  if (!channel) {
    return interaction.editReply({
      content: '❌ War logs channel not configured or inaccessible.'
    });
  }

  try {
    await channel.messages.fetch(warLog.messageId);
  } catch {
    return interaction.editReply({
      content: '❌ Original message not found. It may have been deleted.'
    });
  }

  const sessionId = generateSessionId();
  const sessionData = createSessionData(warLog);
  setSession(sessionId, sessionData);

  const header = `📝 Editing war log \`${warLog._id}\``;
  const container = buildPreviewContainer(sessionData, header);
  const buttonRows = buildRoundButtons(sessionId, sessionData.rounds.length, true);

  return interaction.editReply({
    components: [container, ...buttonRows],
    flags: MessageFlags.IsComponentsV2
  });
}

module.exports = { handleEditLog };
