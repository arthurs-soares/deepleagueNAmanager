const { MessageFlags } = require('discord.js');
const Guild = require('../../../models/guild/Guild');
const {
  createErrorEmbed,
  createSuccessEmbed
} = require('../../../utils/embeds/embedBuilder');
const { safeDeferEphemeral } = require('../../../utils/core/ack');
const { getOrCreateRoleConfig } = require('../../../utils/misc/roleConfig');
const { logRoleAssignment } = require('../../../utils/core/roleLogger');
const { sendDmOrFallback } = require('../../../utils/dm/dmFallback');
const LoggerService = require('../../../services/LoggerService');

/**
 * Button handler for accepting a co-leader invitation via DM
 * CustomId: coLeaderInvite:accept:<guildId>:<inviterId>
 */
async function handle(interaction) {
  try {
    await safeDeferEphemeral(interaction);

    const parts = interaction.customId.split(':');
    const guildId = parts[2];
    const inviterId = parts[3] || null;

    if (!guildId) {
      const embed = createErrorEmbed(
        'Invalid invitation',
        'Missing guild information.'
      );
      return interaction.editReply({
        components: [embed],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
      });
    }

    const guildDoc = await Guild.findById(guildId);
    if (!guildDoc) {
      const embed = createErrorEmbed(
        'Guild not found',
        'This invitation refers to a guild that no longer exists.'
      );
      return interaction.editReply({
        components: [embed],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
      });
    }

    const userId = interaction.user.id;
    const members = Array.isArray(guildDoc.members)
      ? guildDoc.members
      : [];

    // Check if already a co-leader
    const existingCoLeader = members.find(
      m => m.userId === userId && m.role === 'vice-lider'
    );
    if (existingCoLeader) {
      const embed = createErrorEmbed(
        'Already co-leader',
        'You are already the co-leader of this guild.'
      );
      return interaction.editReply({
        components: [embed],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
      });
    }

    // Check co-leader limit (only 1 allowed)
    const coCount = members.filter(m => m.role === 'vice-lider').length;
    if (coCount >= 1) {
      const embed = createErrorEmbed(
        'Limit reached',
        'This guild already has a co-leader.'
      );
      return interaction.editReply({
        components: [embed],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
      });
    }

    // Check if user is the leader
    const isLeader = members.some(
      m => m.userId === userId && m.role === 'lider'
    );
    if (isLeader) {
      const embed = createErrorEmbed(
        'Invalid',
        'The guild leader cannot become co-leader.'
      );
      return interaction.editReply({
        components: [embed],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
      });
    }

    // Add as member if not already present
    const existingMember = members.find(m => m.userId === userId);
    if (!existingMember) {
      guildDoc.members = [
        ...members,
        {
          userId,
          username: interaction.user.username,
          role: 'vice-lider',
          joinedAt: new Date()
        }
      ];
    } else {
      // Promote existing member to co-leader
      existingMember.role = 'vice-lider';
    }

    await guildDoc.save();

    // Try to assign the co-leader role if configured
    await assignCoLeaderRole(interaction, guildDoc, userId, inviterId);

    // Disable buttons
    try {
      await interaction.message.edit({ components: [] });
    } catch (_) { /* ignore */ }

    // Notify inviter
    await notifyInviterOnAccept(interaction, guildDoc, inviterId, userId);

    const embed = createSuccessEmbed(
      'You are now Co-Leader!',
      `Congratulations! You have been promoted to Co-Leader of ` +
      `"${guildDoc.name}".`
    );
    return interaction.editReply({
      components: [embed],
      flags: MessageFlags.IsComponentsV2
    });
  } catch (error) {
    LoggerService.error('Error in coLeaderInviteAccept:', { error });
    const embed = createErrorEmbed('Error', 'Could not accept invitation.');
    if (interaction.deferred || interaction.replied) {
      return interaction.editReply({
        components: [embed],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
      });
    }
    return interaction.reply({
      components: [embed],
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
    });
  }
}

/**
 * Assign Discord co-leader role if configured
 */
async function assignCoLeaderRole(interaction, guildDoc, userId, inviterId) {
  const cfg = await getOrCreateRoleConfig(guildDoc.discordGuildId);
  const coRoleId = cfg?.coLeadersRoleId;
  if (!coRoleId) return;

  try {
    const discordGuild = interaction.client.guilds.cache
      .get(guildDoc.discordGuildId);
    if (!discordGuild) return;

    const role = discordGuild.roles.cache.get(coRoleId);
    const member = await discordGuild.members.fetch(userId).catch(() => null);
    if (role && member && !member.roles.cache.has(coRoleId)) {
      await member.roles.add(coRoleId);
      await logRoleAssignment(
        discordGuild,
        userId,
        coRoleId,
        role.name,
        inviterId || 'system',
        'Co-leader role assigned via invitation acceptance'
      );
    }
  } catch (_) { /* ignore role assignment errors */ }
}

/**
 * Notify the inviter that co-leader invite was accepted
 */
async function notifyInviterOnAccept(interaction, guildDoc, inviterId, userId) {
  if (!inviterId || inviterId === 'unknown') return;

  try {
    const embed = createSuccessEmbed(
      'Co-Leader Invitation Accepted',
      `User <@${userId}> (${interaction.user.username}) accepted ` +
      `your invitation to become Co-Leader of "${guildDoc.name}".`
    );

    await sendDmOrFallback(
      interaction.client,
      guildDoc.discordGuildId,
      inviterId,
      { components: [embed], flags: MessageFlags.IsComponentsV2 },
      {
        threadTitle: `Co-Leader Invite Accepted — ${guildDoc.name}`,
        reason: `Notify inviter ${inviterId} about acceptance`
      }
    );
  } catch (_) { /* ignore notification errors */ }
}

module.exports = { handle };
