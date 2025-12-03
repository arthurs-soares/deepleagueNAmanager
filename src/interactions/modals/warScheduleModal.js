// War schedule modal handler - creates war channels and confirmation
const { MessageFlags } = require('discord.js');
const War = require('../../models/war/War');
const Guild = require('../../models/guild/Guild');
const { getOrCreateServerSettings } = require('../../utils/system/serverSettings');
const { logWarCreated } = require('../../utils/misc/logEvents');
const { getOrCreateRoleConfig } = require('../../utils/misc/roleConfig');
const { validateDateParts, validateGuilds, validateWarCategory } = require('../../utils/war/warValidation');
const { collectAllowedUsers, createWarChannel } = require('../../utils/war/channelManager');
const { createWarConfirmationEmbed, createWarConfirmationButtons } = require('../../utils/war/warEmbedBuilder');
const { sendAndPin } = require('../../utils/tickets/pinUtils');

/**
 * Handle war schedule modal submission
 * CustomId: war:scheduleModal:<guildAId>:<guildBId>
 */
async function handle(interaction) {
  try {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const [, , guildAId, guildBId] = interaction.customId.split(':');
    const day = interaction.fields.getTextInputValue('day');
    const month = interaction.fields.getTextInputValue('month');
    const year = interaction.fields.getTextInputValue('year');
    const time = interaction.fields.getTextInputValue('time');

    // Validate date/time input (must be in the future)
    const dateTimeValidation = validateDateParts(day, month, year, time);
    if (!dateTimeValidation.valid) {
      return interaction.editReply({ content: dateTimeValidation.message });
    }

    // Fetch guild documents
    const [guildA, guildB] = await Promise.all([
      Guild.findById(guildAId),
      Guild.findById(guildBId)
    ]);

    // Validate guilds
    const guildValidation = validateGuilds(guildA, guildB);
    if (!guildValidation.valid) {
      return interaction.editReply({ content: guildValidation.message });
    }

    // Validate guilds are from same region
    if (guildA.region !== guildB.region) {
      return interaction.editReply({
        content: `❌ Guilds must be from the same region. ` +
          `${guildA.name} is **${guildA.region}** and ` +
          `${guildB.name} is **${guildB.region}**.`
      });
    }

    // Get server settings and validate war category for the region
    const settings = await getOrCreateServerSettings(interaction.guild.id);
    const categoryValidation = await validateWarCategory(
      settings,
      interaction.guild,
      guildA.region
    );
    if (!categoryValidation.valid) {
      return interaction.editReply({ content: categoryValidation.message });
    }

    // Get role configuration
    const roleConfig = await getOrCreateRoleConfig(interaction.guild.id);
    const roleIdsHosters = roleConfig?.hostersRoleIds || [];

    // Collect allowed users and create channel
    const allowUserIds = collectAllowedUsers(guildA, guildB, interaction.user.id);
    const warChannel = await createWarChannel(
      interaction.guild,
      categoryValidation.category,
      guildA,
      guildB,
      allowUserIds,
      roleIdsHosters
    );

    // Create war record in database
    const war = await War.create({
      discordGuildId: interaction.guild.id,
      guildAId: guildA._id,
      guildBId: guildB._id,
      scheduledAt: dateTimeValidation.dateTime,
      channelId: warChannel.id,
      requestedByGuildId: guildA._id,
    });

    // Notify allowed users
    const mentionList = Array.from(allowUserIds).map(id => `<@${id}>`).join(' ');
    if (mentionList) {
      try {
        await warChannel.send({ content: `👥 Access granted: ${mentionList}` });
      } catch (_) {}
    }

    // Note: Hosters are NOT mentioned on war creation
    // They will be mentioned only when the war is accepted by clicking the "Accept" button

    // Create and send confirmation embed (Components v2)
    const { embed } = await createWarConfirmationEmbed(guildA, guildB, dateTimeValidation.dateTime, interaction.guild);
    const confirmRow = createWarConfirmationButtons(war._id);
    await sendAndPin(warChannel, {
      components: [embed, confirmRow],
      flags: MessageFlags.IsComponentsV2
    }, { unpinOld: false });

    // Log war creation
    try {
      await logWarCreated(war, guildA.name, guildB.name, interaction.guild);
    } catch (_) {}

    // Send confirmation
    await interaction.editReply({ content: `✅ Channel created: ${warChannel.toString()}` });
  } catch (error) {
    console.error('Error in warScheduleModal:', error);
    const msg = { content: '❌ Unable to schedule war.', flags: MessageFlags.Ephemeral };
    if (interaction.deferred || interaction.replied) return interaction.followUp(msg);
    return interaction.reply(msg);
  }
}

module.exports = { handle };

