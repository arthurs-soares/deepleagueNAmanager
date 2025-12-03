const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { buildUserProfileDisplayComponents } = require('../../utils/embeds/profileEmbed');



module.exports = {
  data: new SlashCommandBuilder()
    .setName('profile')
    .setDescription('Display a user profile')
    .addUserOption(opt =>
      opt.setName('user').setDescription('User to view').setRequired(false)
    ),

  category: 'General',
  cooldown: 3,

  async execute(interaction) {
    const target = interaction.options.getUser('user') || interaction.user;
    const { container, components } = await buildUserProfileDisplayComponents(
      interaction.guild,
      interaction.user,
      target
    );
    await interaction.reply({
      components: [container, ...components],
      flags: MessageFlags.IsComponentsV2
    });
  }
};

