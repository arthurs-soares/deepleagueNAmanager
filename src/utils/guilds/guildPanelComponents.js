const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getUserRoleLevel } = require('./guildMemberManager');

/**
 * Check if guild has a co-leader
 * @param {object} guildDoc - Guild document
 * @returns {boolean}
 */
function hasCoLeader(guildDoc) {
  if (!guildDoc) return false;
  const members = Array.isArray(guildDoc.members) ? guildDoc.members : [];
  return members.some(m => m.role === 'vice-lider');
}

/**
 * Build guild panel components (buttons)
 * Hierarchy: Leader (3) > Co-leader (2) > Manager (1) > Member (0)
 * - Edit Roster: Leader, Co-leader, Manager
 * - Transfer Leadership: Leader only
 * - Edit Data: Leader, Co-leader
 * - Add/Change Co-leader: Leader only (or admin)
 * @param {object} guildDoc - Guild document (Mongo)
 * @param {string} [currentUserId] - ID of the user viewing the panel
 * @param {{isAdmin?:boolean}} [opts]
 * @returns {import('discord.js').ActionRowBuilder[]}
 */
function buildGuildPanelComponents(guildDoc, currentUserId, opts = {}) {
  if (!guildDoc || (!guildDoc.id && !guildDoc._id)) return [];

  const guildId = guildDoc.id || guildDoc._id;
  const isAdmin = Boolean(opts?.isAdmin);
  const userLevel = currentUserId ? getUserRoleLevel(guildDoc, currentUserId) : 0;

  // Admins have full access
  const effectiveLevel = isAdmin ? 3 : userLevel;

  const rows = [];
  const rowButtons = [];

  // Edit Roster: Level 1+ (Manager, Co-leader, Leader)
  if (effectiveLevel >= 1) {
    const editRosterBtn = new ButtonBuilder()
      .setCustomId(`guild_panel:edit_roster:${guildId}`)
      .setLabel('Edit Roster')
      .setStyle(ButtonStyle.Primary);
    rowButtons.push(editRosterBtn);
  }

  // Transfer Leadership: Level 3 only (Leader)
  if (effectiveLevel >= 3) {
    const transferLeadBtn = new ButtonBuilder()
      .setCustomId(`guild_panel:transfer_leadership:${guildId}`)
      .setLabel('Transfer Leadership')
      .setStyle(ButtonStyle.Secondary);
    rowButtons.push(transferLeadBtn);
  }

  // Edit Data: Level 2+ (Co-leader, Leader)
  if (effectiveLevel >= 2) {
    const editDataBtn = new ButtonBuilder()
      .setCustomId(`guild_panel:edit_data:${guildId}`)
      .setLabel('Edit Data')
      .setStyle(ButtonStyle.Success);
    rowButtons.push(editDataBtn);
  }

  if (rowButtons.length > 0) {
    rows.push(new ActionRowBuilder().addComponents(...rowButtons));
  }

  // Co-leader management: Level 3 only (Leader) or admin
  if (effectiveLevel >= 3) {
    const coLeaderExists = hasCoLeader(guildDoc);

    if (coLeaderExists) {
      const changeCoLeaderBtn = new ButtonBuilder()
        .setCustomId(`guild_panel:change_co_leader:${guildId}`)
        .setLabel('Change Co-leader')
        .setStyle(ButtonStyle.Secondary);
      rows.push(new ActionRowBuilder().addComponents(changeCoLeaderBtn));
    } else {
      const addCoLeaderBtn = new ButtonBuilder()
        .setCustomId(`guild_panel:add_co_leader:${guildId}`)
        .setLabel('Add Co-leader')
        .setStyle(ButtonStyle.Secondary);
      rows.push(new ActionRowBuilder().addComponents(addCoLeaderBtn));
    }
  }

  return rows;
}

module.exports = { buildGuildPanelComponents, hasCoLeader };

