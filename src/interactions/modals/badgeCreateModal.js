const { createBadge } = require('../../utils/badges/badgeService');
const { isGuildAdmin } = require('../../utils/core/permissions');
const { replyEphemeral } = require('../../utils/core/reply');

/**
 * Handle badge creation modal submit
 * CustomIds: config:badges:create:user | config:badges:create:guild
 */
async function handle(interaction) {
  try {
    const { guild, user, customId } = interaction;
    const parts = customId.split(':');
    const category = parts[3]; // user | guild
    if (!['user', 'guild'].includes(category)) {
      return replyEphemeral(interaction, { content: '\u274c Invalid category.' });
    }

    // Permission check
    const member = await guild.members.fetch(user.id);
    const allowed = await isGuildAdmin(member, guild.id);
    if (!allowed) {
      return replyEphemeral(interaction, { content: '\u274c You do not have permission to create badges.' });
    }

    const rawName = (interaction.fields.getTextInputValue('name') || '').trim();
    const rawEmoji = (interaction.fields.getTextInputValue('emoji') || '').trim();

    const result = await createBadge({
      discordGuildId: guild.id,
      createdByUserId: user.id,
      category,
      nameInput: rawName,
      emojiInput: rawEmoji,
      guild
    });

    if (!result.ok) {
      return replyEphemeral(interaction, { content: `\u274c ${result.message}` });
    }

    return replyEphemeral(interaction, { content: '✅ Badge created successfully!' });
  } catch (error) {
    console.error('Error creating badge:', error);
    return replyEphemeral(interaction, { content: '\u274c Could not create the badge.' });
  }
}

module.exports = { handle };

