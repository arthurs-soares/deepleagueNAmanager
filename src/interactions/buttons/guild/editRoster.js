const { ActionRowBuilder, StringSelectMenuBuilder, MessageFlags } = require('discord.js');
const { createErrorEmbed } = require('../../../utils/embeds/embedBuilder');

/**
 * "Edit Roster" button handler
 * Expected CustomId: guild_panel:edit_roster:<guildId>
 * Opens a select with 4 possible actions.
 * @param {ButtonInteraction} interaction
 */
async function handle(interaction) {
  try {
    const parts = interaction.customId.split(':');
    // guild_panel:edit_roster:<guildId>
    const guildId = parts[2];
    if (!guildId) {
      const embed = createErrorEmbed('Invalid data', 'GuildId not provided.');
      return interaction.reply({ components: [embed], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
    }

    const menu = new StringSelectMenuBuilder()
      .setCustomId(`roster_actions:${guildId}`)
      .setPlaceholder('Choose an action to manage rosters')
      .addOptions([
        { label: 'Add Main Roster', description: 'Add user to main roster (max. 5)', value: 'add_main' },
        { label: 'Add Sub Roster', description: 'Add user to sub roster (max. 5)', value: 'add_sub' },
        { label: 'Remove Main Roster', description: 'Remove user from main roster', value: 'remove_main' },
        { label: 'Remove Sub Roster', description: 'Remove user from sub roster', value: 'remove_sub' },
        { label: 'Remove Co-leader (not in roster)', description: 'Demote co-leader who is not on current rosters', value: 'remove_co_leader_external' },
      ]);

    const row = new ActionRowBuilder().addComponents(menu);

    // Update the message to show the select (keeping previous embeds/components when possible)
    return interaction.reply({ components: [row], flags: MessageFlags.Ephemeral });
  } catch (error) {
    console.error('Error in Edit Roster button:', error);
    const container = createErrorEmbed('Error', 'Could not open roster actions.');
    if (interaction.deferred || interaction.replied) {
      return interaction.followUp({ components: [container], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
    }
    return interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
  }
}

module.exports = { handle };
