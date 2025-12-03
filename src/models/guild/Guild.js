const mongoose = require('mongoose');
const { guildSchema } = require('../schemas/guildSchema');
const { applyGuildMiddleware } = require('../middleware/guildMiddleware');
const { applyGuildIndices } = require('../indices/guildIndices');
const { applyGuildStatics } = require('../statics/guildStatics');
const { applyGuildQueries } = require('../queries/guildQueries');

// Apply all enhancements to the schema
applyGuildMiddleware(guildSchema);
applyGuildIndices(guildSchema);
applyGuildStatics(guildSchema);
applyGuildQueries(guildSchema);

// Export the model
module.exports = mongoose.models.Guild || mongoose.model('Guild', guildSchema);

