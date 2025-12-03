const { checkCooldown } = require('../rate-limiting/cooldownManager');
const { createErrorEmbed } = require('../embeds/embedBuilder');
const { replyEphemeral } = require('../core/reply');

/**
 * Enforce per-command cooldown and notify the user if active.
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @param {any} command
 * @param {string} cooldownKey
 * @returns {Promise<{blocked: boolean, timeLeft: number}>}
 */
async function enforceCommandCooldown(interaction, command, cooldownKey) {
  const cooldownTime = command.cooldown || 3;
  const timeLeft = checkCooldown(cooldownKey, cooldownTime);
  if (!timeLeft) return { blocked: false, timeLeft: 0 };

  const embed = createErrorEmbed(
    'Cooldown Active',
    `Please wait ${timeLeft.toFixed(1)} seconds before using this command again.`
  );
  await replyEphemeral(interaction, { components: [embed] });
  return { blocked: true, timeLeft };
}

module.exports = { enforceCommandCooldown };

