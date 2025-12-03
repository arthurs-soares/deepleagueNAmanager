const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { createErrorEmbed, createSuccessEmbed, createInfoEmbed } = require('../../utils/embeds/embedBuilder');
const { isModeratorOrHoster } = require('../../utils/core/permissions');
const { findUserGuildRefs, cleanupUserFromAllGuildAssociations } = require('../../utils/roster/rosterCleanup');
const { clearAllCooldown } = require('../../utils/rate-limiting/guildTransitionOverride');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('fixuserguild')
    .setDescription('Diagnose and fix a user\'s guild association inconsistencies (admins/moderators only)')
    .addUserOption(opt =>
      opt.setName('user')
        .setDescription('User to diagnose/fix')
        .setRequired(true)
    )
    .addBooleanOption(opt =>
      opt.setName('apply')
        .setDescription('Apply the fix (otherwise runs in dry-run/diagnostic mode)')
        .setRequired(false)
    )
    .addBooleanOption(opt =>
      opt.setName('force_remove_leader')
        .setDescription('Also remove if the user is a leader in some guild (dangerous)')
        .setRequired(false)
    )
    .addBooleanOption(opt =>
      opt.setName('clear_cooldown')
        .setDescription('Clear guild transition cooldown for this user (default: true)')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  category: 'Admin',
  cooldown: 5,

  /**
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    try {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });

      const member = await interaction.guild.members.fetch(interaction.user.id);
      const allowed = await isModeratorOrHoster(member, interaction.guild.id);
      if (!allowed) {
        const container = createErrorEmbed('Permission denied', 'Only administrators, moderators or hosters can use this command.');
        return interaction.editReply({ components: [container] });
      }

      const target = interaction.options.getUser('user', true);
      const apply = interaction.options.getBoolean('apply') || false;
      const forceRemoveLeader = interaction.options.getBoolean('force_remove_leader') || false;
      const clearCooldown = interaction.options.getBoolean('clear_cooldown');

      // 1) Diagnose
      const refs = await findUserGuildRefs(interaction.guild.id, target.id);
      if (!refs.length) {
        const container = createInfoEmbed('No associations found', `User <@${target.id}> is not referenced in any guild document in this server.`);
        return interaction.editReply({ components: [container] });
      }

      // Build summary
      const lines = refs.map(r => {
        const f = r.refs;
        const tags = [
          f.leader ? 'leader' : (f.coLeader ? 'co-leader' : (f.member ? 'member' : null)),
          f.main ? 'main' : null,
          f.sub ? 'sub' : null,
        ].filter(Boolean);
        return `• ${r.name} — ${tags.join(', ')}`;
      });

      if (!apply) {
        const container = createInfoEmbed('Diagnostic results', [
          `Found ${refs.length} guild reference(s) for <@${target.id}>:`,
          ...lines,
          '',
          'Run again with apply=true to remove from rosters and members (leaders are preserved unless force_remove_leader=true).'
        ].join('\n'));
        return interaction.editReply({ components: [container] });
      }

      // 2) Apply fix
      const res = await cleanupUserFromAllGuildAssociations(
        interaction.client,
        interaction.guild.id,
        target.id,
        {
          notifyLeaders: true,
          recordCooldown: false, // Admin repair: do not set cooldowns for stale data fixes
          removeFromMembers: true,
          forceRemoveLeader,
          leaverUsername: target.username,
          when: new Date(),
        }
      );

      // Optionally clear cooldown so the user can join immediately
      if (clearCooldown !== false) {
        try { await clearAllCooldown(interaction.guild.id, target.id); } catch (_) {}
      }

      const container = createSuccessEmbed(
        'User guild associations fixed',
        [
          `Processed ${res.affected} guild(s).`,
          `Updated ${res.changed} record(s).`,
          forceRemoveLeader ? 'Leaders were removed when matched.' : 'Leaders were preserved.',
          (clearCooldown !== false) ? 'Transition cooldown cleared.' : 'Transition cooldown not modified.'
        ].join('\n')
      );
      return interaction.editReply({ components: [container] });
    } catch (error) {
      const container = createErrorEmbed('Error', error?.message || 'Could not fix user guild associations.');
      if (interaction.deferred || interaction.replied) return interaction.followUp({ components: [container], flags: MessageFlags.Ephemeral });
      return interaction.reply({ components: [container], flags: MessageFlags.Ephemeral });
    }
  }
};

