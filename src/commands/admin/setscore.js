const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { getOrCreateRoleConfig } = require('../../utils/misc/roleConfig');
const { listGuilds } = require('../../utils/guilds/guildManager');
const Guild = require('../../models/guild/Guild');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setscore')
    .setDescription('Set W/L score for a guild')
    .addStringOption(o => o.setName('name').setDescription('Guild name').setAutocomplete(true).setRequired(true))
    .addIntegerOption(o => o.setName('wins').setDescription('Wins').setRequired(true))
    .addIntegerOption(o => o.setName('losses').setDescription('Losses').setRequired(true)),

  category: 'Admin',
  cooldown: 3,

  /**
   * Autocomplete for the name field
   * @param {import('discord.js').AutocompleteInteraction} interaction
   */
  async autocomplete(interaction) {
    try {
      const focused = interaction.options.getFocused(true);
      if (focused.name !== 'name') return;
      const query = String(focused.value || '').trim();
      const guilds = await listGuilds(interaction.guild.id);
      const choices = guilds
        .filter(g => !query || g.name.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 25)
        .map(g => ({ name: g.name, value: g.name }));
      await interaction.respond(choices);
    } catch (error) {
      console.error('Error in /setscore autocomplete:', error);
      try {
        if (!interaction.responded) {
          await interaction.respond([]);
        }
      } catch (_) {}
    }
  },

  async execute(interaction) {
    try {
      const member = await interaction.guild.members.fetch(interaction.user.id);
      const cfg = await getOrCreateRoleConfig(interaction.guild.id);

      const hasAdmin = member.permissions.has(PermissionFlagsBits.Administrator);
      const hasMod = cfg.moderatorsRoleIds?.some(id => member.roles.cache.has(id));
      const hasHoster = cfg.hostersRoleIds?.some(id => member.roles.cache.has(id));

      if (!hasAdmin && !hasMod && !hasHoster) {
        return interaction.reply({ content: '❌ You do not have permission to use this command.', ephemeral: true });
      }

      const name = interaction.options.getString('name');
      const wins = interaction.options.getInteger('wins');
      const losses = interaction.options.getInteger('losses');

      if (wins < 0 || losses < 0) {
        return interaction.reply({ content: '⚠️ Values cannot be negative.', ephemeral: true });
      }

      const guildDoc = await Guild.findByName(name, interaction.guild.id);
      if (!guildDoc) {
        return interaction.reply({ content: '❌ Guild not found.', ephemeral: true });
      }

      guildDoc.wins = wins;
      guildDoc.losses = losses;
      await guildDoc.save();

      try {
        const { logGuildScoreUpdated } = require('../../utils/misc/logEvents');
        await logGuildScoreUpdated(guildDoc, wins, losses, interaction.guild, interaction.user.id);
      } catch (_) {}

      return interaction.reply({ content: `✅ Score updated for ${guildDoc.name}: ${wins}W/${losses}L.`, ephemeral: true });
    } catch (error) {
      console.error('Error in /setscore:', error);
      const msg = { content: '❌ Could not update the score.', ephemeral: true };
      if (interaction.deferred || interaction.replied) return interaction.followUp(msg);
      return interaction.reply(msg);
    }
  }
};

