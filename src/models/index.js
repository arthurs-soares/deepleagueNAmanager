/**
 * Guild model components index
 * Provides easy access to all guild-related modules
 */

const Guild = require('./guild/Guild');
const { guildSchema, memberSchema } = require('./schemas/guildSchema');
const { applyGuildMiddleware } = require('./middleware/guildMiddleware');
const { applyGuildIndices, getGuildIndices } = require('./indices/guildIndices');
const { applyGuildStatics } = require('./statics/guildStatics');
const { applyGuildQueries } = require('./queries/guildQueries');

module.exports = {
  Guild,
  guildSchema,
  memberSchema,
  applyGuildMiddleware,
  applyGuildIndices,
  getGuildIndices,
  applyGuildStatics,
  applyGuildQueries
};
