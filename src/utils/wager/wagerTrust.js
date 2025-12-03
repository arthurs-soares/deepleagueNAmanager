/**
 * Trust/K-factor multiplier based on games played
 * 0-2: 0.5, 3-4: 0.6, 5-6: 0.7, 7-9: 0.8, >=10: 1.0
 */
function getTrustMultiplier(games) {
  if (games >= 10) return 1.0;
  if (games >= 7) return 0.8;
  if (games >= 5) return 0.7;
  if (games >= 3) return 0.6;
  return 0.5;
}

module.exports = { getTrustMultiplier };

