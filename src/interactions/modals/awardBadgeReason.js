const { isGuildAdmin } = require('../../utils/core/permissions');
const { awardBadgeToUser, awardBadgeToGuild } = require('../../utils/badges/awardService');
const { replyEphemeral } = require('../../utils/core/reply');

/**
 * Submit optional reason, then award
 * CustomId: awardBadge:reason:<user|guild>:<badgeId>:<targetId>
 */
async function handle(interaction) {
  try {
    const { guild, user, customId } = interaction;
    const parts = customId.split(':');
    const targetType = parts[2];
    const badgeId = parts[3];
    const targetId = parts[4];

    const member = await guild.members.fetch(user.id);
    const allowed = await isGuildAdmin(member, guild.id);
    if (!allowed) return replyEphemeral(interaction, { content: '\u274c You do not have permission.' });

    const note = (interaction.fields.getTextInputValue('note') || '').trim();

    let res;
    if (targetType === 'user') {
      res = await awardBadgeToUser({ discordGuildId: guild.id, badgeId, userId: targetId, reason: note, awardedByUserId: user.id });
    } else if (targetType === 'guild') {
      res = await awardBadgeToGuild({ discordGuildId: guild.id, badgeId, guildModelId: targetId, reason: note, awardedByUserId: user.id });
    } else {
      return replyEphemeral(interaction, { content: '\u274c Invalid target.' });
    }

    if (!res.ok) return replyEphemeral(interaction, { content: `\u274c ${res.message}` });

    // Notifications
    try {
      const { getBadgeById } = require('../../utils/badges/badgeService');
      const { notifyUserAward, notifyGuildAward } = require('../../utils/badges/awardNotifications');
      const badge = await getBadgeById(badgeId);
      if (targetType === 'user') {
        await notifyUserAward(interaction.client, guild.id, targetId, badge, note, user.id);
      } else if (targetType === 'guild') {
        const GuildModel = require('../../models/guild/Guild');
        const g = await GuildModel.findById(targetId).lean();
        const targetGuildName = g?.name || 'Unknown Guild';
        await notifyGuildAward(guild, badge, targetGuildName, note, user.id);
      }
    } catch (_) { /* ignore notification errors */ }

    return replyEphemeral(interaction, { content: '\u2705 Badge awarded successfully!' });
  } catch (error) {
    console.error('Error awarding badge:', error);
    return replyEphemeral(interaction, { content: '\u274c Could not award the badge.' });
  }
}

module.exports = { handle };

