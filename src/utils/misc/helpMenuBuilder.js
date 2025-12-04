const { ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { emojis } = require('../../config/botConfig');

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
        label: 'What\'s New',
        description: 'Latest updates and changes',
        value: 'whats_new',
        emoji: emojis.newEntry
      },
      {
        label: 'Commands Reference',
        description: 'All commands organized by domain',
        value: 'commands',
        emoji: emojis.commands
      },
      {
        label: 'War System',
        description: 'War tickets and management',
        value: 'war_system',
        emoji: emojis.swords
      },
      {
        label: 'Wager System',
        description: 'Player-to-player competitive matches',
        value: 'wager_system',
        emoji: emojis.dice
      },
      {
        label: 'Leaderboards',
        description: 'Rankings and leaderboards',
        value: 'leaderboard',
        emoji: emojis.trophy
      },
      {
        label: 'Administration',
        description: 'Admin panel and commands',
        value: 'admin_panel',
        emoji: emojis.admin
      },
      {
        label: 'Security',
        description: 'Rate limiting and cooldowns',
        value: 'security',
        emoji: emojis.security
      }
    ]);

  return new ActionRowBuilder().addComponents(menu);
}

module.exports = { buildHelpSelectRow };
