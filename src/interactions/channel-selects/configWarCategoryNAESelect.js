const { ChannelType } = require('discord.js');
const { getOrCreateServerSettings } = require('../../utils/system/serverSettings');

/**
 * Receive CATEGORY selection for NA East war channels, save
 * CustomId: config:channels:selectWarCategoryNAE
 */
async function handle(interaction) {
  try {
    await interaction.deferReply({ ephemeral: true });

    const channelId = interaction.values?.[0];
    if (!channelId) return interaction.editReply({ content: 'Action cancelled.' });

    const category = interaction.guild.channels.cache.get(channelId);
    if (!category || category.type !== ChannelType.GuildCategory) {
      return interaction.editReply({ content: '❌ Select a valid category.' });
    }

    const cfg = await getOrCreateServerSettings(interaction.guild.id);
    cfg.warCategoryNAEId = channelId;
    await cfg.save();

    return interaction.editReply({ content: `✅ NA East War category set to <#${channelId}>.` });
  } catch (error) {
    console.error('Error saving NA East war category:', error);
    const msg = { content: '❌ Could not save the NA East war category.', ephemeral: true };
    if (interaction.deferred || interaction.replied) return interaction.followUp(msg);
    return interaction.reply(msg);
  }
}

module.exports = { handle };
