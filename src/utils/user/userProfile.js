
const UserProfile = require('../../models/user/UserProfile');

async function getOrCreateUserProfile(discordUserId) {
  let doc = await UserProfile.findOne({ discordUserId });
  if (!doc) doc = await UserProfile.create({ discordUserId });
  return doc;
}

async function updateUserProfile(discordUserId, data) {
  const doc = await getOrCreateUserProfile(discordUserId);
  if ('description' in data) doc.description = data.description || '';
  if ('bannerUrl' in data) doc.bannerUrl = data.bannerUrl || null;
  if ('color' in data) doc.color = data.color || null;
  await doc.save();
  return doc;
}

module.exports = { getOrCreateUserProfile, updateUserProfile };

