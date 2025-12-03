const { ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder } = require('@discordjs/builders');
const { replyEphemeral } = require('../../../utils/core/reply');
const { colors } = require('../../../config/botConfig');
const Guild = require('../../../models/guild/Guild');
const { findGuildsByUser } = require('../../../utils/guilds/guildManager');
const { getOrCreateRoleConfig } = require('../../../utils/misc/roleConfig');

/**
 * Start the war creation flow
 * CustomId: war:start
 */
async function handle(interaction) {
  try {
    // Permission: needs to have the configured Leader or Co-leader role
    const cfg = await getOrCreateRoleConfig(interaction.guild.id);
    const leaderId = cfg.leadersRoleId;
    const coLeaderId = cfg.coLeadersRoleId;

    if (!leaderId && !coLeaderId) {
      return replyEphemeral(interaction, {
        content: '⚠️ Leader/Co-leader roles not configured. Ask an administrator to configure in Configure Roles.',
      });
    }

    const member = interaction.member;
    const hasRole = Boolean(
      (leaderId && member.roles.cache.has(leaderId)) ||
      (coLeaderId && member.roles.cache.has(coLeaderId))
    );

    if (!hasRole) {
      return replyEphemeral(interaction, {
        content: '❌ You do not have permission to start wars. You need to have the Leader or Co-leader role.',
      });
    }

    // Find the user's guild(s) in the bot's guild system
    const userGuilds = await findGuildsByUser(interaction.user.id, interaction.guild.id);
    if (!userGuilds.length) {
      return replyEphemeral(interaction, { content: '❌ You are not a leader/co-leader of any registered guild.' });
    }

    const guildA = userGuilds[0];

    // List available guilds as opponents (same server, excludes own guild)
    const opponents = await Guild.find({ discordGuildId: interaction.guild.id, _id: { $ne: guildA._id } }).select('name');
    if (!opponents.length) {
      return replyEphemeral(interaction, { content: '⚠️ There are no other registered guilds to face.' });
    }

    const container = new ContainerBuilder();
    const primaryColor = typeof colors.primary === 'string'
      ? parseInt(colors.primary.replace('#', ''), 16)
      : colors.primary;
    container.setAccentColor(primaryColor);

    const titleText = new TextDisplayBuilder()
      .setContent('# War Creation Flow');

    const descText = new TextDisplayBuilder()
      .setContent(`War: ${guildA.name} VS Not Defined`);

    container.addTextDisplayComponents(titleText, descText);

    // If there are more than 125 opponents, we must truncate due to Discord limits (max 5 rows * 25 options)
    if (opponents.length > 125) {
      const infoText = new TextDisplayBuilder()
        .setContent('**ℹ️ Info**\nOpponent list was truncated to 125 items due to Discord limits. Please refine using filters/commands.');
      container.addTextDisplayComponents(infoText);
    }

    container.addSeparatorComponents(new SeparatorBuilder());

    const footerText = new TextDisplayBuilder()
      .setContent('*Select the opponent guild from the menu below*');
    container.addTextDisplayComponents(footerText);

    // Discord StringSelectMenu supports up to 25 options, so chunk if needed
    const { chunkArray } = require('../../../utils/misc/array');
    const optionChunks = chunkArray(opponents, 25).slice(0, 5);

    const rows = optionChunks.map((chunk, idx) => {
      const select = new StringSelectMenuBuilder()
        .setCustomId(`war:selectOpponent:${guildA._id}:${idx}`)
        .setPlaceholder(idx === 0 ? 'Select opponent guild' : `More options (${idx + 1}/${optionChunks.length})`)
        .addOptions(chunk.map(g => ({ label: g.name, value: String(g._id) })));
      return new ActionRowBuilder().addComponents(select);
    });

    return replyEphemeral(interaction, { components: [container, ...rows] });
  } catch (error) {
    console.error('Error in war:start button:', error);
    return replyEphemeral(interaction, { content: '❌ Could not start the flow.' });
  }
}

module.exports = { handle };

