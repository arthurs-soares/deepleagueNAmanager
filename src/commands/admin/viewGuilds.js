const { SlashCommandBuilder } = require('discord.js');
const { handleViewDetails, handleViewList } = require('../../utils/commands/viewGuildsFlow');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('view')
    .setDescription('View guilds or details of a guild')
    .addStringOption(opt =>
      opt
        .setName('name')
        .setDescription('Guild name to view details')
        .setAutocomplete(true)
        .setRequired(false)
    ),

  category: 'General',
  cooldown: 5,

  /**
   * Autocomplete for the name parameter
   * @param {import('discord.js').AutocompleteInteraction} interaction
   */
  async autocomplete(interaction) {
    try {
      const focused = interaction.options.getFocused(true);
      if (focused.name !== 'name') return;
      const query = String(focused.value || '').trim();
      const { listGuilds } = require('../../utils/guilds/guildManager');
      const guilds = await listGuilds(interaction.guild.id);
      const choices = guilds
        .filter(g => !query || g.name.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 25)
        .map(g => ({ name: g.name, value: g.name }));
      await interaction.respond(choices);
    } catch (error) {
      console.error('Error in /view autocomplete:', error);
      try { if (!interaction.responded) await interaction.respond([]); } catch (_) {}
    }
  },

  /**
   * Executes the visualization/pagination command
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    await interaction.deferReply();
    try {
      const requestedName = interaction.options.getString('name');
      if (requestedName) return handleViewDetails(interaction, requestedName);
      return handleViewList(interaction);
    } catch (error) {
      console.error('Error in view command:', error);
      const { createErrorEmbed } = require('../../utils/embeds/embedBuilder');
      const { MessageFlags } = require('discord.js');
      const container = createErrorEmbed('Internal Error', 'An error occurred while fetching registered guilds.');
      await interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2 });
    }
  }
};

