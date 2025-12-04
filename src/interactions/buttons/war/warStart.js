const { ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder
} = require('@discordjs/builders');
const { replyEphemeral } = require('../../../utils/core/reply');
const { colors, emojis } = require('../../../config/botConfig');
const { findGuildsByUser } = require('../../../utils/guilds/guildManager');
const { getOrCreateRoleConfig } = require('../../../utils/misc/roleConfig');

const REGIONS = [
  { label: `${emojis.region} NA East`, value: 'NA East' },
  { label: `${emojis.region} NA West`, value: 'NA West' },
  { label: `${emojis.region} South America`, value: 'South America' },
  { label: `${emojis.region} Europe`, value: 'Europe' }
];

/**
 * Start the war creation flow - shows region selection
 * CustomId: war:start
 */
async function handle(interaction) {
  try {
    const cfg = await getOrCreateRoleConfig(interaction.guild.id);
    const leaderId = cfg.leadersRoleId;
    const coLeaderId = cfg.coLeadersRoleId;

    if (!leaderId && !coLeaderId) {
      return replyEphemeral(interaction, {
        content: '⚠️ Leader/Co-leader roles not configured.',
      });
    }

    const member = interaction.member;
    const hasRole = Boolean(
      (leaderId && member.roles.cache.has(leaderId)) ||
      (coLeaderId && member.roles.cache.has(coLeaderId))
    );

    if (!hasRole) {
      return replyEphemeral(interaction, {
        content: '❌ You need the Leader or Co-leader role.',
      });
    }

    const userGuilds = await findGuildsByUser(
      interaction.user.id,
      interaction.guild.id
    );
    if (!userGuilds.length) {
      return replyEphemeral(interaction, {
        content: '❌ You are not a leader/co-leader of any guild.'
      });
    }

    const guildA = userGuilds[0];

    const container = new ContainerBuilder();
    const primaryColor = typeof colors.primary === 'string'
      ? parseInt(colors.primary.replace('#', ''), 16)
      : colors.primary;
    container.setAccentColor(primaryColor);

    const titleText = new TextDisplayBuilder()
      .setContent(`# ${emojis.war} War Creation Flow`);

    const descText = new TextDisplayBuilder()
      .setContent(`**Your Guild:** ${guildA.name}`);

    container.addTextDisplayComponents(titleText, descText);
    container.addSeparatorComponents(new SeparatorBuilder());

    const footerText = new TextDisplayBuilder()
      .setContent('*Select the region of your opponent*');
    container.addTextDisplayComponents(footerText);

    const regionSelect = new StringSelectMenuBuilder()
      .setCustomId(`war:selectRegion:${guildA._id}`)
      .setPlaceholder('Select opponent region')
      .addOptions(REGIONS);

    const row = new ActionRowBuilder().addComponents(regionSelect);

    return replyEphemeral(interaction, { components: [container, row] });
  } catch (error) {
    const LoggerService = require('../../../services/LoggerService');
    LoggerService.error('Error in war:start button:', error);
    return replyEphemeral(interaction, {
      content: '❌ Could not start the flow.'
    });
  }
}

module.exports = { handle };

