const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const { isGuildAdmin } = require('../../utils/core/permissions');
const { getBadgeById, emojiCodeFor } = require('../../utils/badges/badgeService');

/**
 * Edit select: opens prefilled modal
 * CustomId: config:badges:selectEdit
 */
async function handle(interaction) {
  try {
    const { guild, values } = interaction;
    const member = await guild.members.fetch(interaction.user.id);
    const allowed = await isGuildAdmin(member, guild.id);
    if (!allowed) return interaction.reply({ content: '❌ You do not have permission.', ephemeral: true });

    const id = values?.[0];
    const badge = await getBadgeById(id);
    if (!badge || badge.discordGuildId !== guild.id) {
      return interaction.reply({ content: '❌ Badge not found.', ephemeral: true });
    }

    const modal = new ModalBuilder()
      .setCustomId(`config:badges:update:${badge._id}`)
      .setTitle('Edit Badge');

    const name = new TextInputBuilder()
      .setCustomId('name')
      .setLabel('NAME')
      .setStyle(TextInputStyle.Short)
      .setMaxLength(32)
      .setRequired(true)
      .setValue(badge.name);

    const emoji = new TextInputBuilder()
      .setCustomId('emoji')
      .setLabel('EMOJI (e.g., <:name:id>)')
      .setStyle(TextInputStyle.Short)
      .setMaxLength(100)
      .setRequired(true)
      .setValue(emojiCodeFor(badge));

    modal.addComponents(new ActionRowBuilder().addComponents(name), new ActionRowBuilder().addComponents(emoji));

    return interaction.showModal(modal);
  } catch (error) {
    console.error('Error opening badge edit modal:', error);
    const msg = { content: '❌ Could not open the edit modal.', ephemeral: true };
    if (interaction.deferred || interaction.replied) return interaction.followUp(msg);
    return interaction.reply(msg);
  }
}

module.exports = { handle };

