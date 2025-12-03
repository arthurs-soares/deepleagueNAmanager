/**
 * Wager streak utilities
 * - Track win/loss streaks
 * - Provide winner multiplier by current win streak
 */

/**
 * Update streak fields based on result
 * Mutates profile fields: wagerWinStreak, wagerLossStreak, wagerMaxWinStreak
 * @param {any} winnerProfile
 * @param {any} loserProfile
 */
function updateStreaks(winnerProfile, loserProfile) {
  // Winner
  const win = Math.max(0, (winnerProfile?.wagerWinStreak || 0) + 1);
  winnerProfile.wagerWinStreak = win;
  winnerProfile.wagerLossStreak = 0;
  if ((winnerProfile?.wagerMaxWinStreak || 0) < win) {
    winnerProfile.wagerMaxWinStreak = win;
  }

  // Loser
  const lose = Math.max(0, (loserProfile?.wagerLossStreak || 0) + 1);
  loserProfile.wagerLossStreak = lose;
  loserProfile.wagerWinStreak = 0;
}

/**
 * Get multiplier for winner given current win streak AFTER the win
 * @param {number} winStreak
 * @returns {number}
 */
function getWinnerStreakMultiplier(winStreak) {
  if (winStreak >= 10) return 1.3;
  if (winStreak >= 7) return 1.2;
  if (winStreak >= 5) return 1.1;
  if (winStreak >= 3) return 1.05;
  return 1.0;
}

module.exports = { updateStreaks, getWinnerStreakMultiplier };

