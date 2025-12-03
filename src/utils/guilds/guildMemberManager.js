const Guild = require('../../models/guild/Guild');
const { normalizeRoleToPortuguese } = require('../core/roleMapping');

/**
 * Guild member management utilities
 * - Uniqueness rules: only 1 leader and 1 co-leader
 * - Provides functions to check leadership and transfer leadership
 */

/**
 * Check if the user is the guild leader
 * Only considers members with role='lider'
 * @param {object} guildDoc - Guild document
 * @param {string} userId - Discord user ID
 * @returns {boolean}
 */
function isGuildLeader(guildDoc, userId) {
  if (!guildDoc || !userId) return false;

  // Check if they are in members with role='lider'
  const members = Array.isArray(guildDoc.members) ? guildDoc.members : [];
  return members.some(m => m.userId === userId && m.role === 'lider');
}

/**
 * Busca um membro por userId
 * @param {object} guildDoc
 * @param {string} userId
 */
function findMember(guildDoc, userId) {
  return (Array.isArray(guildDoc?.members) ? guildDoc.members : []).find(m => m.userId === userId);
}

/**
 * Transfer leadership to a new user
 * Ensures only one member has role='lider'.
 * @param {string} guildId - Guild document ID
 * @param {string} newLeaderId - New leader ID
 * @param {string} newLeaderName - New leader display name
 * @returns {Promise<{success:boolean, message:string, guild?:object}>}
 */
async function transferLeadership(guildId, newLeaderId, newLeaderName) {
  try {
    const doc = await Guild.findById(guildId);
    if (!doc) return { success: false, message: 'Guild not found.' };

    const members = Array.isArray(doc.members) ? [...doc.members] : [];

    // Demote any current leader to 'membro'
    for (const m of members) {
      if (normalizeRoleToPortuguese(m.role) === 'lider') {
        m.role = 'membro';
      }
    }

    // Ensure the new leader is in the members list
    let target = members.find(m => m.userId === newLeaderId);
    if (!target) {
      target = {
        userId: newLeaderId,
        username: newLeaderName,
        role: 'membro',
        joinedAt: new Date(),
      };
      members.push(target);
    }

    // Promote to leader
    target.role = 'lider';

    // Update fields
    doc.members = members;
    if (newLeaderName) doc.leader = newLeaderName;

    const saved = await doc.save();
    return { success: true, message: 'Leadership transferred successfully.', guild: saved };
  } catch (error) {
    console.error('Error transferring leadership:', error);
    return { success: false, message: 'Internal error transferring leadership.' };
  }
}

/**
 * Ensures the guild has a leader in the members array
 * @param {object} guildDoc - Guild document
 * @param {string} leaderName - Leader name to display
 * @param {string} leaderId - Leader user ID (required)
 * @returns {object} - Updated document
 */
function ensureLeaderInMembers(guildDoc, leaderName, leaderId) {
  if (!guildDoc || !leaderId) return guildDoc;

  const members = Array.isArray(guildDoc.members) ? [...guildDoc.members] : [];

  // Check if already exists as leader
  const existingLeader = members.find(m => m.userId === leaderId && m.role === 'lider');
  if (existingLeader) return guildDoc;

  // Remove any previous entry of this user
  const filtered = members.filter(m => m.userId !== leaderId);

  // Add as leader
  filtered.push({
    userId: leaderId,
    username: leaderName || guildDoc.leader || leaderId,
    role: 'lider',
    joinedAt: new Date(),
  });

  guildDoc.members = filtered;
  return guildDoc;
}


module.exports = {
  isGuildLeader,
  transferLeadership,
  findMember,
  ensureLeaderInMembers,
};

