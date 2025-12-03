const { MessageFlags } = require('discord.js');
const { createErrorEmbed, createSuccessEmbed } = require('../../utils/embeds/embedBuilder');
const Guild = require('../../models/guild/Guild');
const { isGuildLeader } = require('../../utils/guilds/guildMemberManager');
const { isGuildAdmin } = require('../../utils/core/permissions');

/**
 * User Select handler to promote co-leader
 * CustomId: add_co_leader_user_select:<guildId>
 */
async function handle(interaction) {
  try {
    const [, guildId] = interaction.customId.split(':');
    const userId = interaction.values?.[0];
    if (!guildId || !userId) return interaction.deferUpdate();

    const guildDoc = await Guild.findById(guildId);
    if (!guildDoc) {
      const embed = createErrorEmbed('Not found', 'Guild not found.');
      return interaction.reply({ components: [embed], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
    }

    const member = await interaction.guild.members.fetch(interaction.user.id);
    const admin = await isGuildAdmin(member, interaction.guild.id);
    const isLeader = isGuildLeader(guildDoc, interaction.user.id);
    if (!admin && !isLeader) {
      const embed = createErrorEmbed('Permission denied', 'Only the current leader or a server administrator can add a co-leader.');
      return interaction.reply({ components: [embed], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
    }

    // Check if selected user is the guild leader
    if (isGuildLeader(guildDoc, userId)) {
      const embed = createErrorEmbed(
        'Invalid selection',
        'The guild leader cannot be selected as co-leader.'
      );
      return interaction.reply({
        components: [embed],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
      });
    }

    // Validate if already co-leader
    const members = Array.isArray(guildDoc.members) ? [...guildDoc.members] : [];
    const existing = members.find(m => m.userId === userId);
    if (existing && existing.role === 'vice-lider') {
      const embed = createErrorEmbed(
        'Already co-leader',
        'This user is already a co-leader in the guild.'
      );
      return interaction.reply({
        components: [embed],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
      });
    }

    // Add as member if not already in members array (no roster requirement)
    if (!existing) {
      let username = userId;
      try {
        const user = await interaction.client.users.fetch(userId);
        username = user?.username || username;
      } catch (_) {}
      const newMember = {
        userId,
        username,
        role: 'membro',
        joinedAt: new Date()
      };
      guildDoc.members = [...members, newMember];
    }

    // Limitar número máximo de co-líderes (1)
    const coCount = (guildDoc.members || []).filter(m => m.role === 'vice-lider').length;
    if (coCount >= 1) {
      const embed = createErrorEmbed('Limit reached', 'The guild already has the maximum number of co-leaders (1).');
      return interaction.reply({ components: [embed], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
    }

    // Promove a co-líder
    const target = (guildDoc.members || []).find(m => m.userId === userId);
    if (!target) {
      const embed = createErrorEmbed('Failure', 'Could not locate the member after adding.');
      return interaction.reply({ components: [embed], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
    }
    target.role = 'vice-lider';
    await guildDoc.save();

    // Grant equivalent permissions: assign co-leader role if it exists
    // Note: Role config has "coLeadersRoleId"; let's try to assign it
    const { getOrCreateRoleConfig } = require('../../utils/misc/roleConfig');
    const { logRoleAssignment } = require('../../utils/core/roleLogger');
    const cfg = await getOrCreateRoleConfig(interaction.guild.id);
    const coRoleId = cfg?.coLeadersRoleId;
    if (coRoleId) {
      try {
        const role = interaction.guild.roles.cache.get(coRoleId);
        const member = await interaction.guild.members.fetch(userId);
        if (role && member && !member.roles.cache.has(coRoleId)) {
          await member.roles.add(coRoleId);

          // Log the role assignment
          await logRoleAssignment(
            interaction.guild,
            userId,
            coRoleId,
            role.name,
            interaction.user.id,
            'Co-leader role assigned via user selection'
          );
        }
      } catch (error) {
        console.error('Error assigning co-leader role:', error);
      }
    }

    // Auditoria: se admin (não líder) adicionou co-líder
    const memberSelf = await interaction.guild.members.fetch(interaction.user.id);
    const adminAudit = await isGuildAdmin(memberSelf, interaction.guild.id);
    const leader = isGuildLeader(guildDoc, interaction.user.id);
    if (adminAudit && !leader) {
      try {
        const { auditAdminAction } = require('../../utils/misc/adminAudit');
        await auditAdminAction(interaction.guild, interaction.user.id, 'Add Co-leader', {
          guildName: guildDoc.name,
          guildId,
          targetUserId: userId,
        });
      } catch (_) {}
    }

    const container = createSuccessEmbed('Co-leader added', `User <@${userId}> successfully promoted to co-leader.`);
    return interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
  } catch (error) {
    console.error('Error adding co-leader:', error);
    const container = createErrorEmbed('Error', 'Could not complete co-leader promotion.');
    if (interaction.deferred || interaction.replied) {
      return interaction.followUp({ components: [container], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
    }
    return interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
  }
}

module.exports = { handle };

