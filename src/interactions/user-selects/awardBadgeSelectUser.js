const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, MessageFlags } = require('discord.js');
const { getBadgeById } = require('../../utils/badges/badgeService');

/**
 * After selecting a user, open reason modal
 * CustomId: awardBadge:selectUser:<badgeId>
 */
async function handle(interaction) {
  try {
    const [, , badgeId] = interaction.customId.split(':');
    const userId = interaction.values?.[0];
    const badge = await getBadgeById(badgeId);
    if (!badge || badge.discordGuildId !== interaction.guild.id) {
      return interaction.reply({ content: '\u274c Badge not found.', flags: MessageFlags.Ephemeral });
    }

    const modal = new ModalBuilder()
      .setCustomId(`awardBadge:reason:user:${badge._id}:${userId}`)
      .setTitle('Add optional note (or leave blank)');

    const note = new TextInputBuilder()
      .setCustomId('note')
      .setLabel('Reason/Note (optional)')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(false)
      .setMaxLength(500);

    modal.addComponents(new ActionRowBuilder().addComponents(note));
    return interaction.showModal(modal);
  } catch (error) {
    console.error('Error preparing user award modal:', error);
    const msg = { content: '\u274c Could not open the note form.', flags: MessageFlags.Ephemeral };
    if (interaction.deferred || interaction.replied) return interaction.followUp(msg);
    return interaction.reply(msg);
  }
}

module.exports = { handle };

