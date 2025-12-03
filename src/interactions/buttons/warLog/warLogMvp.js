/**
 * War Log MVP Edit Button Handler
 * Opens a user select menu to change the MVP
 * CustomId: wl:mvp:<sessionId>
 */
const {
  ActionRowBuilder,
  UserSelectMenuBuilder,
  MessageFlags
} = require('discord.js');
const { warLogSessions } = require('../../../services/warLog/sessionManager');
const LoggerService = require('../../../services/LoggerService');

/**
 * Handle MVP edit button click - shows user select menu
 */
async function handle(interaction) {
  try {
    const parts = interaction.customId.split(':');
    const sessionId = parts[2];

    const sessionData = warLogSessions.get(sessionId);
    if (!sessionData) {
      return interaction.reply({
        content: '❌ Session expired. Please use the command again.',
        flags: MessageFlags.Ephemeral
      });
    }

    const row = new ActionRowBuilder().addComponents(
      new UserSelectMenuBuilder()
        .setCustomId(`wl:mvpSelect:${sessionId}`)
        .setPlaceholder('Select new MVP')
        .setMinValues(1)
        .setMaxValues(1)
    );

    await interaction.reply({
      content: '👤 Select the new MVP for this war:',
      components: [row],
      flags: MessageFlags.Ephemeral
    });
  } catch (error) {
    LoggerService.error('Error in warLogMvp button:', { error: error.message });
  }
}

module.exports = { handle };
