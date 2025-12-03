const cooldowns = new Map();

/**
 * Check if user is on cooldown for a specific action
 * Suporta assinaturas: (key, cooldownTime) e (userId, commandName, cooldownTime)
 * @param {string} a - key ou userId
 * @param {string|number} b - commandName ou cooldownTime
 * @param {number} c - cooldownTime, quando b for commandName
 * @returns {number|null} - segundos restantes ou null se sem cooldown
 */
function checkCooldown(a, b, c) {
  let key, cooldownTime;
  if (typeof b === 'number') {
    key = a;
    cooldownTime = b;
  } else {
    key = `${a}:${b}`;
    cooldownTime = c;
  }

  const now = Date.now();
  const cooldownAmount = cooldownTime * 1000;

  if (cooldowns.has(key)) {
    const expirationTime = cooldowns.get(key) + cooldownAmount;

    if (now < expirationTime) {
      return Math.max(0, (expirationTime - now) / 1000);
    }
  }

  return null;
}

/**
 * Set cooldown for a specific key
 * Suporta assinaturas: (key) e (userId, commandName)
 */
function setCooldown(a, b) {
  const key = b ? `${a}:${b}` : a;
  cooldowns.set(key, Date.now());

  // Clean up expired cooldowns every 5 minutos
  setTimeout(() => {
    cooldowns.delete(key);
  }, 5 * 60 * 1000).unref?.();
}

/**
 * Clear cooldown for a specific key
 * @param {string} key - Unique identifier for the cooldown
 */
function clearCooldown(key) {
  cooldowns.delete(key);
}

module.exports = {
  checkCooldown,
  setCooldown,
  clearCooldown
};
