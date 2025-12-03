const { getOrCreateServerSettings } = require('../../utils/system/serverSettings');
const { sendWarTicketsPanel } = require('../../utils/war/warTicketsPanel');
const { MessageFlags } = require('discord.js');

/**
 * Receive channel selection for war tickets, save and send the panel
 * CustomId: config:channels:selectWarTickets
 */
async function handle(interaction) {
  try {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const channelId = interaction.values?.[0];
    if (!channelId) return interaction.editReply({ content: 'Action cancelled.' });

    const cfg = await getOrCreateServerSettings(interaction.guild.id);
    cfg.warTicketsChannelId = channelId;
    await cfg.save();

    // Try to automatically send the panel to the selected channel
    try {
      const channel = interaction.guild.channels.cache.get(channelId);
      if (channel) await sendWarTicketsPanel(channel);
    } catch (err) {
      console.warn('Failed to send tickets panel:', err?.message);
    }

    return interaction.editReply({ content: `✅ War tickets channel set to <#${channelId}>.` });
  } catch (error) {
    console.error('Error saving war tickets channel:', error);
    const msg = { content: '❌ Could not save the war tickets channel.', flags: MessageFlags.Ephemeral };
    if (interaction.deferred || interaction.replied) return interaction.followUp(msg);
    return interaction.reply(msg);
  }
}

module.exports = { handle };

