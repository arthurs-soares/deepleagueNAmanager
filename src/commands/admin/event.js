const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  MessageFlags
} = require('discord.js');
const {
  handleAddPoints,
  handleRemovePoints
} = require('../../utils/rewards/eventPointsHandler');
const { isGuildAdmin } = require('../../utils/core/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('event')
    .setDescription('Manage event points')
    .addSubcommandGroup(group =>
      group
        .setName('point')
        .setDescription('Manage user event points')
        .addSubcommand(sub =>
          sub.setName('add')
            .setDescription('Add event points to a user')
            .addUserOption(opt =>
              opt.setName('user')
                .setDescription('User to add points to')
                .setRequired(true))
            .addIntegerOption(opt =>
              opt.setName('amount')
                .setDescription('Amount of points to add')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(1000000))
            .addStringOption(opt =>
              opt.setName('reason')
                .setDescription('Reason for adding points')
                .setRequired(false)))
        .addSubcommand(sub =>
          sub.setName('remove')
            .setDescription('Remove event points from a user')
            .addUserOption(opt =>
              opt.setName('user')
                .setDescription('User to remove points from')
                .setRequired(true))
            .addIntegerOption(opt =>
              opt.setName('amount')
                .setDescription('Amount of points to remove')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(1000000))
            .addStringOption(opt =>
              opt.setName('reason')
                .setDescription('Reason for removing points')
                .setRequired(false)))),

  category: 'Admin',
  cooldown: 3,

  async execute(interaction) {
    // Check permissions: Manage Guild OR Configured Moderator
    const hasPerms = interaction.member.permissions.has(PermissionFlagsBits.ManageGuild) ||
      await isGuildAdmin(interaction.member, interaction.guild.id);

    if (!hasPerms) {
      return interaction.reply({
        content: '❌ You do not have permission to use this command.',
        flags: MessageFlags.Ephemeral
      });
    }

    const group = interaction.options.getSubcommandGroup();
    const subcommand = interaction.options.getSubcommand();

    if (group === 'point') {
      if (subcommand === 'add') return handleAddPoints(interaction);
      if (subcommand === 'remove') return handleRemovePoints(interaction);
    }

    return interaction.reply({
      content: '❌ Unknown subcommand.',
      flags: MessageFlags.Ephemeral
    });
  }
};
