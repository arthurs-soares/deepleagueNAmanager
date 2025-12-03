const { getOrCreateServerSettings } = require('../../utils/system/serverSettings');
const { MessageFlags } = require('discord.js');

/**
 * Save General Tickets Category selection
 * CustomId: config:channels:selectGeneralTicketsCategory
 */
async function handle(interaction) {
  try {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const channelId = interaction.values?.[0];
    if (!channelId) return interaction.editReply({ content: 'Action cancelled.' });

    const cfg = await getOrCreateServerSettings(interaction.guild.id);
    cfg.generalTicketsCategoryId = channelId;
    await cfg.save();

    return interaction.editReply({ content: `✅ General tickets category set to <#${channelId}>` });
  } catch (error) {
    console.error('Error setting general tickets category:', error);
    const msg = { content: '❌ Could not set the general tickets category.', flags: MessageFlags.Ephemeral };
    if (interaction.deferred || interaction.replied) return interaction.followUp(msg);
    return interaction.reply(msg);
  }
}

module.exports = { handle };

