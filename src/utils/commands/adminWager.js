const { isModeratorOrHoster } = require('../core/permissions');
const WagerTicket = require('../../models/wager/WagerTicket');
const { recordWager } = require('../wager/wagerService');
const { buildWagerCloseButtonRow } = require('../tickets/closeButtons');

async function record(interaction) {
  const { MessageFlags } = require('discord.js');
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  const member = await interaction.guild.members.fetch(interaction.user.id);
  const allowed = await isModeratorOrHoster(member, interaction.guild.id);
  if (!allowed) return interaction.editReply({ content: '❌ Permission denied.' });

  const winnerUser = interaction.options.getUser('winner', true);
  const loserUser = interaction.options.getUser('loser', true);

  // Expose interaction for downstream logging enrichment
  global._currentInteraction = interaction;

  const embed = await recordWager(
    interaction.guild,
    interaction.user.id,
    winnerUser.id,
    loserUser.id,
    interaction.client
  );

  // Send publicly
  await interaction.editReply({ content: 'Wager recorded successfully.' });
  await interaction.followUp({
    components: [embed],
    flags: MessageFlags.IsComponentsV2
  });

  try {
    const ticket = await WagerTicket.findOne({ discordGuildId: interaction.guild.id, channelId: interaction.channel.id });
    if (ticket) {
      await interaction.followUp({
        content: '✅ Result recorded. Use the button below to close this ticket (transcript will be saved).',
        components: [buildWagerCloseButtonRow(ticket._id)],
        ephemeral: false
      });
    }
  } catch (_) {}
}

module.exports = { record };

