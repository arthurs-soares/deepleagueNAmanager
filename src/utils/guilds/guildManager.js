const {
  registerGuild,
  addGuildToRegion,
  removeGuildFromRegion
} = require('./register');
const { listGuilds } = require('./list');
const { findGuildByName, findGuildsByUser } = require('./find');
const { updateGuild } = require('./update');
const { deleteGuild } = require('./delete');

module.exports = {
  registerGuild,
  addGuildToRegion,
  removeGuildFromRegion,
  listGuilds,
  findGuildByName,
  findGuildsByUser,
  updateGuild,
  deleteGuild,
};
