const { ContainerBuilder, TextDisplayBuilder } = require('@discordjs/builders');
const { colors, emojis } = require('../../config/botConfig');

/**
 * Formata contagem dos rosters da guilda (Main/Sub) no padrão X/5
 * @param {Object} guild - Documento da guilda
 * @returns {string}
 */
function formatRosterCounts(guild) {
  if (!guild) return 'Sem dados de roster.';
  const main = Array.isArray(guild.mainRoster) ? guild.mainRoster.length : 0;
  const sub = Array.isArray(guild.subRoster) ? guild.subRoster.length : 0;
  return `Main Roster: ${main}/5 | Sub Roster: ${sub}/5`;
}

/**
 * Constrói um container simples com status do roster da guilda
 * @param {Object} guild
 */
function buildRosterEmbed(guild) {
  const container = new ContainerBuilder();
  const primaryColor = typeof colors.primary === 'string'
    ? parseInt(colors.primary.replace('#', ''), 16)
    : colors.primary;
  container.setAccentColor(primaryColor);

  const titleText = new TextDisplayBuilder()
    .setContent(`# ${emojis.info} Status do Roster`);

  const descText = new TextDisplayBuilder()
    .setContent(formatRosterCounts(guild));

  const timestampText = new TextDisplayBuilder()
    .setContent(`*<t:${Math.floor(Date.now() / 1000)}:F>*`);

  container.addTextDisplayComponents(titleText, descText, timestampText);

  return container;
}

module.exports = {
  formatRosterCounts,
  buildRosterEmbed,
};

