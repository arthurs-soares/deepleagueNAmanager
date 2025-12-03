const { ownerIds } = require('../../config/botConfig');
const { isGuildAdmin } = require('../core/permissions');

/**
 * Determine if the command's cooldown should be bypassed for this interaction
 * - Bypasses for bot owners or server admins when command.allowAdminBypass !== false
 * @param {import('discord.js').CommandInteraction} interaction
 * @param {{ allowAdminBypass?: boolean }} command
 * @returns {Promise<boolean>}
 */
async function shouldBypassCooldown(interaction, command) {
  try {
    if (command?.allowAdminBypass === false) return false;

    const isOwner = Array.isArray(ownerIds) && ownerIds.includes(interaction.user.id);
    if (isOwner) return true;

    const member = interaction.member || (interaction.guild && await interaction.guild.members.fetch(interaction.user.id));
    if (!member) return false;

    return await isGuildAdmin(member, interaction.guild?.id);
  } catch (_) {
    return false;
  }
}

module.exports = { shouldBypassCooldown };

