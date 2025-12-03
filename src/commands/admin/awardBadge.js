const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, PermissionFlagsBits } = require('discord.js');
const { ContainerBuilder, TextDisplayBuilder } = require('@discordjs/builders');
const { colors, emojis } = require('../../config/botConfig');
const { listBadges } = require('../../utils/badges/badgeService');
const { replyEphemeral } = require('../../utils/core/reply');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('award-badge')
    .setDescription('Award a badge to a user or a guild')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  category: 'Admin',
  cooldown: 5,

  async execute(interaction) {
    try {
      const all = await listBadges(interaction.guild.id);
      const options = [...all.user, ...all.guild].slice(0, 25).map(b => new StringSelectMenuOptionBuilder()
        .setLabel(b.name)
        .setDescription(b.category === 'user' ? 'User badge' : 'Guild badge')
        .setValue(String(b._id))
        .setEmoji(b.animated ? { id: b.emojiId, name: b.emojiName, animated: true } : { id: b.emojiId, name: b.emojiName })
      );

      if (!options.length) {
        return replyEphemeral(interaction, { content: 'ℹ️ No badges created yet. Use /config → Badges to create one first.' });
      }

      const container = new ContainerBuilder();
      const primaryColor = typeof colors.primary === 'string'
        ? parseInt(colors.primary.replace('#', ''), 16)
        : colors.primary;
      container.setAccentColor(primaryColor);

      const titleText = new TextDisplayBuilder()
        .setContent(`# ${emojis.leaderboard} Award a Badge`);

      const descText = new TextDisplayBuilder()
        .setContent('Select a badge to award. You will then select the target and optionally add a note.');

      container.addTextDisplayComponents(titleText, descText);

      const select = new StringSelectMenuBuilder()
        .setCustomId('awardBadge:selectBadge')
        .setPlaceholder('Select a badge to award')
        .setMinValues(1).setMaxValues(1)
        .setOptions(options);

      const row = new ActionRowBuilder().addComponents(select);
      return replyEphemeral(interaction, { components: [container, row] });
    } catch (error) {
      console.error('Error in /award-badge:', error);
      return replyEphemeral(interaction, { content: '❌ Could not start the award flow.' });
    }
  }
};

