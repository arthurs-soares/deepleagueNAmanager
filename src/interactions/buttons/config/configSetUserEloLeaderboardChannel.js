const { ChannelSelectMenuBuilder, ActionRowBuilder, ChannelType } = require('discord.js');

/**
 * Opens a ChannelSelect to choose the user ELO leaderboard channel
 * CustomId: config:channels:setUserEloLeaderboard
 */
async function handle(interaction) {
  try {
    const menu = new ChannelSelectMenuBuilder()
      .setCustomId('config:channels:selectUserEloLeaderboard')
      .setPlaceholder('Select a text channel for the User ELO Leaderboard')
      .setChannelTypes(ChannelType.GuildText);

    const row = new ActionRowBuilder().addComponents(menu);
    return interaction.reply({ components: [row], ephemeral: true });
  } catch (error) {
    console.error('Error opening user ELO leaderboard channel selector:', error);
    const msg = { content: '❌ Could not open the channel selector.', ephemeral: true };
    if (interaction.deferred || interaction.replied) return interaction.followUp(msg);
    return interaction.reply(msg);
  }
}

module.exports = { handle };
