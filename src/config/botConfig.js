module.exports = {
  // Bot configuration
  prefix: '!',
  ownerIds: ['YOUR_USER_ID_HERE'],

  // Colors for embeds
  colors: {
    success: 0x00ff00,
    error: 0xff0000,
    warning: 0xffff00,
    info: 0x0099ff,
    primary: 0x5865f2
  },

  // Emojis
  emojis: {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    loading: '⏳',
    info: 'ℹ️',
    guild: '🏰',
    leader: '👑',
    coLeader: '🛡️',
    status: '🏷️',
    members: '👥',
    created: '🗓️',
    rosters: '📋',
    winsLosses: '📈',
    mainRoster: '🎯',
    subRoster: '🧩',
    war: '⚔️',
    schedule: '📅',
    channel: '🗨️',
    history: '📊',
    leaderboard: '🏆',
    page: '📑',
    ticket: '🎫'
  },

  // Cooldowns (in seconds)
  cooldowns: {
    default: 3,
    moderation: 5,
    economy: 10
  }
};
