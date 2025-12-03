const { MessageFlags } = require('discord.js');
const { ContainerBuilder, TextDisplayBuilder } = require('@discordjs/builders');
const { colors } = require('../../config/botConfig');
const { getOrCreateServerSettings } = require('../system/serverSettings');

// Basic log levels
const levels = { error: 0, warn: 1, info: 2, debug: 3 };
const envLevel = process.env.LOG_LEVEL;
const currentLevel = envLevel ? (levels[envLevel] ?? levels.info) : levels.info;

/**
 * Internal console log function with level filtering
 * @param {string} level - Log level
 * @param  {...any} args - Arguments to log
 */
function log(level, ...args) {
  const lvl = levels[level] ?? levels.info;
  if (lvl <= currentLevel) {
    // eslint-disable-next-line no-console
    console[level === 'debug' ? 'log' : level](...args);
  }
}

/**
 * Send log to configured guild logs channel
 * Attempts to send container with title and description
 * Silent on errors
 * @param {import('discord.js').Guild} guild
 * @param {string} title
 * @param {string} description
 */
async function sendLog(guild, title, description) {
  try {
    if (!guild) return;
    const settings = await getOrCreateServerSettings(guild.id);
    const channelId = settings.logsChannelId;
    if (!channelId) return;
    const channel = guild.channels.cache.get(channelId);
    if (!channel) return;

    const container = new ContainerBuilder();
    const infoColor = typeof colors.info === 'string'
      ? parseInt(colors.info.replace('#', ''), 16)
      : colors.info;
    container.setAccentColor(infoColor);

    const titleText = new TextDisplayBuilder()
      .setContent(`# ${title}`);

    const descText = new TextDisplayBuilder()
      .setContent(description);

    const timestampText = new TextDisplayBuilder()
      .setContent(`*<t:${Math.floor(Date.now() / 1000)}:F>*`);

    container.addTextDisplayComponents(titleText, descText, timestampText);

    // Fallback to plain text if channel doesn't support components v2
    // allowedMentions: { parse: [] } disables pings for logs
    try {
      await channel.send({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [] }
      });
    } catch (e) {
      await channel.send({
        content: `**${title}**\n${description}`,
        allowedMentions: { parse: [] }
      });
    }
  } catch (err) {
    log('debug', 'Failed to send log:', err?.message);
  }
}

module.exports = { sendLog, log };

