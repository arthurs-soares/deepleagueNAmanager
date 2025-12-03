const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder } = require('@discordjs/builders');
const { colors, emojis } = require('../../../config/botConfig');

function buildCommandsEmbed(client) {
  const container = new ContainerBuilder();

  // Set accent color
  const primaryColor = typeof colors.primary === 'string'
    ? parseInt(colors.primary.replace('#', ''), 16)
    : colors.primary;
  container.setAccentColor(primaryColor);

  // Header
  const titleText = new TextDisplayBuilder()
    .setContent('# 📁 Commands by Category');
  const descText = new TextDisplayBuilder()
    .setContent('List of available commands, organized by category.');

  container.addTextDisplayComponents(titleText, descText);

  // Safety check
  if (!client || !client.commands || client.commands.size === 0) {
    const warningText = new TextDisplayBuilder()
      .setContent(`**${emojis.warning} No commands found**\nCommands have not been loaded yet or no commands are available.`);
    container.addTextDisplayComponents(warningText);
    return container;
  }

  const categories = {};
  client.commands.forEach((command) => {
    // Additional safety check
    if (!command || !command.data) return;

    const category = command.category || 'General';
    if (!categories[category]) categories[category] = [];
    categories[category].push(command);
  });

  // If there are no categories after processing
  if (Object.keys(categories).length === 0) {
    const warningText = new TextDisplayBuilder()
      .setContent(`**${emojis.warning} No valid commands**\nNo valid commands were found to display.`);
    container.addTextDisplayComponents(warningText);
    return container;
  }

  // Add separator before categories
  container.addSeparatorComponents(new SeparatorBuilder());

  // Add each category as a section
  Object.keys(categories)
    .sort((a, b) => a.localeCompare(b))
    .forEach((category) => {
      const list = categories[category]
        .filter(cmd => cmd && cmd.data && cmd.data.name) // Additional filter
        .map((cmd) => `\`/${cmd.data.name}\` — ${cmd.data.description || 'No description'}`)
        .join('\n');

      if (list) {
        const categoryText = new TextDisplayBuilder()
          .setContent(`**📁 ${category}**\n${list}`);
        container.addTextDisplayComponents(categoryText);
      }
    });

  return container;
}

module.exports = { buildCommandsEmbed };

