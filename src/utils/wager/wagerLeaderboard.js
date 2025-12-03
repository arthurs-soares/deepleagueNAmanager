const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder
} = require('@discordjs/builders');
const UserProfile = require('../../models/user/UserProfile');
const { colors, emojis } = require('../../config/botConfig');

/**
 * Get rank emoji based on position
 * @param {number} rank - Position in leaderboard
 * @returns {string} Emoji for rank
 */
function getRankEmoji(rank) {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return '🏅';
}

/**
 * Build Wager leaderboard container for a server (top 15 active members)
 * Note: this filters by members present in the server.
 * @param {import('discord.js').Guild} discordGuild
 */
async function buildWagerEloLeaderboardEmbed(discordGuild) {
  // Ensure full member list and exclude bots for accurate ranking
  try { await discordGuild.members.fetch(); } catch (_) {}
  const memberIds = [...discordGuild.members.cache
    .filter(m => !m.user?.bot)
    .keys()];

  const users = await UserProfile.find({ discordUserId: { $in: memberIds } })
    .sort({ wagerWins: -1, wagerGamesPlayed: -1, wagerLosses: 1, discordUserId: 1 })
    .limit(15);

  const container = new ContainerBuilder();

  // Set accent color
  const primaryColor = typeof colors.primary === 'string'
    ? parseInt(colors.primary.replace('#', ''), 16)
    : colors.primary;
  container.setAccentColor(primaryColor);

  // Header
  const titleText = new TextDisplayBuilder()
    .setContent(`# ${emojis.leaderboard} Wager Leaderboard`);
  container.addTextDisplayComponents(titleText);

  if (!users.length) {
    const emptyText = new TextDisplayBuilder()
      .setContent(`${emojis.warning} No users found with wager stats yet.`);
    container.addTextDisplayComponents(emptyText);
  } else {
    // Stats
    const totalUsers = users.length;
    const totalGames = users.reduce((sum, u) => sum + (u.wagerGamesPlayed || 0), 0);
    const totalWins = users.reduce((sum, u) => sum + (u.wagerWins || 0), 0);

    const statsText = new TextDisplayBuilder()
      .setContent(
        `📊 **${totalUsers}** active players • ` +
        `🎮 **${totalGames}** total games • ` +
        `🏆 **${totalWins}** total wins`
      );
    container.addTextDisplayComponents(statsText);
    container.addSeparatorComponents(new SeparatorBuilder());

    // User list
    const lines = users.map((u, i) => {
      const rank = i + 1;
      const w = u.wagerWins || 0;
      const l = u.wagerLosses || 0;
      const games = u.wagerGamesPlayed || 0;
      const wr = games > 0 ? Math.round((w / games) * 100) : 0;
      const rankEmoji = getRankEmoji(rank);

      return `${rankEmoji} **#${rank}** <@${u.discordUserId}>\n` +
             `🎮 **${games}** games • **${w}W/${l}L** (${wr}%)`;
    });

    const leaderboardText = new TextDisplayBuilder()
      .setContent(lines.join('\n\n'));
    container.addTextDisplayComponents(leaderboardText);

    // Footer
    container.addSeparatorComponents(new SeparatorBuilder());
    const footerText = new TextDisplayBuilder()
      .setContent(`*${totalUsers} active players*`);
    container.addTextDisplayComponents(footerText);
  }

  return container;
}

module.exports = { buildWagerEloLeaderboardEmbed };

