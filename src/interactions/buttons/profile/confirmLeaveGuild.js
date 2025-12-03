const Guild = require('../../../models/guild/Guild');
const { recordGuildLeave } = require('../../../utils/rate-limiting/guildTransitionCooldown');
const { removeFromRoster } = require('../../../utils/roster/rosterManager');
const { notifyLeaderOnMemberLeave } = require('../../../utils/roster/notifyLeaderOnMemberLeave');
const { MessageFlags } = require('discord.js');

/**
 * Confirm/deny user leaving the guild
 * CustomIds: profile:confirmLeave:yes | profile:confirmLeave:no
 */
async function handle(interaction) {
  try {
    const isYes = interaction.customId.endsWith(':yes');
    if (!isYes) return interaction.reply({ content: 'Action cancelled.', flags: MessageFlags.Ephemeral });

    // Find a guild where the user is a member OR in any roster (main/sub)
    const doc = await Guild.findOne({
      discordGuildId: interaction.guild.id,
      $or: [
        { members: { $elemMatch: { userId: interaction.user.id } } },
        { mainRoster: interaction.user.id },
        { subRoster: interaction.user.id },
      ]
    });
    if (!doc) return interaction.reply({ content: '⚠️ You are not in any registered guild.', flags: MessageFlags.Ephemeral });

    const members = Array.isArray(doc.members) ? doc.members : [];
    const me = members.find(m => m.userId === interaction.user.id);

    if (me?.role === 'lider') {
      return interaction.reply({ content: '❌ Leader cannot leave directly. Transfer leadership first.', flags: MessageFlags.Ephemeral });
    }

    // Capture roster membership before updates
    const wasInMain = Array.isArray(doc.mainRoster) && doc.mainRoster.includes(interaction.user.id);
    const wasInSub = Array.isArray(doc.subRoster) && doc.subRoster.includes(interaction.user.id);

    // Capture leader to notify (Portuguese leader role)
    const leaderMember = members.find(m => m.role === 'lider');
    const leaderId = leaderMember?.userId || null;

    // Remove from members and save first (avoid overwriting roster changes later)
    doc.members = members.filter(m => m.userId !== interaction.user.id);
    await doc.save();

    // Remove from rosters (both main and sub if applicable)
    try { if (wasInMain) await removeFromRoster(String(doc._id), 'main', interaction.user.id); } catch (_) {}
    try { if (wasInSub) await removeFromRoster(String(doc._id), 'sub', interaction.user.id); } catch (_) {}

    // Notify leader via DM in Portuguese for each roster left (ignore errors)
    const when = new Date();
    const leaverUsername = interaction.user.tag || interaction.user.username;
    if (leaderId) {
      if (wasInMain) {
        await notifyLeaderOnMemberLeave(interaction.client, leaderId, {
          leaverUserId: interaction.user.id,
          leaverUsername,
          guildName: doc.name,
          roster: 'main',
          when,
        }).catch(() => {});
      }
      if (wasInSub) {
        await notifyLeaderOnMemberLeave(interaction.client, leaderId, {
          leaverUserId: interaction.user.id,
          leaverUsername,
          guildName: doc.name,
          roster: 'sub',
          when,
        }).catch(() => {});
      }
    }

    // Start guild transition cooldown (NOT related to Discord server)
    try {
      await recordGuildLeave(interaction.guild.id, interaction.user.id, String(doc._id), when);
    } catch (_) {}

    return interaction.reply({ content: '✅ You have successfully left your guild.', flags: MessageFlags.Ephemeral });
  } catch (error) {
    console.error('Error leaving guild:', error);
    const msg = { content: '❌ Could not complete the action.', flags: MessageFlags.Ephemeral };
    if (interaction.deferred || interaction.replied) return interaction.followUp(msg);
    return interaction.reply(msg);
  }
}

module.exports = { handle };

