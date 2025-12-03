/**
 * War Log Button Builder
 * Builds action buttons for war log workflow
 */
const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

/**
 * Build action buttons for rounds
 * @param {string} sessionId - Session ID for button customIds
 * @param {number} roundCount - Number of completed rounds
 * @param {boolean} [isEdit=false] - Whether this is edit mode
 * @returns {ActionRowBuilder[]} Array of action rows with buttons
 */
function buildRoundButtons(sessionId, roundCount, isEdit = false) {
  const roundRow = new ActionRowBuilder();

  for (let i = 1; i <= 3; i++) {
    const isDone = i <= roundCount;
    const isCurrent = i === roundCount + 1;
    const isOptional = i === 3;
    const isFuture = i > roundCount + 1;

    const label = `R${i}${isDone ? ' ✏️' : ''}${isOptional ? ' (opt)' : ''}`;
    const style = isDone
      ? ButtonStyle.Success
      : isCurrent ? ButtonStyle.Primary : ButtonStyle.Secondary;

    roundRow.addComponents(
      new ButtonBuilder()
        .setCustomId(`wl:r:${i}:${sessionId}`)
        .setLabel(label)
        .setStyle(style)
        .setDisabled(isFuture)
    );
  }

  roundRow.addComponents(
    new ButtonBuilder()
      .setCustomId(`wl:s:${sessionId}`)
      .setLabel('✅ Submit')
      .setStyle(ButtonStyle.Success)
      .setDisabled(roundCount < 2)
  );

  // In edit mode, add MVP edit button in a second row
  if (isEdit) {
    const editRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`wl:mvp:${sessionId}`)
        .setLabel('👤 Edit MVP')
        .setStyle(ButtonStyle.Secondary)
    );
    return [roundRow, editRow];
  }

  return [roundRow];
}

module.exports = { buildRoundButtons };
