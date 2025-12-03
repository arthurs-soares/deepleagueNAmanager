const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { registerGuild } = require('../../utils/guilds/guildManager');
const { createSuccessEmbed, createErrorEmbed } = require('../../utils/embeds/embedBuilder');
const { validateRegisterInputs, buildGuildRegistrationData, postRegistration } = require('../../utils/commands/registerFlow');
const { ensureAdminOrReply } = require('../../utils/commands/permissionGuards');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('register')
    .setDescription('Register a new guild (admins and moderators configured in /config)')
    .addStringOption(option =>
      option.setName('name')
        .setDescription('Guild name')
        .setRequired(true)
        .setMaxLength(100)
    )
    .addUserOption(option =>
      option.setName('leader')
        .setDescription('Select the guild leader')
        .setRequired(true)
    ),

  category: 'Administration',
  cooldown: 10,

  /**
   * Execute the guild registration command
   * @param {ChatInputCommandInteraction} interaction - Slash command interaction
   */
  async execute(interaction) {
    // Permission guard
    if (!(await ensureAdminOrReply(interaction))) return;
    // Defer response for operations that may take time
    await interaction.deferReply();

    try {
      // Validate inputs
      const validation = validateRegisterInputs(interaction);
      if (!validation.ok) {
        return interaction.editReply({ components: [validation.container], flags: MessageFlags.IsComponentsV2 });
      }

      // Build guild payload and register
      const guildData = buildGuildRegistrationData(interaction);
      const result = await registerGuild(guildData);

      const container = result.success
        ? createSuccessEmbed('Guild Registered', `**Name:** ${result.guild.name}\n**Leader:** ${result.guild.leader}\n**Registered by:** <@${interaction.user.id}>\n**Date:** <t:${Math.floor(result.guild.createdAt.getTime() / 1000)}:F>`)
        : createErrorEmbed('Registration Error', result.message);

      await interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2 });
      if (result.success) await postRegistration(interaction, result.guild, guildData.leaderId);
    } catch (error) {
      console.error('Error in register command:', error);
      const container = createErrorEmbed('Internal Error', 'An internal error occurred while processing the guild registration.');
      await interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2 });
    }
  }
};
