/**
 * Guild score handler
 * Extracted from guildHandlers.js to comply with max-lines rule
 */
const { MessageFlags, PermissionFlagsBits } = require('discord.js');
const { getOrCreateRoleConfig } = require('../../utils/misc/roleConfig');
const Guild = require('../../models/guild/Guild');
const LoggerService = require('../../services/LoggerService');

/**
 * Handle /guild set-score
 * @param {ChatInputCommandInteraction} interaction - Interaction
 * @returns {Promise<void>}
 */
async function handleSetScore(interaction) {
  try {
    const member = await interaction.guild.members.fetch(interaction.user.id);
    const cfg = await getOrCreateRoleConfig(interaction.guild.id);

    const hasAdmin = member.permissions.has(PermissionFlagsBits.Administrator);
    const hasMod = cfg.moderatorsRoleIds?.some(
      id => member.roles.cache.has(id)
    );
    const hasHoster = cfg.hostersRoleIds?.some(
      id => member.roles.cache.has(id)
    );

    if (!hasAdmin && !hasMod && !hasHoster) {
      return interaction.reply({
        content: '❌ You do not have permission to use this command.',
        flags: MessageFlags.Ephemeral
      });
    }

    const name = interaction.options.getString('name');
    const wins = interaction.options.getInteger('wins');
    const losses = interaction.options.getInteger('losses');

    if (wins < 0 || losses < 0) {
      return interaction.reply({
        content: '⚠️ Values cannot be negative.',
        flags: MessageFlags.Ephemeral
      });
    }

    const guildDoc = await Guild.findByName(name, interaction.guild.id);
    if (!guildDoc) {
      return interaction.reply({
        content: '❌ Guild not found.',
        flags: MessageFlags.Ephemeral
      });
    }

    guildDoc.wins = wins;
    guildDoc.losses = losses;
    await guildDoc.save();

    try {
      const { logGuildScoreUpdated } = require('../../utils/misc/logEvents');
      await logGuildScoreUpdated(
        guildDoc,
        wins,
        losses,
        interaction.guild,
        interaction.user.id
      );
    } catch (_) {}

    return interaction.reply({
      content: `✅ Score updated for ${guildDoc.name}: ${wins}W/${losses}L.`,
      flags: MessageFlags.Ephemeral
    });
  } catch (error) {
    LoggerService.error('Error in /guild set-score:', { error: error.message });
    const msg = {
      content: '❌ Could not update the score.',
      flags: MessageFlags.Ephemeral
    };
    if (interaction.deferred || interaction.replied) {
      return interaction.followUp(msg);
    }
    return interaction.reply(msg);
  }
}

module.exports = { handleSetScore };
