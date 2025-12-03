const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { replyEphemeral } = require('../../utils/core/reply');
const { listGuilds, findGuildByName, deleteGuild } = require('../../utils/guilds/guildManager');
const { createErrorEmbed, createSuccessEmbed, createInfoEmbed } = require('../../utils/embeds/embedBuilder');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('delete')
    .setDescription('Delete a guild from the database (administrators only)')
    .addStringOption(opt =>
      opt.setName('guild')
        .setDescription('Name of the guild to be deleted')
        .setAutocomplete(true)
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  category: 'Admin',
  cooldown: 5,

  async autocomplete(interaction) {
    try {
      const focused = interaction.options.getFocused(true);
      if (focused.name !== 'guild') return;
      const query = String(focused.value || '').trim().toLowerCase();
      const guilds = await listGuilds(interaction.guild.id);
      const choices = guilds
        .filter(g => !query || g.name.toLowerCase().includes(query))
        .slice(0, 25)
        .map(g => ({ name: g.name, value: g.name }));
      await interaction.respond(choices);
    } catch (error) {
      console.error('Error in /delete autocomplete:', error);
      try {
        if (!interaction.responded) {
          await interaction.respond([]);
        }
      } catch (_) {}
    }
  },

  async execute(interaction) {
    try {
      const name = interaction.options.getString('guild', true);

      // Simple confirmation via ephemeral follow-up
      await replyEphemeral(interaction, {
        content: `\u26A0\uFE0F Confirm the permanent deletion of guild "${name}"? Reply with "yes" within 15 seconds.`,
      });
      // Collect response from the same user in the same channel
      const filter = m => m.author.id === interaction.user.id;
      const collector = interaction.channel.createMessageCollector({ filter, time: 15_000, max: 1 });

      collector.on('collect', async (m) => {
        // Delete the user's confirmation message
        try {
          await m.delete();
        } catch (error) {
          console.error('Error deleting confirmation message:', error);
        }

        if (m.content.toLowerCase() !== 'yes') {
          return replyEphemeral(interaction, { content: 'Operation cancelled.' });
        }

        // Find guild
        const target = await findGuildByName(name, interaction.guild.id);
        if (!target) {
          const container = createInfoEmbed('Not found', 'No guild with that name was found.');
          return replyEphemeral(interaction, { components: [container] });
        }

        const result = await deleteGuild(target._id, interaction.client);
        if (!result.success) {
          const container = createErrorEmbed('Failed to delete', result.message || 'Error deleting the guild.');
          return replyEphemeral(interaction, { components: [container] });
        }

        const container = createSuccessEmbed('Guild deleted', result.message);
        return replyEphemeral(interaction, { components: [container] });
      });

      collector.on('end', (collected) => {
        if (collected.size === 0) {
          replyEphemeral(interaction, { content: 'Time expired. No action taken.' });
        }
      });

    } catch (error) {
      console.error('Error in /delete command:', error);
      return replyEphemeral(interaction, { content: '❌ An error occurred while trying to delete the guild.' });
    }
  }
};

