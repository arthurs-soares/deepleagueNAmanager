const { setDmWarningChannel } = require('../../utils/system/serverSettings');
const { MessageFlags } = require('discord.js');

/**
 * Save DM Warning notifications channel selection
 * CustomId: config:channels:selectDmWarning
 */
async function handle(interaction) {
  try {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const channelId = interaction.values?.[0];
    if (!channelId) return interaction.editReply({ content: 'Action cancelled.' });

    await setDmWarningChannel(interaction.guild.id, channelId);

    return interaction.editReply({ content: `✅ DM Warning notifications channel set to <#${channelId}>.` });
  } catch (error) {
    console.error('Error saving DM Warning channel:', error);
    const msg = { content: '❌ Could not save the DM Warning channel.', flags: MessageFlags.Ephemeral };
    if (interaction.deferred || interaction.replied) return interaction.followUp(msg);
    return interaction.reply(msg);
  }
}

module.exports = { handle };

