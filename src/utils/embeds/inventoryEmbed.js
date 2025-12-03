const { ContainerBuilder, SectionBuilder, TextDisplayBuilder, SeparatorBuilder } = require('@discordjs/builders');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { colors } = require('../../config/botConfig');

/**
 * Build inventory display using Components v2
 * @param {Array} inventoryItems - Array of inventory items with populated itemId
 * @param {Object} user - Discord user object
 * @returns {ContainerBuilder} Inventory display container
 */
function buildInventoryDisplayComponents(inventoryItems, user) {
  const container = new ContainerBuilder();

  // Set accent color
  const primaryColor = typeof colors.primary === 'string'
    ? parseInt(colors.primary.replace('#', ''), 16)
    : colors.primary;
  container.setAccentColor(primaryColor);

  // Header
  const titleText = new TextDisplayBuilder()
    .setContent(`# 🎒 ${user.username}'s Inventory`);

  container.addTextDisplayComponents(titleText);
  container.addSeparatorComponents(new SeparatorBuilder());

  // Check if inventory is empty
  if (!inventoryItems || inventoryItems.length === 0) {
    const emptyText = new TextDisplayBuilder()
      .setContent('This inventory is empty.\n\nItems can be purchased from the shop using `/shop`.');

    container.addTextDisplayComponents(emptyText);
    return container;
  }

  // Group items by category
  const itemsByCategory = {};
  for (const invItem of inventoryItems) {
    const item = invItem.itemId;
    if (!item) continue;

    const category = item.category || 'Other';
    if (!itemsByCategory[category]) {
      itemsByCategory[category] = [];
    }
    itemsByCategory[category].push(invItem);
  }

  // Display items by category
  const categories = Object.keys(itemsByCategory).sort();

  for (let catIndex = 0; catIndex < categories.length; catIndex++) {
    const category = categories[catIndex];
    const categoryItems = itemsByCategory[category];

    // Category header
    const categoryText = new TextDisplayBuilder()
      .setContent(`## ${category}`);

    container.addTextDisplayComponents(categoryText);

    // Display each item in the category
    for (let i = 0; i < categoryItems.length; i++) {
      const invItem = categoryItems[i];
      const item = invItem.itemId;

      // Build item content
      let itemContent = `**${item.name}** × ${invItem.quantity}\n`;
      itemContent += `💰 Purchase Value: ${item.price.toLocaleString()} coins each\n`;

      // Show withdrawal value if available
      if (item.withdrawalValue && item.withdrawalValue > 0) {
        itemContent += `📦 Withdrawal Value: ${item.withdrawalValue.toLocaleString()} coins each\n`;
      }

      if (item.description) {
        itemContent += `*${item.description}*\n`;
      }

      // Format acquired date
      const acquiredDate = new Date(invItem.acquiredAt);
      itemContent += `📅 Acquired: ${acquiredDate.toLocaleDateString()}`;

      if (item.iconUrl) {
        // Item with icon: Create section with thumbnail
        const itemSection = new SectionBuilder();
        const itemText = new TextDisplayBuilder()
          .setContent(itemContent);

        itemSection.addTextDisplayComponents(itemText);
        itemSection.setThumbnailAccessory(thumbnail =>
          thumbnail
            .setURL(item.iconUrl)
            .setDescription(item.name)
        );

        container.addSectionComponents(itemSection);
      } else {
        // Item without icon: Just text
        const itemText = new TextDisplayBuilder()
          .setContent(itemContent);

        container.addTextDisplayComponents(itemText);
      }

      // Add separator between items (except last item in last category)
      const isLastItem = i === categoryItems.length - 1;
      const isLastCategory = catIndex === categories.length - 1;
      if (!isLastItem || !isLastCategory) {
        container.addSeparatorComponents(new SeparatorBuilder());
      }
    }
  }

  // Footer with total count
  const totalItems = inventoryItems.reduce((sum, item) => sum + item.quantity, 0);
  const footerText = new TextDisplayBuilder()
    .setContent(`\n📦 **Total Items:** ${totalItems}`);

  container.addSeparatorComponents(new SeparatorBuilder());
  container.addTextDisplayComponents(footerText);

  return container;
}

/**
 * Build empty inventory container
 * @param {Object} user - Discord user object
 * @returns {ContainerBuilder} Empty inventory container
 */
function buildEmptyInventoryContainer(user) {
  const container = new ContainerBuilder();

  // Set accent color
  const infoColor = typeof colors.info === 'string'
    ? parseInt(colors.info.replace('#', ''), 16)
    : colors.info;
  container.setAccentColor(infoColor);

  const titleText = new TextDisplayBuilder()
    .setContent(`# 🎒 ${user.username}'s Inventory`);

  const emptyText = new TextDisplayBuilder()
    .setContent('This inventory is empty.\n\nItems can be purchased from the shop using `/shop`.');

  container.addTextDisplayComponents(titleText, emptyText);

  return container;
}

/**
 * Build action buttons for inventory (Sell, Withdraw, and Deposit)
 * @param {boolean} hasItems - Whether user has items in inventory
 * @returns {Array<ActionRowBuilder>} Array of action rows with buttons
 */
function buildInventoryActionButtons(hasItems = false) {
  const sellButton = new ButtonBuilder()
    .setCustomId('inventory:sell')
    .setLabel('Sell Items')
    .setStyle(ButtonStyle.Success)
    .setEmoji('💰')
    .setDisabled(!hasItems);

  const withdrawButton = new ButtonBuilder()
    .setCustomId('inventory:withdraw')
    .setLabel('Request Withdrawal')
    .setStyle(ButtonStyle.Primary)
    .setEmoji('📦')
    .setDisabled(!hasItems);

  const depositButton = new ButtonBuilder()
    .setCustomId('deposit:start')
    .setLabel('Deposit Items')
    .setStyle(ButtonStyle.Secondary)
    .setEmoji('💎');

  const row = new ActionRowBuilder().addComponents(
    sellButton,
    withdrawButton,
    depositButton
  );

  return [row];
}

module.exports = {
  buildInventoryDisplayComponents,
  buildEmptyInventoryContainer,
  buildInventoryActionButtons
};

