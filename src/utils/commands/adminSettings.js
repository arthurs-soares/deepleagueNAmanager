/**
 * Admin settings handlers
 * Manages server-specific settings like hostping toggle
 */
const { MessageFlags } = require('discord.js');
const { ContainerBuilder, TextDisplayBuilder } = require('@discordjs/builders');
const { getOrCreateServerSettings } = require('../system/serverSettings');
const { colors, emojis } = require('../../config/botConfig');
const LoggerService = require('../../services/LoggerService');

/**
 * Handle /admin settings hostping
 * @param {ChatInputCommandInteraction} interaction - Interaction
 * @returns {Promise<void>}
 */
async function hostping(interaction) {
  try {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const status = interaction.options.getString('status', true);
    const enabled = status === 'enabled';

    const settings = await getOrCreateServerSettings(interaction.guild.id);
    settings.hosterPingEnabled = enabled;
    await settings.save();

    const container = new ContainerBuilder();
    const primaryColor = typeof colors.primary === 'string'
      ? parseInt(colors.primary.replace('#', ''), 16)
      : colors.primary;
    container.setAccentColor(primaryColor);

    const statusEmoji = enabled ? emojis.success : emojis.error;
    const statusText = enabled ? 'Enabled' : 'Disabled';

    const titleText = new TextDisplayBuilder()
      .setContent(`# ${emojis.settings || '⚙️'} Hoster Ping Setting`);

    const descText = new TextDisplayBuilder()
      .setContent(
        `${statusEmoji} Hoster pings on war/wager acceptance: **${statusText}**\n\n` +
        `When ${enabled ? 'enabled' : 'disabled'}, hosters will ` +
        `${enabled ? 'be mentioned' : '**not** be mentioned'} when a war or wager is accepted.`
      );

    container.addTextDisplayComponents(titleText, descText);

    LoggerService.info('Hoster ping setting updated', {
      guildId: interaction.guild.id,
      enabled,
      userId: interaction.user.id
    });

    return interaction.editReply({
      components: [container],
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
    });
  } catch (error) {
    LoggerService.error('Error in /admin settings hostping:', {
      error: error?.message
    });
    return interaction.editReply({
      content: '❌ An error occurred while updating the setting.'
    });
  }
}

module.exports = { hostping };
