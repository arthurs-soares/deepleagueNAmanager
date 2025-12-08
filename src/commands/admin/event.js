const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  MessageFlags
} = require('discord.js');
const {
  handleAddPoints,
  handleRemovePoints
} = require('../../utils/rewards/eventPointsHandler');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('event')
    .setDescription('Manage event points')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
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
