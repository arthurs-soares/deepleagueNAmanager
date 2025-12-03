/**
 * War Log Handler
 * Handles the /log war subcommand
 */
const { MessageFlags } = require('discord.js');
const { generateSessionId, setSession } = require('./sessionManager');
const { buildPreviewContainer } = require('../../utils/war/warLogContainer');
const { buildRoundButtons } = require('../../utils/war/warLogButtons');

/**
 * Handle war log subcommand - sends interactive container
 * @param {ChatInputCommandInteraction} interaction - Discord interaction
 */
async function handleWarLog(interaction) {
  const guildA = interaction.options.getString('guild_a');
  const guildB = interaction.options.getString('guild_b');
  const format = interaction.options.getString('format');
  const mvp = interaction.options.getUser('mvp');
  const honorable = interaction.options.getUser('honorable');

  const sessionId = generateSessionId();
  const sessionData = {
    guildA,
    guildB,
    format,
    mvpId: mvp.id,
    honorableId: honorable?.id || '',
    rounds: [],
    createdAt: Date.now()
  };

  setSession(sessionId, sessionData);

  const container = buildPreviewContainer(sessionData);
  const buttonRows = buildRoundButtons(sessionId, 0, false);

  await interaction.reply({
    components: [container, ...buttonRows],
    flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
  });
}

module.exports = { handleWarLog };
