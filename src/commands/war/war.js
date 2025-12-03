/**
 * /war command - War management commands
 * Consolidates: log, edit, tickets
 */
const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags
} = require('discord.js');
const { ContainerBuilder, TextDisplayBuilder } = require('@discordjs/builders');
const { getOrCreateRoleConfig } = require('../../utils/misc/roleConfig');
const { listGuilds } = require('../../utils/guilds/guildManager');
const { setWarTicketsChannel } = require('../../utils/system/serverSettings');
const { colors, emojis } = require('../../config/botConfig');
const LoggerService = require('../../services/LoggerService');
const { handleWarLog } = require('../../services/warLog/warLogHandler');
const { handleEditLog } = require('../../services/warLog/editLogHandler');
const { warLogSessions } = require('../../services/warLog/sessionManager');
const {
  buildPreviewContainer,
  getRoundWinner,
  getOverallWinner
} = require('../../utils/war/warLogContainer');
const { buildRoundButtons } = require('../../utils/war/warLogButtons');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('war')
    .setDescription('War management commands')
    // Log subcommand
    .addSubcommand(sub =>
      sub.setName('log').setDescription('Log a war result')
        .addStringOption(o =>
          o.setName('guild_a').setDescription('First guild')
            .setAutocomplete(true).setRequired(true))
        .addStringOption(o =>
          o.setName('guild_b').setDescription('Second guild')
            .setAutocomplete(true).setRequired(true))
        .addStringOption(o =>
          o.setName('format').setDescription('Match format (e.g. 4v4, 5v5)')
            .setRequired(true)
            .addChoices(
              { name: '3v3', value: '3v3' },
              { name: '4v4', value: '4v4' },
              { name: '5v5', value: '5v5' }
            ))
        .addUserOption(o =>
          o.setName('mvp').setDescription('MVP of the war').setRequired(true))
        .addUserOption(o =>
          o.setName('honorable').setDescription('Honorable mention (optional)')))
    // Edit subcommand
    .addSubcommand(sub =>
      sub.setName('edit').setDescription('Edit an existing war log')
        .addStringOption(o =>
          o.setName('log_id').setDescription('War log ID or message ID')
            .setRequired(true)))
    // Tickets subcommand
    .addSubcommand(sub =>
      sub.setName('tickets')
        .setDescription('Set this channel as the war tickets channel')),

  category: 'War',
  cooldown: 5,
  warLogSessions,

  async autocomplete(interaction) {
    try {
      const focused = interaction.options.getFocused(true);
      if (focused.name !== 'guild_a' && focused.name !== 'guild_b') return;

      const query = String(focused.value || '').trim();
      const guilds = await listGuilds(interaction.guild.id);

      const choices = guilds
        .filter(g => !query || g.name.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 25)
        .map(g => ({ name: g.name, value: g.name }));

      await interaction.respond(choices);
    } catch (error) {
      LoggerService.error('Autocomplete error:', { error: error.message });
      try {
        if (!interaction.responded) await interaction.respond([]);
      } catch (_) {}
    }
  },

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    switch (subcommand) {
      case 'log':
        return this.handleLog(interaction);
      case 'edit':
        return this.handleEdit(interaction);
      case 'tickets':
        return this.handleTickets(interaction);
      default:
        return interaction.reply({
          content: '❌ Unknown subcommand.',
          flags: MessageFlags.Ephemeral
        });
    }
  },

  /**
   * Handle /war log
   */
  async handleLog(interaction) {
    try {
      const member = await interaction.guild.members.fetch(interaction.user.id);
      const cfg = await getOrCreateRoleConfig(interaction.guild.id);
      const hasHoster = cfg.hostersRoleIds?.some(id =>
        member.roles.cache.has(id)
      );

      if (!hasHoster) {
        return interaction.reply({
          content: '❌ Only hosters can use this command.',
          flags: MessageFlags.Ephemeral
        });
      }

      return handleWarLog(interaction);
    } catch (error) {
      LoggerService.error('Error in /war log:', { error: error.message });
      const msg = {
        content: '❌ An error occurred.',
        flags: MessageFlags.Ephemeral
      };
      if (interaction.deferred || interaction.replied) {
        return interaction.followUp(msg);
      }
      return interaction.reply(msg);
    }
  },

  /**
   * Handle /war edit
   */
  async handleEdit(interaction) {
    try {
      const member = await interaction.guild.members.fetch(interaction.user.id);
      const cfg = await getOrCreateRoleConfig(interaction.guild.id);
      const hasHoster = cfg.hostersRoleIds?.some(id =>
        member.roles.cache.has(id)
      );

      if (!hasHoster) {
        return interaction.reply({
          content: '❌ Only hosters can use this command.',
          flags: MessageFlags.Ephemeral
        });
      }

      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      return handleEditLog(interaction);
    } catch (error) {
      LoggerService.error('Error in /war edit:', { error: error.message });
      const msg = {
        content: '❌ An error occurred.',
        flags: MessageFlags.Ephemeral
      };
      if (interaction.deferred || interaction.replied) {
        return interaction.followUp(msg);
      }
      return interaction.reply(msg);
    }
  },

  /**
   * Handle /war tickets
   */
  async handleTickets(interaction) {
    try {
      const member = await interaction.guild.members.fetch(interaction.user.id);
      const isAdmin = member.permissions.has(PermissionFlagsBits.Administrator);

      if (!isAdmin) {
        return interaction.reply({
          content: '❌ Only administrators can use this command.',
          flags: MessageFlags.Ephemeral
        });
      }

      await setWarTicketsChannel(interaction.guild.id, interaction.channel.id);

      const container = new ContainerBuilder();
      const primaryColor = typeof colors.primary === 'string'
        ? parseInt(colors.primary.replace('#', ''), 16)
        : colors.primary;
      container.setAccentColor(primaryColor);

      const titleText = new TextDisplayBuilder()
        .setContent(`# ${emojis.war} War Tickets`);

      const descText = new TextDisplayBuilder()
        .setContent(`${emojis.info} To start a war, click the button below.`);

      const timestampText = new TextDisplayBuilder()
        .setContent(`*<t:${Math.floor(Date.now() / 1000)}:F>*`);

      container.addTextDisplayComponents(titleText, descText, timestampText);

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('war:start')
          .setStyle(ButtonStyle.Primary)
          .setLabel(`${emojis.war} Start War`)
      );

      await interaction.reply({
        components: [container, row],
        flags: MessageFlags.IsComponentsV2
      });
    } catch (error) {
      LoggerService.error('Error in /war tickets:', { error: error.message });
      const err = {
        content: '❌ Could not configure the channel.',
        flags: MessageFlags.Ephemeral
      };
      if (interaction.deferred || interaction.replied) {
        return interaction.followUp(err);
      }
      return interaction.reply(err);
    }
  }
};

// Re-export for button handlers
module.exports.buildPreviewContainer = buildPreviewContainer;
module.exports.buildRoundButtons = buildRoundButtons;
module.exports.getRoundWinner = getRoundWinner;
module.exports.getOverallWinner = getOverallWinner;
module.exports.warLogSessions = warLogSessions;
