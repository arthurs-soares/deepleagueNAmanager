const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const { isGuildAdmin } = require('../../../utils/core/permissions');
const { replyEphemeral } = require('../../../utils/core/reply');

/**
 * Opens modal to create a badge
 * CustomIds: config:badges:user | config:badges:guild
 */
async function handle(interaction) {
  try {
    const { guild } = interaction;

    // Permission check
    const member = await guild.members.fetch(interaction.user.id);
    const allowed = await isGuildAdmin(member, guild.id);
    if (!allowed) {
      return replyEphemeral(interaction, { content: '❌ You do not have permission to create badges.' });
    }

    const isUser = interaction.customId.endsWith(':user');
    const category = isUser ? 'user' : 'guild';

    const modal = new ModalBuilder()
      .setCustomId(`config:badges:create:${category}`)
      .setTitle(isUser ? 'Create User Badge' : 'Create Guild Badge');

    const name = new TextInputBuilder()
      .setCustomId('name')
      .setLabel('NAME')
      .setStyle(TextInputStyle.Short)
      .setMaxLength(32)
      .setRequired(true);

    const emoji = new TextInputBuilder()
      .setCustomId('emoji')
      .setLabel('EMOJI (custom emoji: <:name:id>)')
      .setStyle(TextInputStyle.Short)
      .setMaxLength(100)
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder().addComponents(name),
      new ActionRowBuilder().addComponents(emoji)
    );

    return interaction.showModal(modal);
  } catch (error) {
    console.error('Error opening badge create modal:', error);
    return replyEphemeral(interaction, { content: '❌ Could not open the modal.' });
  }
}

module.exports = { handle };

