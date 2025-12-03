const { ChannelSelectMenuBuilder, ActionRowBuilder, ChannelType } = require('discord.js');

/**
 * Opens a ChannelSelect to choose the CATEGORY where war channels will be created
 * CustomId: config:channels:setWarCategory
 */
async function handle(interaction) {
  try {
    const menu = new ChannelSelectMenuBuilder()
      .setCustomId('config:channels:selectWarCategory')
      .setPlaceholder('Select a CATEGORY for war channels')
      .setChannelTypes(ChannelType.GuildCategory);

    const row = new ActionRowBuilder().addComponents(menu);
    return interaction.reply({ components: [row], ephemeral: true });
  } catch (error) {
    console.error('Error opening war category selector:', error);
    const msg = { content: '❌ Could not open the channel selector.', ephemeral: true };
    if (interaction.deferred || interaction.replied) return interaction.followUp(msg);
    return interaction.reply(msg);
  }
}

module.exports = { handle };

