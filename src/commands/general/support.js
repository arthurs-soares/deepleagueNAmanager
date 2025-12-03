const { SlashCommandBuilder } = require('discord.js');
const { createSuccessEmbed } = require('../../utils/embeds/embedBuilder');
const { sendDmOrFallback } = require('../../utils/dm/dmFallback');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('support')
    .setDescription('Start a conversation with moderation (non-anonymous via DM)'),

  category: 'General',
  cooldown: 10,

  async execute(interaction) {
    const container = createSuccessEmbed('Support', 'Open your DM and talk with moderation. You will receive responses here privately. Avoid sending sensitive information in public channels.');
    try {
      await interaction.user.send({ content: '📩 Hello! Send your message here to talk with moderation. If a ticket is already open, your message will be linked to it.', embeds: [] });
    } catch (_) {
      // Fallback: create a private thread mentioning moderators and the user
      try {
        await sendDmOrFallback(
          interaction.client,
          interaction.guild.id,
          interaction.user.id,
          { content: '📩 Hello! Send your message here to talk with moderation. If a ticket is already open, your message will be linked to it.' },
          { threadTitle: `Support DM Fallback — ${interaction.user.tag}`, includeSupportCloseButton: true }
        );
      } catch (_) {}
    }
    const { MessageFlags } = require('discord.js');
    return interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
  }
};

