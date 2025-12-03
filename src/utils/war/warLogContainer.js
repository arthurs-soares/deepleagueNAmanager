/**
 * War Log Container Builder
 * Builds Components v2 containers for war log display
 */
const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder
} = require('@discordjs/builders');
const { colors } = require('../../config/botConfig');

/**
 * Determine round winner based on deaths
 * @param {Object} round - Round data with deathsA and deathsB
 * @param {string} guildA - First guild name
 * @param {string} guildB - Second guild name
 * @returns {string} Winner name or 'Tie'
 */
function getRoundWinner(round, guildA, guildB) {
  if (round.deathsA < round.deathsB) return guildA;
  if (round.deathsB < round.deathsA) return guildB;
  return 'Tie';
}

/**
 * Determine overall war winner
 * @param {Array} rounds - Array of round data
 * @param {string} guildA - First guild name
 * @param {string} guildB - Second guild name
 * @returns {string} Winner name or 'Tie'
 */
function getOverallWinner(rounds, guildA, guildB) {
  let winsA = 0, winsB = 0;
  for (const r of rounds) {
    if (r.deathsA < r.deathsB) winsA++;
    else if (r.deathsB < r.deathsA) winsB++;
  }
  if (winsA > winsB) return guildA;
  if (winsB > winsA) return guildB;
  return 'Tie';
}

/**
 * Get primary color for container
 * @returns {number} Color as integer
 */
function getPrimaryColor() {
  return typeof colors.primary === 'string'
    ? parseInt(colors.primary.replace('#', ''), 16)
    : colors.primary;
}

/**
 * Build round content text
 * @param {Object} round - Round data
 * @param {number} index - Round index (0-based)
 * @param {string} guildA - First guild name
 * @param {string} guildB - Second guild name
 * @returns {string} Formatted round content
 */
function buildRoundContent(round, index, guildA, guildB) {
  const winner = getRoundWinner(round, guildA, guildB);
  let content = `## Round ${index + 1}\n` +
    `${guildA}: ${round.deathsA} Deaths\n` +
    `${guildB}: ${round.deathsB} Deaths`;
  if (round.clip) content += `\n🎬 [Clip](${round.clip})`;
  content += `\n**${winner} WINS** ⚔️`;
  return content;
}

/**
 * Build the preview container showing current state
 * @param {Object} data - Session data
 * @param {string} [editHeader] - Optional header for edit mode
 * @returns {ContainerBuilder} Built container
 */
function buildPreviewContainer(data, editHeader = null) {
  const { guildA, guildB, format, mvpId, honorableId, rounds } = data;

  const container = new ContainerBuilder();
  container.setAccentColor(getPrimaryColor());

  if (editHeader) {
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(editHeader)
    );
    container.addSeparatorComponents(new SeparatorBuilder());
  }

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(`# ${guildA} vs ${guildB}`),
    new TextDisplayBuilder().setContent(`${format} war`)
  );
  container.addSeparatorComponents(new SeparatorBuilder());

  for (let i = 0; i < 3; i++) {
    const round = rounds[i];
    const content = round
      ? buildRoundContent(round, i, guildA, guildB)
      : `## Round ${i + 1}\n*Waiting...*`;
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(content)
    );
    if (i < 2) container.addSeparatorComponents(new SeparatorBuilder());
  }

  container.addSeparatorComponents(new SeparatorBuilder());

  const winnerText = rounds.length >= 2
    ? `## **${getOverallWinner(rounds, guildA, guildB)} WINS** ⚔️`
    : '## *Winner: Pending...*';
  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(winnerText),
    new TextDisplayBuilder().setContent(`**MVP:** <@${mvpId}>`)
  );

  if (honorableId) {
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`Honorable Mention: <@${honorableId}>`)
    );
  }

  return container;
}

module.exports = {
  buildPreviewContainer,
  getRoundWinner,
  getOverallWinner
};
