const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags
} = require('discord.js');
const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder
} = require('@discordjs/builders');
const {
  createErrorEmbed,
  createSuccessEmbed
} = require('../../utils/embeds/embedBuilder');
const { removeFromRoster, getGuildById } = require('../../utils/roster/rosterManager');
const { formatRosterCounts } = require('../../utils/roster/rosterUtils');
const { isGuildAdmin } = require('../../utils/core/permissions');
const { isGuildLeader } = require('../../utils/guilds/guildMemberManager');
const { auditAdminAction } = require('../../utils/misc/adminAudit');
const { recordGuildLeave } = require('../../utils/rate-limiting/guildTransitionCooldown');
const { colors, emojis } = require('../../config/botConfig');
const LoggerService = require('../../services/LoggerService');

/**
 * User Select Menu handler to choose user for roster action
 * Expected CustomId: roster_user_select:<guildId>:<action>
 * action: add_main | add_sub | remove_main | remove_sub
 * @param {UserSelectMenuInteraction} interaction
 */
async function handle(interaction) {
  try {
    const parts = interaction.customId.split(':');
    const guildId = parts[1];
    const action = parts[2];
    // source unused but kept for customId consistency

    if (!guildId || !action) {
      const embed = createErrorEmbed('Invalid data', 'Insufficient information to process the action.');
      return interaction.reply({ components: [embed], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
    }

    const userId = interaction.values?.[0];
    if (!userId) return interaction.deferUpdate();

    const map = {
      add_main: { type: 'add', roster: 'main' },
      add_sub: { type: 'add', roster: 'sub' },
      remove_main: { type: 'remove', roster: 'main' },
      remove_sub: { type: 'remove', roster: 'sub' },
    };

    const conf = map[action];
    if (!conf) return interaction.deferUpdate();

    // Acknowledge early to avoid 10062
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const guildDoc = await getGuildById(guildId);

    if (conf.type === 'add') {
      // Build confirmation before sending DM invite
      let targetUser = null;
      try {
        targetUser = await interaction.client.users.fetch(userId);
      } catch (_) { /* ignore */ }

      const username = targetUser?.username || userId;
      const rosterLabel = conf.roster === 'main' ? 'Main Roster' : 'Sub Roster';

      const container = new ContainerBuilder();
      const warningColor = typeof colors.warning === 'string'
        ? parseInt(colors.warning.replace('#', ''), 16)
        : colors.warning;
      container.setAccentColor(warningColor);

      const titleText = new TextDisplayBuilder()
        .setContent(`# ${emojis.warning || '⚠️'} Confirm Roster Invite`);

      const descText = new TextDisplayBuilder()
        .setContent(
          `Are you sure you want to invite the following user ` +
          `to join the **${rosterLabel}** of **${guildDoc?.name || 'Unknown'}**?`
        );

      const userText = new TextDisplayBuilder()
        .setContent(
          `**User:** <@${userId}>\n` +
          `**Username:** ${username}\n` +
          `**Roster:** ${rosterLabel}`
        );

      container.addTextDisplayComponents(titleText);
      container.addSeparatorComponents(new SeparatorBuilder());
      container.addTextDisplayComponents(descText);
      container.addTextDisplayComponents(userText);

      const confirmBtn = new ButtonBuilder()
        .setCustomId(`rosterInvite:sendConfirm:${guildId}:${conf.roster}:${userId}:yes`)
        .setLabel('Confirm')
        .setStyle(ButtonStyle.Success);

      const cancelBtn = new ButtonBuilder()
        .setCustomId(`rosterInvite:sendConfirm:${guildId}:${conf.roster}:${userId}:no`)
        .setLabel('Cancel')
        .setStyle(ButtonStyle.Secondary);

      const row = new ActionRowBuilder().addComponents(confirmBtn, cancelBtn);

      return interaction.editReply({
        components: [container, row],
        flags: MessageFlags.IsComponentsV2
      });
    }

    // Remove flows still execute immediately
    const result = await removeFromRoster(guildId, conf.roster, userId);
    if (!result.success) {
      let msg = result.message || 'Failed to process the action.';
      if (msg.includes('Usuário não está neste roster')) msg = 'User is not in this roster.';
      if (msg.includes('Guilda não encontrada')) msg = 'Guild not found.';
      const embed = createErrorEmbed('Action not completed', msg);
      return interaction.editReply({ components: [embed], flags: MessageFlags.IsComponentsV2 });
    }

    // Record guild transition cooldown for the removed user
    try {
      await recordGuildLeave(
        interaction.guild.id,
        userId,
        guildId,
        new Date()
      );
    } catch (_) { /* ignore cooldown errors */ }

    // Audit admin action on removal
    const memberSelf = await interaction.guild.members.fetch(interaction.user.id);
    const admin = await isGuildAdmin(memberSelf, interaction.guild.id);
    const leader = isGuildLeader(guildDoc, interaction.user.id);
    if (admin && !leader) {
      try {
        await auditAdminAction(interaction.guild, interaction.user.id, 'Edit Roster', {
          guildName: guildDoc?.name,
          guildId,
          targetUserId: userId,
          extra: `Action: ${action}`,
        });
      } catch (_) {}
    }

    const counts = formatRosterCounts(result.guild || guildDoc);
    const embed = createSuccessEmbed('Success', `${result.message}\n\n${counts}`);
    return interaction.editReply({ components: [embed], flags: MessageFlags.IsComponentsV2 });
  } catch (error) {
    LoggerService.error('Roster User Select error:', { error });
    const embed = createErrorEmbed('Error', 'Could not process this action.');
    try {
      if (interaction.deferred || interaction.replied) {
        return await interaction.followUp({ components: [embed], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
      }
      return await interaction.reply({ components: [embed], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
    } catch (_) { /* ignore */ }
  }
}

module.exports = { handle };

