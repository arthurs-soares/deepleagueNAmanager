const { ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

/**
 * Build the dropdown (StringSelectMenu) for /help navigation
 * @returns {ActionRowBuilder}
 */
function buildHelpSelectRow() {
  const menu = new StringSelectMenuBuilder()
    .setCustomId('help:categories')
    .setPlaceholder('📚 Select a help category')
    .addOptions([
      {
        label: '🆕 What\'s New',
        description: 'Latest updates and new features',
        value: 'whats_new',
        emoji: '🆕'
      },
      {
        label: 'Commands by Category',
        description: 'List all commands organized by category',
        value: 'commands',
        emoji: '📁'
      },
      {
        label: 'Logs and Audit',
        description: 'Information about the bot\'s log system',
        value: 'logs',
        emoji: '🧾'
      },
      {
        label: 'Leaderboard',
        description: 'How the automatic leaderboard works',
        value: 'leaderboard',
        emoji: '🏆'
      },
      {
        label: 'User Profile',
        description: 'See information about the /profile command',
        value: 'profile',
        emoji: '👤'
      },
      {
        label: 'Administration Panel',
        description: 'Access and permissions for moderators/admins',
        value: 'admin_panel',
        emoji: '🛡️'
      },
      {
        label: 'War System',
        description: 'War tickets and related functionalities',
        value: 'war_system',
        emoji: '⚔️'
      },
      {
        label: 'Wager System',
        description: 'Individual wager system for players',
        value: 'wager_system',
        emoji: '🎲'
      },
      {
        label: 'Security and Limits',
        description: 'Rate limiting, cooldowns and best practices',
        value: 'security',
        emoji: '🔐'
      },
    ]);

  return new ActionRowBuilder().addComponents(menu);
}

module.exports = { buildHelpSelectRow };
