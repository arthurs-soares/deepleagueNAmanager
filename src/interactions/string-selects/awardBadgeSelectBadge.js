const { ActionRowBuilder, UserSelectMenuBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');
const { ContainerBuilder, TextDisplayBuilder } = require('@discordjs/builders');
const { getBadgeById } = require('../../utils/badges/badgeService');
const Guild = require('../../models/guild/Guild');
const { colors } = require('../../config/botConfig');
const { replyEphemeral } = require('../../utils/core/reply');

/**
 * After selecting badge, ask for target depending on category
 * CustomId: awardBadge:selectBadge
 */
async function handle(interaction) {
  try {
    const id = interaction.values?.[0];
    const badge = await getBadgeById(id);
    if (!badge || badge.discordGuildId !== interaction.guild.id) {
      return replyEphemeral(interaction, { content: '❌ Badge not found.' });
    }

    if (badge.category === 'user') {
      const menu = new UserSelectMenuBuilder()
        .setCustomId(`awardBadge:selectUser:${badge._id}`)
        .setPlaceholder('Select a user to award')
        .setMinValues(1).setMaxValues(1);
      const row = new ActionRowBuilder().addComponents(menu);
      return replyEphemeral(interaction, { content: 'Select the user to award this badge.', components: [row] });
    }

    const guilds = await Guild.find({ discordGuildId: interaction.guild.id }).sort({ name: 1 }).limit(25);
    if (!guilds.length) {
      return replyEphemeral(interaction, { content: 'ℹ️ No registered guilds found.' });
    }

    const options = guilds.map(g => new StringSelectMenuOptionBuilder()
      .setLabel(g.name).setValue(String(g._id))
    );

    const select = new StringSelectMenuBuilder()
      .setCustomId(`awardBadge:selectGuild:${badge._id}`)
      .setPlaceholder('Select a guild to award')
      .setMinValues(1).setMaxValues(1)
      .setOptions(options);

    const row = new ActionRowBuilder().addComponents(select);

    const container = new ContainerBuilder();
    const primaryColor = typeof colors.primary === 'string'
      ? parseInt(colors.primary.replace('#', ''), 16)
      : colors.primary;
    container.setAccentColor(primaryColor);

    const titleText = new TextDisplayBuilder()
      .setContent('# Select guild to award');

    container.addTextDisplayComponents(titleText);

    return replyEphemeral(interaction, { components: [container, row] });
  } catch (error) {
    console.error('Error handling badge selection:', error);
    return replyEphemeral(interaction, { content: '❌ Could not proceed.' });
  }
}

module.exports = { handle };

