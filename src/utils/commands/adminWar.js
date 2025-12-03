const { MessageFlags } = require('discord.js');
const { ContainerBuilder, TextDisplayBuilder } = require('@discordjs/builders');
const { safeDeferEphemeral } = require('../core/ack');
const { replyEphemeral } = require('../core/reply');
const { isGuildAdmin, isModeratorOrHoster } = require('../core/permissions');
const { auditAdminAction } = require('../misc/adminAudit');
const Guild = require('../../models/guild/Guild');
const War = require('../../models/war/War');

/**
 * Clamp a value between min and max
 * @param {number} v - Value to clamp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number}
 */
function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

/**
 * Build info container for responses
 * @param {string[]} lines - Content lines
 * @returns {ContainerBuilder}
 */
function buildInfoContainer(lines) {
  const container = new ContainerBuilder();
  const content = (lines || [])
    .filter(line => typeof line === 'string' && line.trim().length > 0)
    .join('\n');
  if (content.trim().length > 0) {
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(content)
    );
  }
  return container;
}

async function adjustElo(interaction) {
  await safeDeferEphemeral(interaction);
  const member = await interaction.guild.members.fetch(interaction.user.id);
  const allowed = await isModeratorOrHoster(member, interaction.guild.id);
  if (!allowed) return replyEphemeral(interaction, { content: '❌ Permission denied.' });

  const name = interaction.options.getString('guild', true);
  const op = interaction.options.getString('operation', true);
  const amount = interaction.options.getInteger('amount', true);
  if (!Number.isInteger(amount) || Math.abs(amount) > 500) {
    return replyEphemeral(interaction, { content: '❌ Amount must be between -500 and 500.' });
  }

  const guildDoc = await Guild.findByName(name, interaction.guild.id);
  if (!guildDoc) return replyEphemeral(interaction, { content: '❌ Guild not found.' });

  const delta = op === 'remove' ? -Math.abs(amount) : Math.abs(amount);
  const before = Number.isFinite(guildDoc.elo) ? guildDoc.elo : 1000;
  const after = clamp(before + delta, 0, 5000);
  guildDoc.elo = after;
  await guildDoc.save();

  interaction._commandLogExtra = interaction._commandLogExtra || {};
  interaction._commandLogExtra.changes = [
    { entity: 'guild', id: String(guildDoc._id), field: 'elo', before, after, reason: 'admin war adjust-elo' }
  ];
  interaction._commandLogExtra.resultSummary = `ELO ${op} ${delta > 0 ? '+' : ''}${delta} for ${guildDoc.name}: ${before}→${after}`;
  try { await auditAdminAction(interaction.guild, interaction.user.id, 'Guild ELO Adjust', { guildName: guildDoc.name, guildId: guildDoc._id, extra: `Delta ${delta} → ${after}` }); } catch (_) {}

  const container = buildInfoContainer([
    `✅ ELO ${op} applied to **${guildDoc.name}**`,
    `Before: ${before} • After: ${after}`
  ]);
  return interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2 });
}

async function markDodge(interaction) {
  await safeDeferEphemeral(interaction);
  const member = await interaction.guild.members.fetch(interaction.user.id);
  const allowed = await isGuildAdmin(member, interaction.guild.id);
  if (!allowed) return replyEphemeral(interaction, { content: '❌ Admin/Moderator required.' });

  const warId = interaction.options.getString('warid', true);
  const dodgerGuildName = interaction.options.getString('dodger_guild', true);
  const confirm = interaction.options.getBoolean('confirm', false) || false;
  if (!confirm) return replyEphemeral(interaction, { content: '⚠️ Confirmation required. Re-run with confirm=true.' });

  const war = await War.findById(warId);
  if (!war) return replyEphemeral(interaction, { content: '❌ War not found.' });
  if (war.status !== 'aberta') {
    return replyEphemeral(interaction, { content: '⚠️ War is not open for dodge.' });
  }

  const dodger = await Guild.findByName(dodgerGuildName, interaction.guild.id);
  if (!dodger) {
    return replyEphemeral(interaction, { content: '❌ Dodger guild not found.' });
  }

  war.status = 'dodge';
  war.dodgedByGuildId = dodger._id;
  await war.save();

  // Apply dodge penalty/reward
  try {
    const opponentId = String(dodger._id) === String(war.guildAId)
      ? war.guildBId
      : war.guildAId;
    const opponent = await Guild.findById(opponentId);
    if (dodger && opponent) {
      dodger.elo = clamp(
        (Number.isFinite(dodger.elo) ? dodger.elo : 1000) - 16,
        0,
        5000
      );
      opponent.elo = clamp(
        (Number.isFinite(opponent.elo) ? opponent.elo : 1000) + 8,
        0,
        5000
      );
      await Promise.all([dodger.save(), opponent.save()]);
    }
  } catch (_) {}

  interaction._commandLogExtra = interaction._commandLogExtra || {};
  interaction._commandLogExtra.changes = [
    { entity: 'war', id: String(war._id), field: 'status', before: 'aberta', after: 'dodge', reason: 'admin dodge mark' }
  ];
  interaction._commandLogExtra.resultSummary = `War ${war._id} marked as dodge by ${dodger.name}`;
  try { await auditAdminAction(interaction.guild, interaction.user.id, 'War Dodge Marked', { guildName: dodger.name, guildId: dodger._id, extra: `War ${war._id}` }); } catch (_) {}

  const container = buildInfoContainer([
    `✅ Marked war ${war._id} as Dodge`,
    `Dodger: ${dodger.name}`
  ]);
  return interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2 });
}

async function undoDodge(interaction) {
  await safeDeferEphemeral(interaction);
  const member = await interaction.guild.members.fetch(interaction.user.id);
  const allowed = await isGuildAdmin(member, interaction.guild.id);
  if (!allowed) return replyEphemeral(interaction, { content: '❌ Admin/Moderator required.' });

  const warId = interaction.options.getString('warid', true);
  const confirm = interaction.options.getBoolean('confirm', false) || false;
  if (!confirm) return replyEphemeral(interaction, { content: '⚠️ Confirmation required. Re-run with confirm=true.' });

  const war = await War.findById(warId);
  if (!war) return replyEphemeral(interaction, { content: '❌ War not found.' });
  if (war.status !== 'dodge' || !war.dodgedByGuildId) return replyEphemeral(interaction, { content: '⚠️ War is not in dodge state.' });

  try {
    const dodger = await Guild.findById(war.dodgedByGuildId);
    const opponentId = String(war.dodgedByGuildId) === String(war.guildAId) ? war.guildBId : war.guildAId;
    const opponent = await Guild.findById(opponentId);
    if (dodger && opponent) {
      dodger.elo = clamp((Number.isFinite(dodger.elo) ? dodger.elo : 1000) + 16, 0, 5000);
      opponent.elo = clamp((Number.isFinite(opponent.elo) ? opponent.elo : 1000) - 8, 0, 5000);
      await Promise.all([dodger.save(), opponent.save()]);
    }
  } catch (_) {}

  const beforeStatus = war.status;
  war.status = 'aberta';
  war.dodgedByGuildId = null;
  await war.save();

  interaction._commandLogExtra = interaction._commandLogExtra || {};
  interaction._commandLogExtra.changes = [
    { entity: 'war', id: String(war._id), field: 'status', before: beforeStatus, after: 'aberta', reason: 'admin dodge undo' }
  ];
  interaction._commandLogExtra.resultSummary = `War ${war._id} dodge reverted → open`;
  try { await auditAdminAction(interaction.guild, interaction.user.id, 'War Dodge Reverted', { extra: `War ${war._id}` }); } catch (_) {}

  const container = buildInfoContainer([
    `✅ Reverted dodge for war ${war._id}`,
    'Status: aberta'
  ]);
  return interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2 });
}

async function revertResult(interaction) {
  await safeDeferEphemeral(interaction);
  const member = await interaction.guild.members.fetch(interaction.user.id);
  const allowed = await isGuildAdmin(member, interaction.guild.id);
  if (!allowed) return replyEphemeral(interaction, { content: '❌ Admin/Moderator required.' });

  const warId = interaction.options.getString('warid', true);
  const winnerBefore = interaction.options.getInteger('winner_elo_before');
  const loserBefore = interaction.options.getInteger('loser_elo_before');
  const confirm = interaction.options.getBoolean('confirm', false) || false;
  if (!confirm) return replyEphemeral(interaction, { content: '⚠️ Confirmation required. Re-run with confirm=true.' });

  const war = await War.findById(warId);
  if (!war) return replyEphemeral(interaction, { content: '❌ War not found.' });
  if (war.status !== 'finalizada' || !war.winnerGuildId) return replyEphemeral(interaction, { content: '⚠️ War is not finalized or winner missing.' });

  const winner = await Guild.findById(war.winnerGuildId);
  const loserId = String(war.winnerGuildId) === String(war.guildAId) ? war.guildBId : war.guildAId;
  const loser = await Guild.findById(loserId);
  if (!winner || !loser) return replyEphemeral(interaction, { content: '❌ Guilds not found.' });

  if (!Number.isInteger(winnerBefore) || !Number.isInteger(loserBefore)) {
    return replyEphemeral(interaction, { content: '❌ Provide winner_elo_before and loser_elo_before for exact reversion.' });
  }

  const winBefore = clamp(winnerBefore, 0, 5000);
  const loseBefore = clamp(loserBefore, 0, 5000);

  const winsPrev = Math.max(0, (winner.wins || 0) - 1);
  const lossesPrev = Math.max(0, (loser.losses || 0) - 1);

  const winEloAfter = winner.elo;
  const loseEloAfter = loser.elo;

  winner.elo = winBefore;
  loser.elo = loseBefore;
  winner.wins = winsPrev;
  loser.losses = lossesPrev;

  const beforeStatus = war.status;
  war.status = 'aberta';
  war.winnerGuildId = null;

  await Promise.all([winner.save(), loser.save(), war.save()]);

  interaction._commandLogExtra = interaction._commandLogExtra || {};
  interaction._commandLogExtra.changes = [
    { entity: 'guild', id: String(winner._id), field: 'elo', before: winEloAfter, after: winBefore, reason: 'war revert' },
    { entity: 'guild', id: String(loser._id), field: 'elo', before: loseEloAfter, after: loseBefore, reason: 'war revert' },
    { entity: 'war', id: String(war._id), field: 'status', before: beforeStatus, after: 'aberta', reason: 'war revert' },
  ];
  interaction._commandLogExtra.resultSummary = `Reverted war ${war._id} result → open`;
  try { await auditAdminAction(interaction.guild, interaction.user.id, 'War Result Reverted', { extra: `War ${war._id}` }); } catch (_) {}

  const container = buildInfoContainer([
    `✅ Reverted result for war ${war._id}`,
    'Winner/Loser ELO restored to provided values.'
  ]);
  return interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2 });
}

module.exports = {
  adjustElo,
  markDodge,
  undoDodge,
  revertResult,
  buildInfoContainer,
};

