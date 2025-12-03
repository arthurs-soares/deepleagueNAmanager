const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { createSuccessEmbed, createErrorEmbed } = require('../../utils/embeds/embedBuilder');
const { auditAdminAction } = require('../../utils/misc/adminAudit');
const { isModeratorOrHoster } = require('../../utils/core/permissions');
const UserProfile = require('../../models/user/UserProfile');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('resetuserratings')
    .setDescription('Reset all users\' general and wager ELO to 800 (admins/moderators only)')
    .addBooleanOption(opt =>
      opt.setName('confirm')
        .setDescription('Type true to confirm the global reset')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  category: 'Admin',
  cooldown: 3,

  async execute(interaction) {
    try {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });

      const member = await interaction.guild.members.fetch(interaction.user.id);
      const allowed = await isModeratorOrHoster(member, interaction.guild.id);
      if (!allowed) {
        const container = createErrorEmbed('Permission denied', 'Only administrators, moderators or hosters can use this command.');
        return interaction.editReply({
          components: [container],
          flags: MessageFlags.IsComponentsV2
        });
      }

      const confirm = interaction.options.getBoolean('confirm');
      if (!confirm) {
        const container = createErrorEmbed('Confirmation required', 'Pass confirm=true to proceed. This will reset ALL users\' ratings.');
        return interaction.editReply({
          components: [container],
          flags: MessageFlags.IsComponentsV2
        });
      }

      const res = await UserProfile.updateMany({}, {
        $set: { elo: 800, peakElo: 800, wagerElo: 800, wagerPeakElo: 800 }
      });

      try {
        await auditAdminAction(interaction.guild, interaction.user.id, 'Reset User Ratings', {
          modifiedCount: res?.modifiedCount || 0
        });
      } catch (_) {}

      const container = createSuccessEmbed('User ratings reset', `Updated ratings to 800 for ${res?.modifiedCount || 0} users.`);
      return interaction.editReply({
        components: [container],
        flags: MessageFlags.IsComponentsV2
      });
    } catch (error) {
      const container = createErrorEmbed('Error', error?.message || 'Could not reset user ratings.');
      if (interaction.deferred || interaction.replied) {
        return interaction.followUp({
          components: [container],
          flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2
        });
      }
      return interaction.reply({
        components: [container],
        flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2
      });
    }
  }
};

