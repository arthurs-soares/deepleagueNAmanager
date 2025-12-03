/**
 * /cooldown command - Cooldown management commands
 * Renamed from: managecooldown
 */
const {
  SlashCommandBuilder,
  PermissionFlagsBits
} = require('discord.js');
const { replyEphemeral } = require('../../utils/core/reply');
const {
  createErrorEmbed,
  createSuccessEmbed,
  createInfoEmbed
} = require('../../utils/embeds/embedBuilder');
const {
  isLeaderOrCoLeader,
  handleCheck,
  handleReset,
  handleSet,
  handleIncrease,
  handleDecrease,
} = require('../../utils/commands/manageCooldownService');
const LoggerService = require('../../services/LoggerService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('cooldown')
    .setDescription('Manage guild transition cooldowns for a user')
    .addSubcommand(sc => sc
      .setName('set')
      .setDescription('Set a specific cooldown duration for a user')
      .addUserOption(o =>
        o.setName('user').setDescription('Target user').setRequired(true)
      )
      .addStringOption(o =>
        o.setName('time').setDescription('Duration like 1d 2h 30m').setRequired(true)
      )
    )
    .addSubcommand(sc => sc
      .setName('increase')
      .setDescription('Add time to an existing cooldown for a user')
      .addUserOption(o =>
        o.setName('user').setDescription('Target user').setRequired(true)
      )
      .addStringOption(o =>
        o.setName('time').setDescription('Amount to add (e.g., 1h 30m)').setRequired(true)
      )
    )
    .addSubcommand(sc => sc
      .setName('decrease')
      .setDescription('Reduce time from an existing cooldown for a user')
      .addUserOption(o =>
        o.setName('user').setDescription('Target user').setRequired(true)
      )
      .addStringOption(o =>
        o.setName('time').setDescription('Amount to subtract (e.g., 30m)').setRequired(true)
      )
    )
    .addSubcommand(sc => sc
      .setName('reset')
      .setDescription('Clear any manual cooldown for a user')
      .addUserOption(o =>
        o.setName('user').setDescription('Target user').setRequired(true)
      )
    )
    .addSubcommand(sc => sc
      .setName('check')
      .setDescription('View current cooldown status for a user')
      .addUserOption(o =>
        o.setName('user').setDescription('Target user').setRequired(true)
      )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages),

  category: 'Admin',
  cooldown: 5,

  async execute(interaction) {
    try {
      const sub = interaction.options.getSubcommand(true);
      const target = interaction.options.getUser('user', true);

      const member = await interaction.guild.members.fetch(interaction.user.id);
      const isAdmin = member.permissions?.has(PermissionFlagsBits.Administrator);
      const isLeader = await isLeaderOrCoLeader(
        interaction.guild.id,
        interaction.user.id
      );

      if (!isAdmin && !isLeader) {
        const container = createErrorEmbed(
          'Permission denied',
          'Only guild leaders/co-leaders or server administrators can manage.'
        );
        return replyEphemeral(interaction, { components: [container] });
      }

      const discordGuildId = interaction.guild.id;

      if (sub === 'check') {
        const result = await handleCheck(discordGuildId, target.id);
        const container = result.success
          ? createInfoEmbed('Cooldown status', result.message)
          : createErrorEmbed('Error', result.message || 'Could not check.');
        return replyEphemeral(interaction, { components: [container] });
      }

      if (sub === 'reset') {
        const result = await handleReset(discordGuildId, target.id);
        const container = result.success
          ? createSuccessEmbed('Cooldown cleared', result.message)
          : createErrorEmbed('Error', result.message || 'Could not clear.');
        return replyEphemeral(interaction, { components: [container] });
      }

      const timeStr = interaction.options.getString('time', true);

      let result;
      if (sub === 'set') {
        result = await handleSet(discordGuildId, target.id, timeStr);
      } else if (sub === 'increase') {
        result = await handleIncrease(discordGuildId, target.id, timeStr);
      } else if (sub === 'decrease') {
        result = await handleDecrease(discordGuildId, target.id, timeStr);
      }

      const container = result?.success
        ? createSuccessEmbed('Cooldown updated', result.message)
        : createErrorEmbed(
          'Invalid time',
          result?.message || 'Use format like "1d 2h 30m", "45m", or "120s".'
        );

      return replyEphemeral(interaction, { components: [container] });
    } catch (error) {
      LoggerService.error('Error in /cooldown:', { error: error.message });
      return replyEphemeral(interaction, {
        content: '❌ An error occurred while managing cooldowns.'
      });
    }
  }
};
