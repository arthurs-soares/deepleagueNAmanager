/**
 * Serialize interaction options into a simple object.
 * Handles subcommands and options safely.
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @returns {Record<string, any>}
 */
function serializeOptions(interaction) {
  try {
    const data = interaction.options?.data || [];
    const obj = {};
    for (const opt of data) {
      if (opt.type === 1 || opt.type === 2) {
        obj.subcommand = opt.name;
        if (Array.isArray(opt.options)) {
          for (const sub of opt.options) obj[sub.name] = sub.value;
        }
      } else {
        obj[opt.name] = opt.value;
      }
    }
    return obj;
  } catch (_) {
    return {};
  }
}

module.exports = { serializeOptions };

