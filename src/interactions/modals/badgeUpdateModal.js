const { isGuildAdmin } = require('../../utils/core/permissions');
const { updateBadge, getBadgeById } = require('../../utils/badges/badgeService');
const { buildBadgePanel } = require('../../utils/badges/badgePanel');
const { MessageFlags } = require('discord.js');

/**
 * Handle badge update modal submit
 * CustomId: config:badges:update:<badgeId>
 */
async function handle(interaction) {
  try {
    const { guild, user, customId } = interaction;
    const [, , , badgeId] = customId.split(':');

    const member = await guild.members.fetch(user.id);
    const allowed = await isGuildAdmin(member, guild.id);
    if (!allowed) return interaction.reply({ content: '\u274c You do not have permission.', flags: MessageFlags.Ephemeral });

    const badge = await getBadgeById(badgeId);
    if (!badge || badge.discordGuildId !== guild.id) {
      return interaction.reply({ content: '\u274c Badge not found.', flags: MessageFlags.Ephemeral });
    }

    const name = (interaction.fields.getTextInputValue('name') || '').trim();
    const emoji = (interaction.fields.getTextInputValue('emoji') || '').trim();

    const res = await updateBadge({ id: badgeId, discordGuildId: guild.id, nameInput: name, emojiInput: emoji, guild });
    if (!res.ok) return interaction.reply({ content: `\u274c ${res.message}`, flags: MessageFlags.Ephemeral });

    const { embed, rows } = await buildBadgePanel(guild);
    return interaction.reply({ content: '\u2705 Badge updated.', components: [embed, ...rows], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
  } catch (error) {
    console.error('Error updating badge:', error);
    const msg = { content: '\u274c Could not update the badge.', flags: MessageFlags.Ephemeral };
    if (interaction.deferred || interaction.replied) return interaction.followUp(msg);
    return interaction.reply(msg);
  }
}

module.exports = { handle };

