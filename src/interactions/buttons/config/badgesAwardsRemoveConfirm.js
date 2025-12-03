const { MessageFlags } = require('discord.js');
const { isGuildAdmin } = require('../../../utils/core/permissions');
const { revokeAward } = require('../../../utils/badges/awardService');
const { getBadgeById } = require('../../../utils/badges/badgeService');
const { buildAwardsViewer } = require('../../../utils/badges/awardsViewer');
const GuildModel = require('../../../models/guild/Guild');
const { notifyUserRevoke, notifyGuildRevoke } = require('../../../utils/badges/awardNotifications');
const LoggerService = require('../../../services/LoggerService');

/**
 * Confirm removing an award
 * CustomId: badges_awards:removeConfirm:<awardId>:<yes|no>
 */
async function handle(interaction) {
  try {
    const parts = interaction.customId.split(':');
    const awardId = parts[2];
    const decision = parts[3];

    // Parse state from footer
    const footer = interaction.message?.embeds?.[0]?.data?.footer?.text || '';
    const pageMatch = footer.match(/Page\s+(\d+)\/(\d+)/i);
    const catMatch = footer.match(/Filter:\s+(all|user|guild)/i);
    const sortMatch = footer.match(/Sort:\s+(asc|desc)/i);
    const page = pageMatch ? parseInt(pageMatch[1], 10) : 1;
    const category = catMatch ? catMatch[1].toLowerCase() : 'all';
    const sort = sortMatch ? sortMatch[1].toLowerCase() : 'desc';

    if (decision !== 'yes') {
      const { embed, rows } = await buildAwardsViewer(interaction.guild, { category, sort, page });
      return interaction.update({ components: [embed, ...rows], flags: MessageFlags.IsComponentsV2 });
    }

    // Permission check
    const member = await interaction.guild.members.fetch(interaction.user.id);
    const allowed = await isGuildAdmin(member, interaction.guild.id);
    if (!allowed) return interaction.reply({ content: '\u274c You do not have permission.', ephemeral: true });

    const res = await revokeAward(awardId, interaction.guild.id);
    if (!res.ok) return interaction.reply({ content: `\u274c ${res.message}`, ephemeral: true });

    // Notify target
    try {
      const award = res.award;
      const badge = await getBadgeById(String(award.badgeId));
      if (award.category === 'user' && award.targetUserId) {
        await notifyUserRevoke(interaction.client, interaction.guild.id, award.targetUserId, badge, interaction.user.id);
      } else if (award.category === 'guild' && award.targetGuildId) {
        const g = await GuildModel.findById(String(award.targetGuildId)).lean();
        const name = g?.name || 'Unknown Guild';
        await notifyGuildRevoke(interaction.guild, badge, name, interaction.user.id);
      }
    } catch (_) { /* ignore notify errors */ }

    const { embed, rows } = await buildAwardsViewer(interaction.guild, { category, sort, page });
    return interaction.update({ components: [embed, ...rows], flags: MessageFlags.IsComponentsV2 });
  } catch (error) {
    LoggerService.error('Error removing award:', error);
    const msg = { content: '\u274c Could not remove the award.', ephemeral: true };
    if (interaction.deferred || interaction.replied) return interaction.followUp(msg);
    return interaction.reply(msg);
  }
}

module.exports = { handle };

