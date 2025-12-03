const { PermissionFlagsBits, MessageFlags } = require('discord.js');
const { buildWarCloseButtonRow } = require('../../../utils/tickets/closeButtons');
const { replyEphemeral } = require('../../../utils/core/reply');
const War = require('../../../models/war/War');
const Guild = require('../../../models/guild/Guild');
const { sendLog } = require('../../../utils/core/logger');
const { getOrCreateRoleConfig } = require('../../../utils/misc/roleConfig');

/**
 * Declare the war winner (hosters/moderators/admins)
 * CustomId: war:declareWinner:<warId>:<winnerGuildId>
 */
async function handle(interaction) {
  try {
    // Immediate defer to avoid token expiration
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const member = await interaction.guild.members.fetch(interaction.user.id);
    const rolesCfg = await getOrCreateRoleConfig(interaction.guild.id);
    const allowedRoleIds = new Set([...(rolesCfg?.hostersRoleIds || []), ...(rolesCfg?.moderatorsRoleIds || [])]);

    const hasAdmin = member.permissions.has(PermissionFlagsBits.Administrator);
    const hasAllowedRole = member.roles.cache.some(r => allowedRoleIds.has(r.id));

    if (!hasAdmin && !hasAllowedRole) {
      return interaction.editReply({ content: '❌ Only hosters, moderators or administrators can declare the winner.' });
    }

    const [, , warId, winnerGuildId] = interaction.customId.split(':');
    const war = await War.findById(warId);
    if (!war || war.status !== 'aberta') {
      return interaction.editReply({ content: '⚠️ Invalid war or already finished.' });
    }

    const [guildA, guildB, winner] = await Promise.all([
      Guild.findById(war.guildAId),
      Guild.findById(war.guildBId),
      Guild.findById(winnerGuildId),
    ]);

    if (!winner) return interaction.editReply({ content: '❌ Invalid winner guild.' });

    // Update stats
    const loserId = String(winner._id) === String(guildA._id) ? guildB._id : guildA._id;
    const [loser] = await Promise.all([
      Guild.findById(loserId)
    ]);

    winner.wins = (winner.wins || 0) + 1;
    loser.losses = (loser.losses || 0) + 1;

    war.status = 'finalizada';
    war.winnerGuildId = winner._id;

    await Promise.all([winner.save(), loser.save(), war.save()]);

    // Feedback to war channel + close button
    try {
      await interaction.message.reply({ content: `🏆 Winner declared: ${winner.name}`, components: [buildWarCloseButtonRow(war._id)] });
    } catch (_) {}

    // War finished log
    try {
      const freshWinner = await Guild.findById(winner._id);
      const freshLoser = await Guild.findById(loser._id);
      const changes = [
        {
          entity: 'guild',
          id: String(freshWinner._id),
          field: 'wins',
          before: (freshWinner.wins || 1) - 1,
          after: freshWinner.wins,
          reason: 'war win'
        },
        {
          entity: 'guild',
          id: String(freshLoser._id),
          field: 'losses',
          before: (freshLoser.losses || 1) - 1,
          after: freshLoser.losses,
          reason: 'war loss'
        },
      ];
      interaction._commandLogExtra = interaction._commandLogExtra || {};
      interaction._commandLogExtra.changes =
        (interaction._commandLogExtra.changes || []).concat(changes);

      await sendLog(
        interaction.guild,
        'War finished',
        `War ${war._id}\nWinner: ${winner.name}\n` +
        `Participants: ${guildA?.name} vs ${guildB?.name}`
      );
    } catch (_) { /* ignore */ }

    return interaction.editReply({ content: '✅ Result saved successfully.' });
  } catch (error) {
    console.error('Error declaring winner:', error);
    return replyEphemeral(interaction, { content: '❌ Could not save the result.' });
  }
}

module.exports = { handle };

