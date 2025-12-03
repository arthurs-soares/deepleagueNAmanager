const { Events } = require('discord.js');

module.exports = {
  name: Events.MessageCreate,
  once: false,

  /**
   * Modmail removed: no-op messageCreate handler
   */
  async execute(_message) {
    // Intentionally left blank (Modmail disabled)
    return;
  }
};
