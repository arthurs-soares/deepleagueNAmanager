/**
 * /log command - Log match results
 * Thin command handler that delegates to service modules
 */
const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { getOrCreateRoleConfig } = require('../../utils/misc/roleConfig');
const { listGuilds } = require('../../utils/guilds/guildManager');
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
    .setName('log')
    .setDescription('Log match results')
    .addSubcommand(sub =>
      sub.setName('war').setDescription('Log a war result')
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
    .addSubcommand(sub =>
      sub.setName('edit').setDescription('Edit an existing war log')
        .addStringOption(o =>
          o.setName('log_id').setDescription('War log ID or message ID')
            .setRequired(true))),

  category: 'Admin',
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
      } catch (_) { /* ignore */ }
    }
  },

  async execute(interaction) {
    try {
      const member = await interaction.guild.members.fetch(interaction.user.id);
      const cfg = await getOrCreateRoleConfig(interaction.guild.id);
      const hasHoster = cfg.hostersRoleIds?.some(id => member.roles.cache.has(id));

      if (!hasHoster) {
        return interaction.reply({
          content: '`[U+274C]` Only hosters can use this command.',
          flags: MessageFlags.Ephemeral
        });
      }

      const subcommand = interaction.options.getSubcommand();
      if (subcommand === 'war') return handleWarLog(interaction);
      if (subcommand === 'edit') {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        return handleEditLog(interaction);
      }
    } catch (error) {
      LoggerService.error('Error in /log:', { error: error.message });
      const msg = {
        content: '`[U+274C]` An error occurred.',
        flags: MessageFlags.Ephemeral
      };
      if (interaction.deferred || interaction.replied) {
        return interaction.followUp(msg);
      }
      return interaction.reply(msg);
    }
  }
};

// Re-export for button handlers
module.exports.buildPreviewContainer = buildPreviewContainer;
module.exports.buildRoundButtons = buildRoundButtons;
module.exports.getRoundWinner = getRoundWinner;
module.exports.getOverallWinner = getOverallWinner;
module.exports.warLogSessions = warLogSessions;
