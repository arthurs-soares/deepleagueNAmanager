const { MessageFlags } = require('discord.js');
const { isGuildAdmin } = require('../../../utils/core/permissions');
const { deleteBadge, getBadgeById } = require('../../../utils/badges/badgeService');
const { buildBadgePanel } = require('../../../utils/badges/badgePanel');
const LoggerService = require('../../../services/LoggerService');

/**
 * Confirm deletion
 * CustomId: config:badges:confirmDelete:<badgeId>:<yes|no>
 */
async function handle(interaction) {
  try {
    const { guild, customId } = interaction;
    const [, , , badgeId, decision] = customId.split(':');

    if (decision !== 'yes') {
      return interaction.reply({ content: 'Deletion cancelled.', ephemeral: true });
    }

    const member = await guild.members.fetch(interaction.user.id);
    const allowed = await isGuildAdmin(member, guild.id);
    if (!allowed) return interaction.reply({ content: '❌ You do not have permission.', ephemeral: true });

    const badge = await getBadgeById(badgeId);
    if (!badge || badge.discordGuildId !== guild.id) {
      return interaction.reply({ content: '❌ Badge not found.', ephemeral: true });
    }

    const res = await deleteBadge({ id: badgeId, discordGuildId: guild.id });
    if (!res.ok) return interaction.reply({ content: `❌ ${res.message}`, ephemeral: true });

    const { embed, rows } = await buildBadgePanel(guild);
    return interaction.reply({ content: '✅ Badge deleted.', components: [embed, ...rows], flags: MessageFlags.IsComponentsV2, ephemeral: true });
  } catch (error) {
    LoggerService.error('Error deleting badge:', error);
    const msg = { content: '❌ Could not delete the badge.', ephemeral: true };
    if (interaction.deferred || interaction.replied) return interaction.followUp(msg);
    return interaction.reply(msg);
  }
}

module.exports = { handle };

