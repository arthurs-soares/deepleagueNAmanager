const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  MessageFlags
} = require('discord.js');
const { warLogSessions } = require('../../../commands/admin/log');
const LoggerService = require('../../../services/LoggerService');

/**
 * Handle round button click - opens modal for round deaths
 * CustomId: wl:r:<roundNum>:<sessionId>
 */
async function handle(interaction) {
  try {
    const parts = interaction.customId.split(':');
    const roundNum = parseInt(parts[2], 10);
    const sessionId = parts[3];

    // Get session data
    const sessionData = warLogSessions.get(sessionId);
    if (!sessionData) {
      return interaction.reply({
        content: '❌ Session expired. Please use the command again.',
        flags: MessageFlags.Ephemeral
      });
    }

    // Check if editing existing round
    const existingRound = sessionData.rounds[roundNum - 1];

    const modal = new ModalBuilder()
      .setCustomId(`wl:rm:${roundNum}:${sessionId}`)
      .setTitle(`Round ${roundNum}${existingRound ? ' (Edit)' : ''}`);

    const deathsA = new TextInputBuilder()
      .setCustomId('deathsA')
      .setLabel(`${sessionData.guildA} deaths`)
      .setPlaceholder('Enter number of deaths')
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMaxLength(2);

    const deathsB = new TextInputBuilder()
      .setCustomId('deathsB')
      .setLabel(`${sessionData.guildB} deaths`)
      .setPlaceholder('Enter number of deaths')
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMaxLength(2);

    const clip = new TextInputBuilder()
      .setCustomId('clip')
      .setLabel('Clip URL (optional)')
      .setPlaceholder('https://...')
      .setStyle(TextInputStyle.Short)
      .setRequired(false)
      .setMaxLength(200);

    // Pre-fill values if editing
    if (existingRound) {
      deathsA.setValue(String(existingRound.deathsA));
      deathsB.setValue(String(existingRound.deathsB));
      if (existingRound.clip) clip.setValue(existingRound.clip);
    }

    modal.addComponents(
      new ActionRowBuilder().addComponents(deathsA),
      new ActionRowBuilder().addComponents(deathsB),
      new ActionRowBuilder().addComponents(clip)
    );

    await interaction.showModal(modal);
  } catch (error) {
    LoggerService.error('Error in warLogRound button:', { error: error.message });
  }
}

module.exports = { handle };
