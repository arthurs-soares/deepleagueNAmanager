const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { syncRosterForum } = require('../../utils/roster/rosterForumSync');
const { countGuildsByDiscordGuildId } = require('../../utils/guilds/guildRepository');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('sync')
    .setDescription('Synchronize guild data with Discord (channels/roster posts)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  category: 'Admin',
  cooldown: 10,

  /**
   * Execute roster synchronization (forum)
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    try {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });

      // Ensure the forum is configured and update/generate posts
      await syncRosterForum(interaction.guild);

      // Count guilds via repository utility
      const count = await countGuildsByDiscordGuildId(interaction.guild.id);
      return interaction.editReply({ content: `✅ Synchronization completed. Guilds processed: ${count}.` });
    } catch (error) {
      console.error('Error in /sync command:', error);
      const msg = { content: '❌ An error occurred during synchronization.', flags: MessageFlags.Ephemeral };
      if (interaction.deferred || interaction.replied) return interaction.followUp(msg);
      return interaction.reply(msg);
    }
  }
};

