const { ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const { isGuildAdmin } = require('../../utils/core/permissions');
const { getBadgeById } = require('../../utils/badges/badgeService');

/**
 * Delete select: shows confirmation buttons
 * CustomId: config:badges:selectDelete
 */
async function handle(interaction) {
  try {
    const { guild, values } = interaction;
    const member = await guild.members.fetch(interaction.user.id);
    const allowed = await isGuildAdmin(member, guild.id);
    if (!allowed) return interaction.reply({ content: '\u274c You do not have permission.', flags: MessageFlags.Ephemeral });

    const id = values?.[0];
    const badge = await getBadgeById(id);
    if (!badge || badge.discordGuildId !== guild.id) {
      return interaction.reply({ content: '\u274c Badge not found.', flags: MessageFlags.Ephemeral });
    }

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`config:badges:confirmDelete:${badge._id}:yes`).setStyle(ButtonStyle.Danger).setLabel('Delete'),
      new ButtonBuilder().setCustomId(`config:badges:confirmDelete:${badge._id}:no`).setStyle(ButtonStyle.Secondary).setLabel('Cancel')
    );

    return interaction.reply({ content: `Are you sure you want to delete "${badge.name}"?`, components: [row], flags: MessageFlags.Ephemeral });
  } catch (error) {
    console.error('Error opening badge delete confirm:', error);
    const msg = { content: '\u274c Could not open the confirmation.', flags: MessageFlags.Ephemeral };
    if (interaction.deferred || interaction.replied) return interaction.followUp(msg);
    return interaction.reply(msg);
  }
}

module.exports = { handle };

