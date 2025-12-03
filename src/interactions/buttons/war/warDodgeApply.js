const { ChannelType, MessageFlags } = require('discord.js');
const War = require('../../../models/war/War');
const Guild = require('../../../models/guild/Guild');
const { getOrCreateRoleConfig } = require('../../../utils/misc/roleConfig');
const { sendTranscriptToLogs } = require('../../../utils/tickets/transcript');
const { sendLog } = require('../../../utils/core/logger');
const { buildWarDodgeEmbed } = require('../../../utils/embeds/warDodgeEmbed');


/**
 * Apply the war dodge after confirmation
 * CustomId: war:dodge:apply:<warId>:<dodgerGuildId>:<sourceMessageId>
 */
async function handle(interaction) {
  try {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const parts = interaction.customId.split(':');
    const warId = parts[3];
    const dodgerGuildId = parts[4];
    const sourceMessageId = parts[5] && parts[5] !== '0' ? parts[5] : null;

    if (!warId || !dodgerGuildId) return interaction.editReply({ content: '❌ Invalid parameters.' });

    // Permissions: only Moderators/Hosters (configured in /config)
    const rolesCfg = await getOrCreateRoleConfig(interaction.guild.id);
    const allowedRoleIds = new Set([...(rolesCfg?.hostersRoleIds || []), ...(rolesCfg?.moderatorsRoleIds || [])]);
    const hasAllowedRole = interaction.member.roles.cache.some(r => allowedRoleIds.has(r.id));
    if (!hasAllowedRole) {
      return interaction.editReply({ content: '❌ Only hosters or moderators can mark a war as dodge.' });
    }

    const war = await War.findById(warId);
    if (!war) return interaction.editReply({ content: '❌ War not found.' });
    if (war.status !== 'aberta') return interaction.editReply({ content: '⚠️ This war is no longer waiting for confirmation.' });

    const [guildA, guildB] = await Promise.all([
      Guild.findById(war.guildAId),
      Guild.findById(war.guildBId)
    ]);

    war.status = 'dodge';
    war.dodgedByGuildId = dodgerGuildId;
    await war.save();

    // Apply dodge penalty/reward directly
    try {
      const dodgerGuild = String(dodgerGuildId) === String(war.guildAId)
        ? guildA
        : guildB;
      const opponentGuild = String(dodgerGuildId) === String(war.guildAId)
        ? guildB
        : guildA;
      if (dodgerGuild && opponentGuild) {
        const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
        dodgerGuild.elo = clamp(
          (Number.isFinite(dodgerGuild.elo) ? dodgerGuild.elo : 1000) - 16,
          0,
          5000
        );
        opponentGuild.elo = clamp(
          (Number.isFinite(opponentGuild.elo) ? opponentGuild.elo : 1000) + 8,
          0,
          5000
        );
        await Promise.all([dodgerGuild.save(), opponentGuild.save()]);
      }
    } catch (_) {}

    // Clean original panel and notify in war channel
    try {
      const warChannel = war.channelId ? interaction.guild.channels.cache.get(war.channelId) : null;
      if (warChannel && sourceMessageId) {
        try {
          const msg = await warChannel.messages.fetch(sourceMessageId).catch(() => null);
          if (msg) await msg.edit({ components: [] }).catch(() => {});
        } catch (_) {}
      }
      if (warChannel && warChannel.type === ChannelType.GuildText) {
        const dodgerName = String(dodgerGuildId) === String(war.guildAId) ? (guildA?.name || 'Guild A') : (guildB?.name || 'Guild B');
        const opponentName = String(dodgerGuildId) === String(war.guildAId) ? (guildB?.name || 'Guild B') : (guildA?.name || 'Guild A');
        const penaltyText = '-16 ELO (dodger), +8 ELO (opponent)';
        const embed = buildWarDodgeEmbed(dodgerName, opponentName, interaction.user.id, penaltyText, new Date());
        await warChannel.send({ components: [embed], flags: MessageFlags.IsComponentsV2 });
        try { await sendTranscriptToLogs(interaction.guild, warChannel, `War ${war._id} marked as dodge by ${dodgerName} (by <@${interaction.user.id}>)`); } catch (_) {}
      }
    } catch (_) {}

    // Log + notification
    try {
      const dodgerName = String(dodgerGuildId) === String(war.guildAId)
        ? (guildA?.name || 'Guild A')
        : (guildB?.name || 'Guild B');
      const opponentName = String(dodgerGuildId) === String(war.guildAId)
        ? (guildB?.name || 'Guild B')
        : (guildA?.name || 'Guild A');
      await sendLog(
        interaction.guild,
        'War Dodge',
        `War ${war._id}: ${dodgerName} dodged vs ${opponentName}. ` +
        `By <@${interaction.user.id}>.`
      );
    } catch (_) {}

    try {
      return await interaction.editReply({ content: '✅ Dodge recorded.' });
    } catch (e) {
      const code = e?.code ?? e?.rawError?.code;
      if (code !== 10008) throw e; // rethrow unexpected errors
      // Unknown Message: token lost or @original missing; silently ignore to avoid noise
      return;
    }
  } catch (error) {
    console.error('Error in button war:dodge:apply:', error);
    const msg = { content: '❌ Could not apply the dodge.' };
    if (interaction.deferred || interaction.replied) return interaction.followUp({ ...msg, ephemeral: true });
    return interaction.reply({ ...msg, ephemeral: true });
  }
}

module.exports = { handle };

