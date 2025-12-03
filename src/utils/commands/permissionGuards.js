const { isGuildAdmin } = require('../core/permissions');
const { createErrorEmbed } = require('../embeds/embedBuilder');
const { MessageFlags } = require('discord.js');

/**
 * Ensure the user has admin/moderator permissions. If not, reply ephemerally.
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @returns {Promise<boolean>} allowed
 */
async function ensureAdminOrReply(interaction) {
  const allowed = await isGuildAdmin(interaction.member, interaction.guild.id);
  if (allowed) return true;
  const container = createErrorEmbed('Permission Denied', 'You need to be an administrator or moderator configured in /config to use this command.');
  await interaction.reply({ components: [container], flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2 });
  return false;
}

module.exports = { ensureAdminOrReply };

