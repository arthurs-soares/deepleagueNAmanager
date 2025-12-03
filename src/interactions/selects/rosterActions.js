const { ActionRowBuilder, UserSelectMenuBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const { createErrorEmbed } = require('../../utils/embeds/embedBuilder');
const { isGuildAdmin } = require('../../utils/core/permissions');
const Guild = require('../../models/guild/Guild');

/**
 * Roster actions select handler
 * Expected CustomId: roster_actions:<guildId>
 * Possible values: add_main | add_sub | remove_main | remove_sub
 * After selecting an action, opens a User Select Menu.
 * @param {StringSelectMenuInteraction} interaction
 */
async function handle(interaction) {
  try {
    const [, guildId] = interaction.customId.split(':');
    if (!guildId) {
      const embed = createErrorEmbed('Invalid data', 'GuildId not provided.');
      return interaction.reply({ components: [embed], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
    }

    const value = interaction.values?.[0];
    if (!value) return interaction.deferUpdate();

    // value: add_main | add_sub | remove_main | remove_sub | remove_co_leader_external
    const valid = ['add_main', 'add_sub', 'remove_main', 'remove_sub', 'remove_co_leader_external'];
    if (!valid.includes(value)) return interaction.deferUpdate();

    // Marca no customId se quem abriu é admin para liberar etapas seguintes
    const member = await interaction.guild.members.fetch(interaction.user.id);
    const admin = await isGuildAdmin(member, interaction.guild.id);

    // For removal operations, allow selecting ANY roster member, including users who left the server
    if (value === 'remove_main' || value === 'remove_sub') {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });

      const guildDoc = await Guild.findById(guildId);
      if (!guildDoc) {
        const embed = createErrorEmbed('Guild not found', 'Could not find the guild in the database.');
        return interaction.editReply({ components: [embed], flags: MessageFlags.IsComponentsV2 });
      }

      const rosterField = value === 'remove_main' ? 'mainRoster' : 'subRoster';
      const rosterMembers = Array.isArray(guildDoc[rosterField]) ? guildDoc[rosterField] : [];

      if (rosterMembers.length === 0) {
        const rosterName = value === 'remove_main' ? 'Main Roster' : 'Sub Roster';
        const embed = createErrorEmbed('No members to remove', `The ${rosterName} is currently empty.`);
        return interaction.editReply({ components: [embed], flags: MessageFlags.IsComponentsV2 });
      }

      // Build options for ALL roster members
      const options = [];
      for (const userId of rosterMembers) {
        let labelBase = null;
        let left = false;
        try {
          const discordMember = await interaction.guild.members.fetch(userId);
          if (discordMember) {
            labelBase = discordMember.displayName || discordMember.user.username || discordMember.user.tag;
          }
        } catch (_) {
          left = true;
          // Try to use last known username from guildDoc.members
          const known = Array.isArray(guildDoc.members) ? guildDoc.members.find(m => m.userId === userId) : null;
          labelBase = known?.username || `ID: ${userId}`;
        }

        const rosterLabel = value === 'remove_main' ? 'Main' : 'Sub';
        const label = (left ? `${labelBase} (left)` : labelBase).slice(0, 80);
        const description = `Remove from ${rosterLabel} Roster${left ? ' — left server' : ''}`.slice(0, 100);
        options.push({ label, value: userId, description });
      }

      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId(`roster_member_select:${guildId}:${value}:${admin ? 'admin' : 'user'}`)
        .setPlaceholder('Choose a member to remove from the roster')
        .setMinValues(1)
        .setMaxValues(1)
        .addOptions(options);

      const row = new ActionRowBuilder().addComponents(selectMenu);
      return interaction.editReply({ components: [row] });
    }

    // Special action: remove co-leader who is not on current rosters
    if (value === 'remove_co_leader_external') {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const guildDoc = await Guild.findById(guildId);
      if (!guildDoc) {
        const embed = createErrorEmbed('Guild not found', 'Could not find the guild in the database.');
        return interaction.editReply({ components: [embed], flags: MessageFlags.IsComponentsV2 });
      }

      const members = Array.isArray(guildDoc.members) ? guildDoc.members : [];
      const co = members.find(m => m.role === 'vice-lider');
      if (!co) {
        const embed = createErrorEmbed('No co-leader', 'This guild does not have a co-leader recorded.');
        return interaction.editReply({ components: [embed], flags: MessageFlags.IsComponentsV2 });
      }

      const inMain = (guildDoc.mainRoster || []).includes(co.userId);
      const inSub = (guildDoc.subRoster || []).includes(co.userId);
      if (inMain || inSub) {
        const embed = createErrorEmbed('Co-leader is in roster', 'The co-leader is currently on a roster. Use the Remove Main/Sub options instead.');
        return interaction.editReply({ components: [embed], flags: MessageFlags.IsComponentsV2 });
      }

      // Build confirmation buttons
      const display = co.username || co.userId;
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`coLeader:removeConfirm:${guildId}:${co.userId}:yes`)
          .setLabel('Confirm remove')
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId(`coLeader:removeConfirm:${guildId}:${co.userId}:no`)
          .setLabel('Cancel')
          .setStyle(ButtonStyle.Secondary)
      );

      return interaction.editReply({ content: `Are you sure you want to remove co-leader ${display}? This will demote them and remove any co-leader role.`, components: [row] });
    }

    // For add operations, use the original UserSelectMenuBuilder
    const userSelect = new UserSelectMenuBuilder()
      .setCustomId(`roster_user_select:${guildId}:${value}:${admin ? 'admin' : 'user'}`)
      .setPlaceholder('Choose a user to apply the selected action')
      .setMinValues(1)
      .setMaxValues(1);

    const row = new ActionRowBuilder().addComponents(userSelect);

    // Responde de forma efêmera com o User Select Menu
    return interaction.reply({ components: [row], flags: MessageFlags.Ephemeral });
  } catch (error) {
    console.error('Error in roster actions select:', error);
    const embed = createErrorEmbed('Error', 'Could not open the user selector.');
    if (interaction.deferred || interaction.replied) {
      return interaction.followUp({ components: [embed], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
    }
    return interaction.reply({ components: [embed], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
  }
}

module.exports = { handle };

