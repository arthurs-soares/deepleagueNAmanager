/**
 * Parse human duration like "1d 2h 30m" or "90m" into milliseconds.
 * Supported units: d (days), h (hours), m (minutes), s (seconds)
 * Returns null for invalid or zero/negative durations.
 * Pure utility, no side effects.
 */
function parseDurationToMs(input) {
  if (!input) return null;
  const str = String(input).toLowerCase().trim();
  if (!str) return null;

  // Accept forms like "1d2h", "1d 2h 30m", "45m", "120s"
  const regex = /(\d+)\s*([dhms])/g;
  let match;
  let total = 0;
  let any = false;
  while ((match = regex.exec(str)) !== null) {
    const value = parseInt(match[1], 10);
    const unit = match[2];
    if (!Number.isFinite(value) || value < 0) return null;
    any = true;
    switch (unit) {
      case 'd': total += value * 24 * 60 * 60 * 1000; break;
      case 'h': total += value * 60 * 60 * 1000; break;
      case 'm': total += value * 60 * 1000; break;
      case 's': total += value * 1000; break;
      default: return null;
    }
  }

  if (!any || total <= 0) return null;
  return total;
}

module.exports = { parseDurationToMs };

