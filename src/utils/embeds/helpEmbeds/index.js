const profile = require('./profile');

module.exports = {
  ...require('./commands'),
  ...require('./logs'),
  ...require('./leaderboard'),
  ...profile,
  // Portuguese alias maintained for backward compatibility in tests
  buildPerfilEmbed: profile.buildProfileEmbed,
  ...require('./adminPanel'),
  ...require('./warSystem'),
  ...require('./security'),
  ...require('./wagerSystem'),
  ...require('./whatsNew'),
};

