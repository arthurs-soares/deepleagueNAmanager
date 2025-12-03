/**
 * Migration for existing users to initialize user ELO fields
 */

const UserProfile = require('../../models/user/UserProfile');

/**
 * Initialize user ELO for all users missing it
 * @returns {Promise<{updated:number}>}
 */
async function runUserEloMigration() {
  const users = await UserProfile.find({
    $or: [
      { elo: { $exists: false } },
      { elo: null },
      { wins: { $exists: false } },
      { losses: { $exists: false } },
      { peakElo: { $exists: false } }
    ]
  }).select('_id elo wins losses peakElo');

  let updated = 0;
  for (const u of users) {
    let needsUpdate = false;

    if (!Number.isFinite(u.elo)) {
      u.elo = 1000;
      needsUpdate = true;
    }

    if (!Number.isFinite(u.wins)) {
      u.wins = 0;
      needsUpdate = true;
    }

    if (!Number.isFinite(u.losses)) {
      u.losses = 0;
      needsUpdate = true;
    }

    if (!Number.isFinite(u.peakElo)) {
      u.peakElo = 1000;
      needsUpdate = true;
    }

    if (needsUpdate) {
      await u.save();
      updated++;
    }
  }

  return { updated };
}

module.exports = { runUserEloMigration };
